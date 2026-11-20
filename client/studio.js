import { Icon } from '@agnes/web-ui'
import { createElement as h, useMemo, useState } from 'react'
import { researchNodes } from './research-data.mjs'

const views = ['概要', '编码图谱', '思路引导', '写作指导']
const stats = ['访谈材料', '文本字符', '开放编码', '主轴范畴']
const types = { core: '选择性编码', category: '主轴范畴', code: '开放编码' }

function Graph({ graph, chosen, onSelect }) {
  const activeGroup = chosen?.kind === 'code' ? graph.byId.get(chosen.parent) : chosen
  const node = (item) =>
    h(
      'button',
      {
        key: item.id,
        type: 'button',
        className: 'qr-node',
        'data-kind': item.kind,
        'aria-pressed': chosen?.id === item.id,
        onClick: () => onSelect(item.id),
      },
      h('small', null, item.id),
      h('span', null, item.title),
    )

  return h(
    'div',
    { className: 'qr-map-body' },
    graph.themes.length > 0 &&
      h(
        'div',
        { className: 'qr-graph-themes', role: 'group', 'aria-label': '选择性编码' },
        graph.themes.map(node),
      ),
    h(
      'div',
      { className: 'qr-graph-groups' },
      graph.groups.map((group) =>
        h(
          'div',
          {
            key: group.id,
            className: 'qr-graph-group',
            role: 'group',
            'aria-label': group.title,
            'data-related': activeGroup?.id === group.id || group.themes.includes(chosen?.id),
          },
          h(
            'div',
            { className: 'qr-graph-category' },
            node(group),
            group.themes.length > 0 &&
              h('small', { className: 'qr-theme-refs', 'aria-label': '关联主题' }, group.themes.join(' · ')),
          ),
          h('div', { className: 'qr-graph-codes' }, group.children.map(node)),
        ),
      ),
    ),
    graph.nodes.length === 0 && h('p', { className: 'qr-quiet' }, '暂无编码。'),
  )
}

function Inspector({ item, onSelect }) {
  return h(
    'aside',
    { className: 'qr-card qr-inspector', 'aria-label': '证据详情' },
    h('div', { className: 'qr-bar' }, h('h2', null, '证据详情'), h('span', null, item?.id)),
    h(
      'div',
      { className: 'qr-inspector-body' },
      !item && h('p', { className: 'qr-quiet' }, '暂无证据。'),
      item && h('p', { className: 'qr-kicker' }, types[item.kind]),
      item && h('h3', null, item.title),
      item?.text && h('p', { className: 'qr-description' }, item.text),
      item?.children.length > 0 &&
        h(
          'div',
          { className: 'qr-descendants' },
          item.children.map((child) =>
            h('button', { key: child.id, type: 'button', onClick: () => onSelect(child.id) }, child.title),
          ),
        ),
      item?.evidence &&
        h(
          'div',
          { className: 'qr-evidence' },
          h(
            'p',
            { className: 'qr-quiet' },
            `标记 ${item.count} 个片段 · 展示 ${item.evidence.length} 条引文`,
          ),
          item.evidence.map(({ path, line, quote }) =>
            h(
              'figure',
              { key: `${path}:${line}` },
              h('blockquote', null, quote),
              h('figcaption', null, `${path}:${line}`),
            ),
          ),
        ),
    ),
  )
}

