import { readFileSync } from 'node:fs'
import { fallbackGuidance } from './synthesis.mjs'

const styles = readFileSync(new URL('./report.css', import.meta.url), 'utf8')
const number = new Intl.NumberFormat('en-US')
const dataset = 'Erika Džajić Uršič 的斯洛文尼亚产业共生访谈英文稿，CC BY 4.0。引文行号对应转换后的 TXT。'
const datasetUrl = 'https://doi.org/10.5281/zenodo.16910966'
const emptyCore = '已有证据尚未形成可引用的研究主题。'
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  )
const md = (value) =>
  String(value)
    .replace(/[\r\n]+/gu, ' ')
    .replace(/[\\<>&[\]!*_\x60]/gu, '\\$&')

export function researchReport({
  input,
  sources,
  counts,
  codes,
  categories,
  cores,
  discarded,
  batchCount,
  segmentCount,
}) {
  const codeById = new Map(codes.map((code) => [code.id, code]))
  const grouped = new Set(categories.flatMap(({ members }) => members))
  const unassigned = codes.filter(({ id }) => !grouped.has(id))
  const stats = [
    [number.format(sources.length), '份材料'],
    [number.format(counts.characters), '个字符'],
    [number.format(codes.length), '项开放编码'],
    [number.format(categories.length), '个主轴范畴'],
  ]
  const coverage = `移除 ${number.format(counts.removed)} 个空行或页码行，${number.format(segmentCount)} 个片段分 ${batchCount} 批分析，丢弃 ${discarded} 条无有效出处或格式错误的编码记录。`
  const linked = new Set(cores.flatMap(({ members }) => members))
  const guidance = (key) => {
    const items = [...new Set(cores.flatMap((theme) => theme[key]))]
    return items.length ? items : fallbackGuidance[key]
  }
  const questions = guidance('questions')
  const writing = guidance('writing')
  const themeSnapshots = cores.map(({ title, summary, members }) => ({ title, summary, members }))
  const studioData = JSON.stringify({
    version: 1,
    question: input.question,
    model: input.model,
    stats: stats.map(([value]) => value),
    coverage,
    codes: codes.map((code) => ({ ...code, evidence: code.evidence.slice(0, 2) })),
    categories,
    core: themeSnapshots[0] ?? null,
    cores: themeSnapshots,
    questions,
    writing,
    sources: sources.map(({ path }) => path),
  }).replaceAll('<', '\\u003c')
  const categoryMd = categories.map(
    (c) =>
      `### A ${c.id} · ${md(c.title)}\n\n${md(c.explanation)}\n\n关联编码：${c.members.map((id) => `O ${id}`).join('、')}${linked.has(c.id) ? '' : ' · 未纳入当前核心解释'}`,
  )
  const codeMd = codes.map(
    (c) =>
      `### O ${c.id} · ${md(c.label)}\n\n标记 ${c.count} 个片段${grouped.has(c.id) ? '' : '，待归类'}。\n\n${c.evidence.map(({ path, line, quote }) => `- ${md(path)}:${line} — ${md(quote)}`).join('\n')}`,
  )
  const markdown = `${[
    '# 访谈主题分析',
    `研究问题：${md(input.question)}`,
    stats.map(([value, label]) => `${value} ${label}`).join(' · '),
    coverage,
    '## 概要',
    cores.length ? `形成 ${cores.length} 个候选研究主题。` : emptyCore,
    ...cores.map(({ title, summary }) => `- **${md(title)}**：${md(summary)}`),
    '## 选择性编码',
    ...cores.map(
      ({ title, members }, index) =>
        `### S ${index + 1} · ${md(title)}\n\n关联范畴：${members.map((id) => `A ${id}`).join('、')}`,
    ),
    '## 主轴编码',
    ...categoryMd,
    '## 开放编码与原文证据',
    ...codeMd,
    '## 思路引导',
    questions.map((text) => `- ${md(text)}`).join('\n'),
    '## 写作指导',
    writing.map((text, i) => `${i + 1}. ${md(text)}`).join('\n'),
    '## 材料清单',
    input.demo ? `${dataset} [Zenodo](${datasetUrl})` : '',
    sources.map(({ path }) => `- ${md(path)}`).join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n')}\n`

  const evidence = (c) =>
    c.evidence
      .slice(0, 1)
      .map(
        ({ path, line, quote }) =>
          `<figure><blockquote>${escapeHtml(quote)}</blockquote><figcaption>${escapeHtml(path)}:${line}</figcaption></figure>`,
      )
      .join('')
  const codeDetails = (c) =>
    `<details class="code"><summary><span class="id">O${c.id}</span><span>${escapeHtml(c.label)}</span><small>${number.format(c.count)} 个片段</small></summary><div class="body">${evidence(c)}</div></details>`
  const categoryDetails = (c) =>
    `<details class="category" id="category-${c.id}"><summary><span class="id">A${c.id}</span><span>${escapeHtml(c.title)}</span><small>${c.members.length} 项开放编码</small></summary><div class="body">${c.explanation ? `<p>${escapeHtml(c.explanation)}</p>` : ''}${linked.has(c.id) ? '' : '<p class="muted">待纳入研究主题</p>'}${c.members.map((id) => codeDetails(codeById.get(id))).join('')}</div></details>`
  const list = (values, tag) =>
    `<${tag}>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</${tag}>`
  const report = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>访谈主题分析</title><style>${styles}</style>
<main>
  <header class="hero"><h1>访谈主题分析</h1><p class="question">${escapeHtml(input.question)}</p>
    <dl class="metrics">${stats.map(([value, label]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></header>
  <nav aria-label="报告章节"><a href="#overview">概要</a><a href="#coding">三级编码</a><a href="#thinking">思路引导</a><a href="#writing">写作指导</a></nav>
  <section id="overview"><h2>概要</h2>${cores.map(({ title, summary }) => `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(summary)}</p>`).join('') || `<p>${emptyCore}</p>`}<p class="muted">${coverage}</p></section>
  <section id="coding"><h2>三级编码</h2>
    <div class="core"><p class="kicker">三级 · 选择性编码${cores.length ? ` · ${cores.length} 个主题` : ''}</p>
    ${cores.map(({ title, members }) => `<h3>${escapeHtml(title)}</h3><p class="muted">关联范畴：${members.map((id) => `<a href="#category-${id}">A ${id}</a>`).join('、')}</p>`).join('') || `<p>${emptyCore}</p>`}</div>
    <h3 class="kicker">二级 · 主轴范畴</h3><p class="muted">展开范畴可查看一级开放编码和原文证据。</p>
    ${categories.map(categoryDetails).join('') || '<p class="muted">暂无可归类的主轴范畴。</p>'}
    ${unassigned.length ? `<details class="category"><summary><span>待归类的开放编码</span><small>${unassigned.length} 项</small></summary><div class="body">${unassigned.map(codeDetails).join('')}</div></details>` : ''}
  </section>
  <section id="thinking"><h2>思路引导</h2>${list(questions, 'ul')}</section>
  <section id="writing"><h2>写作指导</h2>${list(writing, 'ol')}</section>
  <footer><details><summary>材料清单 <small>${sources.length} 份</small></summary>${input.demo ? `<p>${dataset} <a href="${datasetUrl}">Zenodo</a></p>` : ''}${list(
    sources.map(({ path }) => path),
    'ul',
  )}</details></footer>
</main><script type="application/json" id="qualitative-research-data">${studioData}</script></html>`
  return { markdown, html: report }
}
