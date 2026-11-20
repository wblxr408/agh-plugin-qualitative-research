import { readFile } from 'node:fs/promises'
import {
  defineWorkflowLoop,
  readOnlyTool,
  workflowModelText,
  workflowTool,
  workflowValue,
} from '@agnes/plugin-runtime'
import { Type } from '@sinclair/typebox'
import {
  addCodes,
  batches,
  codingPrompt,
  demoCodes,
  demoQuestion,
  demoThemes,
  modelArray,
  prepareCorpus,
  themePrompt,
} from './analysis.mjs'
import { researchReport } from './report.mjs'
import { axialCategories, demoSelectiveThemes, selectivePrompt, selectThemes } from './synthesis.mjs'

const maximumBytes = 1_600_004
const demoPaths = Array.from(
  { length: 25 },
  (_, index) => `organization-${String(index + 1).padStart(2, '0')}.txt`,
)
const inputHelp = '请输入「演示」「全量演示」，或 JSON {"files":["访谈.txt"],"question":"你的研究问题"}。'

function isTextPath(path) {
  return (
    typeof path === 'string' &&
    path.length <= 240 &&
    /\.(txt|md)$/iu.test(path) &&
    path.split('/').every((part) => part && !/[. ]$/u.test(part) && !/[\\:*?"<>|\p{Cc}]/u.test(part))
  )
}

function parseInput(text) {
  const command = text.trim().toLowerCase()
  if (['演示', 'demo', '全量演示', 'demo-full'].includes(command)) {
    return {
      demo: ['全量演示', 'demo-full'].includes(command) ? 'full' : 'sample',
      question: demoQuestion,
      model: false,
    }
  }
  let input
  try {
    input = JSON.parse(text)
  } catch {
    throw new Error(inputHelp)
  }
  const question = typeof input?.question === 'string' ? input.question.trim() : ''
  if (question.length > 1000) throw new Error('研究问题须在 1,000 字符以内。')
  if (input?.dataset === 'industrial-symbiosis') {
    if (
      !Array.isArray(input.files) ||
      input.files.length !== demoPaths.length ||
      !input.files.every(isTextPath)
    )
      throw new Error('请选择产业共生数据集的 25 份 TXT 材料。')
    const pathsByName = new Map(input.files.map((path) => [path.split('/').at(-1), path]))
    if (!demoPaths.every((name) => pathsByName.has(name)))
      throw new Error('请选择 organization-01.txt 至 organization-25.txt。')
    return {
      demo: 'full',
      files: demoPaths.map((name) => pathsByName.get(name)),
      question: demoQuestion,
      model: false,
    }
  }
  if (['sample', 'full'].includes(input?.demo) && input.files === undefined && input.model === true) {
    return { demo: input.demo, question: question || demoQuestion, model: true }
  }
  if (
    input?.demo === undefined &&
    Array.isArray(input?.files) &&
    input.files.length > 0 &&
    input.files.length <= 50 &&
    input.files.every(isTextPath) &&
    question
  ) {
    return { files: [...new Set(input.files)], question, model: true }
  }
  throw new Error(inputHelp)
}

const readPage = workflowTool(
  'qualitative_read_page',
  'Read a bounded byte range from a workspace TXT or Markdown research source.',
  Type.Object(
    {
      path: Type.String({ minLength: 1, maxLength: 240 }),
      offset: Type.Integer({ minimum: 0, maximum: maximumBytes }),
    },
    { additionalProperties: false },
  ),
  async ({ path, offset }, ctx) => {
    if (!isTextPath(path)) throw new Error('仅支持工作区内的相对 TXT 或 Markdown 路径。')
    const before = await ctx.fs.stat(path)
    if (before.kind !== 'file' || before.size > maximumBytes || offset > before.size) {
      throw new Error(`文件不是可读取的文本，或超过本次大小上限：${path}`)
    }
    // workflowTool emits both text and structured data. Leave room for base64 and framing in both.
    const limit = Math.min(12_000, Math.floor(((ctx.outputMaxBytes - 1024) * 3) / 8))
    if (limit < 256) throw new Error('当前会话的工具输出预算过小，无法读取材料。')
    const bytes = await ctx.fs.read(path, { offset, limit })
    const after = await ctx.fs.stat(path)
    if (
      after.kind !== 'file' ||
      before.mtimeMs !== after.mtimeMs ||
      before.size !== after.size ||
      bytes.length !== Math.min(limit, before.size - offset)
    ) {
      throw new Error(`材料在读取时发生变化，请重试：${path}`)
    }
    return { base64: Buffer.from(bytes).toString('base64'), size: before.size, modified: before.mtimeMs }
  },
  { ...readOnlyTool, modelVisible: false, paths: [{ arg: 'path', access: 'read' }] },
)

async function workspaceSources(ctx, paths, signal) {
  const sources = []
  let totalBytes = 0
  for (const path of paths) {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    const chunks = []
    let offset = 0
    let first
    do {
      const page = workflowValue(
        await ctx.tools.execute({ name: readPage.name, args: { path, offset } }, signal),
      )
      if (!first) {
        first = page
        totalBytes += page.size
        if (totalBytes > maximumBytes) throw new Error('所有材料的 UTF-8 总大小超出本次上限。')
      }
      if (page.size !== first.size || page.modified !== first.modified) {
        throw new Error(`材料在读取时发生变化，请重试：${path}`)
      }
      const bytes = Buffer.from(page.base64, 'base64')
      offset += bytes.length
      if (offset > first.size || (offset < first.size && bytes.length === 0)) {
        throw new Error(`材料读取不完整：${path}`)
      }
      try {
        chunks.push(decoder.decode(bytes, { stream: offset < first.size }))
      } catch {
        throw new Error(`材料必须使用有效的 UTF-8 文本编码：${path}`)
      }
    } while (offset < first.size)
    const text = chunks.join('')
    if (text.includes('\0')) throw new Error(`材料包含二进制内容：${path}`)
    sources.push({ path, text })
  }
  return sources
}

async function bundledSources(mode) {
  const paths = mode === 'sample' ? demoPaths.slice(0, 2) : demoPaths
  return Promise.all(
    paths.map(async (path) => ({
      path,
      text: await readFile(new URL(`./fixtures/${path}`, import.meta.url), 'utf8'),
    })),
  )
}

async function ask(ctx, prompt, data, signal) {
  return modelArray(await workflowModelText(ctx, prompt, data, signal))
}

async function analyze(ctx, state, signal) {
  const input = parseInput(state.input)
  const sources = input.files
    ? await workspaceSources(ctx, input.files, signal)
    : await bundledSources(input.demo)
  if (input.demo && input.files) {
    const originals = await bundledSources(input.demo)
    for (const [index, { path, text }] of sources.entries()) {
      if (text.replaceAll('\r\n', '\n') !== originals[index].text.replaceAll('\r\n', '\n'))
        throw new Error(`材料与公开数据集不一致：${path}`)
    }
  }
  const { segments, counts } = prepareCorpus(sources)
  if (input.model && segments.length > 5000)
    throw new Error('材料分成了超过 5,000 个片段，请减少材料或合并过短的行。')
  const codes = new Map()
  let discarded = 0
  let batchCount = 0
  for (const batch of batches(segments)) {
    signal.throwIfAborted()
    batchCount += 1
    const records = input.model
      ? (
          await ask(
            ctx,
            codingPrompt,
            {
              question: input.question,
              priorCodes: [...codes.values()].slice(-48).map(({ label }) => label),
              segments: batch.map(({ id, text }) => ({ id, text })),
            },
            signal,
          )
        ).slice(0, 12)
      : demoCodes(batch)
    discarded += addCodes(codes, batch, records)
  }
  const allCodes = [...codes.values()]
  const themeCandidates = [...allCodes].sort((a, b) => b.count - a.count).slice(0, 100)
  const themes = !input.model
    ? demoThemes(allCodes)
    : allCodes.length
      ? await ask(
          ctx,
          themePrompt,
          {
            question: input.question,
            codes: themeCandidates.map(({ id, label, evidence }) => ({
              id,
              label,
              example: evidence[0].quote.slice(0, 100),
            })),
          },
          signal,
        )
      : []
  const categories = axialCategories(themes, input.model ? themeCandidates : allCodes)
  const cores = categories.length
    ? selectThemes(
        input.model
          ? await ask(
              ctx,
              selectivePrompt,
              {
                question: input.question,
                categories: categories.map(({ id, title, explanation, members }) => ({
                  id,
                  title,
                  explanation,
                  evidence: members.slice(0, 4).map((codeId) => {
                    const {
                      label,
                      evidence: [example],
                    } = allCodes[codeId - 1]
                    return { label, quote: example.quote }
                  }),
                })),
              },
              signal,
            )
          : demoSelectiveThemes(categories),
        categories,
      )
    : []
  return {
    sourceCount: sources.length,
    characters: counts.characters,
    batchCount,
    report: researchReport({
      input,
      sources,
      counts,
      codes: allCodes,
      categories,
      cores,
      discarded,
      batchCount,
      segmentCount: segments.length,
    }),
  }
}

export const { main } = defineWorkflowLoop({
  id: 'fde.qualitative-research',
  version: '5.0.0',
  name: '访谈主题分析',
  tools: [readPage],
  readOnly: true,
  stages: [
    {
      name: 'clean-and-code-through-three-levels',
      run: analyze,
      message: ({ sourceCount, characters, batchCount }) =>
        '已清洗和分析 ' +
        sourceCount +
        ' 份材料（' +
        characters +
        ' 个字符，' +
        batchCount +
        ' 批）。正在生成报告。',
    },
  ],
  deliverables: {
    directory: 'fde-output/qualitative-research',
    markdown: (state) => state.data.report?.markdown,
    html: (state) => state.data.report?.html,
  },
})