export function ResearchStudio({ report }) {
  const graph = useMemo(() => researchNodes(report), [report])
  const [current, setCurrent] = useState(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(1)
  const selected = graph.byId.get(current) ?? graph.nodes[0]
  const search = query.trim()
  const matches = useMemo(
    () => (search ? graph.search.search(search, { limit: 30 }).map(({ item }) => item) : []),
    [search, graph],
  )
  const select = (id) => {
    setCurrent(id)
    setActive(1)
  }
  const contents = search ? matches : graph.nodes
  return h(
    'div',
    { className: 'qr-studio' },
    h(
      'header',
      { className: 'qr-header' },
      h(
        'div',
        { className: 'qr-identity' },
        h('span', { className: 'qr-mark' }, h(Icon, { name: 'git-branch', size: 23 })),
        h('div', null, h('h1', null, '访谈分析工作台'), h('p', null, report.question)),
      ),
      h(
        'dl',
        { className: 'qr-counts' },
        report.stats.map((value, i) =>
          h('div', { key: stats[i] }, h('dt', null, stats[i]), h('dd', null, value)),
        ),
      ),
    ),
    h(
      'nav',
      { className: 'qr-steps', 'aria-label': '分析视图' },
      views.map((view, i) =>
        h(
          'button',
          {
            key: view,
            type: 'button',
            'aria-current': active === i ? 'page' : undefined,
            onClick: () => setActive(i),
          },
          view,
        ),
      ),
    ),
    active === 1
      ? h(
          'div',
          { className: 'qr-grid' },
          h(
            'aside',
            { className: 'qr-card qr-browser', 'aria-label': '编码与引文搜索' },
            h('div', { className: 'qr-bar' }, h('h2', null, '编码库'), h('span', null, contents.length)),
            h(
              'label',
              { className: 'qr-search' },
              h(Icon, { name: 'search', size: 16 }),
              h('input', {
                type: 'search',
                'aria-label': '搜索编码和引文',
                placeholder: '搜索编码、引文或文件',
                value: query,
                onChange: (event) => setQuery(event.target.value),
              }),
            ),
            h(
              'div',
              { className: 'qr-list' },
              contents.length
                ? contents.map((item) =>
                    h(
                      'button',
                      {
                        type: 'button',
                        key: item.id,
                        title: item.title,
                        'aria-current': item.id === selected?.id ? 'true' : undefined,
                        onClick: () => select(item.id),
                      },
                      h('small', { 'data-kind': item.kind }, item.id),
                      h('span', null, item.title),
                    ),
                  )
                : h('p', { className: 'qr-quiet' }, '没有匹配的编码或引文。'),
            ),
          ),
          h(
            'section',
            { className: 'qr-card qr-map', 'aria-label': '三级编码图谱' },
            h(
              'div',
              { className: 'qr-bar' },
              h('h2', null, '三级编码图谱'),
              h('span', null, '点选节点查看证据'),
            ),
            h(Graph, { graph, chosen: selected, onSelect: select }),
            h(
              'div',
              { className: 'qr-legend' },
              Object.entries(types).map(([kind, label]) =>
                h('span', { key: kind }, h('i', { 'data-kind': kind }), label),
              ),
            ),
          ),
          h(Inspector, { item: selected, onSelect: select }),
        )
      : h(
          'section',
          { className: 'qr-card qr-reading' },
          h('div', { className: 'qr-bar' }, h('h2', null, views[active])),
          active === 0
            ? h(
                'div',
                { className: 'qr-reading-body' },
                report.cores.length
                  ? graph.themes.map(({ id, title, text }) =>
                      h(
                        'article',
                        { key: title },
                        h('h3', null, title),
                        h('p', null, text),
                        h(
                          'button',
                          { className: 'qr-theme-link', type: 'button', onClick: () => select(id) },
                          '查看编码与证据',
                        ),
                      ),
                    )
                  : h('p', null, '当前材料尚未形成研究主题。'),
                h('p', { className: 'qr-quiet' }, report.coverage),
                h(
                  'details',
                  null,
                  h('summary', null, '材料清单'),
                  h(
                    'ul',
                    null,
                    report.sources.map((source) => h('li', { key: source }, source)),
                  ),
                ),
              )
            : h(
                active === 2 ? 'ul' : 'ol',
                { className: 'qr-reading-body qr-guidance' },
                (active === 2 ? report.questions : report.writing).map((text, index) =>
                  h('li', { key: `${index}:${text}` }, text),
                ),
              ),
        ),
  )
}
