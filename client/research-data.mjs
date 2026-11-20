import { Fuse } from './vendor/research-tools.mjs'

const snapshotStart = '<script type="application/json" id="qualitative-research-data">'
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const strings = (items) => Array.isArray(items) && items.every((item) => typeof item === 'string')
const ids = (items) => Array.isArray(items) && items.every((item) => Number.isSafeInteger(item))
const nonempty = (value) => typeof value === 'string' && value.length > 0
const validTheme = (item) =>
  object(item) && nonempty(item.title) && nonempty(item.summary) && ids(item.members)
const validEvidence = (item) =>
  object(item) &&
  nonempty(item.quote) &&
  nonempty(item.path) &&
  Number.isSafeInteger(item.line) &&
  item.line > 0

export function readResearchData(html) {
  const start = html?.indexOf(snapshotStart) ?? -1
  if (start < 0) return null
  const end = html.indexOf('</script>', start + snapshotStart.length)
  if (end < 0) return null
  try {
    const data = JSON.parse(html.slice(start + snapshotStart.length, end))
    if (
      !object(data) ||
      data.version !== 1 ||
      !nonempty(data.question) ||
      typeof data.model !== 'boolean' ||
      !nonempty(data.coverage) ||
      !strings(data.sources) ||
      !strings(data.questions) ||
      !strings(data.writing) ||
      !Array.isArray(data.stats) ||
      data.stats.length !== 4 ||
      !data.stats.every(nonempty) ||
      !Array.isArray(data.categories) ||
      data.categories.length > 12 ||
      !Array.isArray(data.codes) ||
      data.codes.length > 5000 ||
      !data.categories.every(
        (c) =>
          object(c) &&
          Number.isSafeInteger(c.id) &&
          nonempty(c.title) &&
          typeof c.explanation === 'string' &&
          ids(c.members),
      ) ||
      !data.codes.every(
        (c) =>
          object(c) &&
          Number.isSafeInteger(c.id) &&
          nonempty(c.label) &&
          Number.isSafeInteger(c.count) &&
          Array.isArray(c.evidence) &&
          c.evidence.every(validEvidence),
      ) ||
      (data.core !== null && !validTheme(data.core)) ||
      (data.cores !== undefined &&
        (!Array.isArray(data.cores) || data.cores.length > 8 || !data.cores.every(validTheme)))
    )
      return null
    return { ...data, cores: data.cores ?? (data.core ? [data.core] : []) }
  } catch {
    return null
  }
}

export function researchNodes(data) {
  const byCode = new Map(data.codes.map((code) => [code.id, code]))
  const used = new Set()
  const groups = []
  const makeCode = (code, parent) => ({
    id: `O${code.id}`,
    title: code.label,
    kind: 'code',
    parent,
    count: code.count,
    children: [],
    evidence: code.evidence,
    searchable: code.evidence.map(({ quote, path }) => `${quote} ${path}`),
  })
  for (const category of data.categories) {
    const group = {
      id: `A${category.id}`,
      title: category.title,
      kind: 'category',
      text: category.explanation,
      themes: [],
      children: [],
    }
    for (const id of category.members) {
      const code = byCode.get(id)
      if (!code || used.has(id)) continue
      used.add(id)
      group.children.push(makeCode(code, group.id))
    }
    groups.push(group)
  }
  const loose = data.codes.filter(({ id }) => !used.has(id))
  if (loose.length)
    groups.push({
      id: 'U',
      title: '待归类编码',
      kind: 'category',
      themes: [],
      children: loose.map((code) => makeCode(code, 'U')),
    })
  const byGroup = new Map(groups.map((group) => [group.id, group]))
  const themes = data.cores.map(({ title, summary, members }, index) => {
    const id = `S${index + 1}`
    const children = members.map((member) => byGroup.get(`A${member}`)).filter(Boolean)
    for (const group of children) group.themes.push(id)
    return { id, kind: 'core', title, text: summary, children }
  })
  const nodes = [...themes, ...groups.flatMap((group) => [group, ...group.children])]
  return {
    themes,
    groups,
    nodes,
    byId: new Map(nodes.map((node) => [node.id, node])),
    search: new Fuse(nodes, {
      keys: [
        { name: 'title', weight: 0.8 },
        { name: 'searchable', weight: 0.2 },
      ],
      ignoreLocation: true,
      threshold: 0.38,
    }),
  }
}
