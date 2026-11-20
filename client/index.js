import { DeliverablesStore } from '@agnes/web-client'
import { Button, Icon, IconButton } from '@agnes/web-ui'
import { HtmlPreviewFrame } from '@agnes/web-ui/conversation'
import { createElement as h, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { readResearchData } from './research-data.mjs'
import { ResearchStudio } from './studio.js'

const pageId = 'qualitative-research-studio'

const labels = {
  en: {
    button: 'Interview report',
    open: 'Open interview report in floating window',
    title: 'Interview research report',
    close: 'Close floating report',
    loading: 'Loading report…',
    error: 'The report could not be opened.',
    retry: 'Retry',
    studio: 'Interview Research',
    openStudio: 'Open workbench',
    empty: 'Open a conversation with an interview report, or run the demo from the Interview Research agent.',
    agents: 'Browse agents',
  },
  'zh-CN': {
    button: '访谈报告',
    open: '浮窗查看访谈报告',
    title: '访谈主题分析',
    close: '关闭报告浮窗',
    loading: '正在读取报告…',
    error: '暂时无法打开报告。',
    retry: '重试',
    studio: '访谈分析工作台',
    openStudio: '打开工作台',
    empty: '先打开一个已有访谈报告的会话，或从智能体启动「访谈主题分析」，发送「全量演示」。',
    agents: '前往智能体',
  },
}

function useReport(ctx, file) {
  const [attempt, setAttempt] = useState(0)
  const [preview, setPreview] = useState({ state: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    let resource
    setPreview({ state: 'loading' })
    void ctx.resources.documents
      .load({
        kind: 'html',
        laneId: file.laneId,
        artifact: file.artifact,
        signal: controller.signal,
      })
      .then((loaded) => {
        if (controller.signal.aborted) {
          loaded.release()
          return
        }
        resource = loaded
        setPreview({ state: 'ready', html: loaded.content })
      })
      .catch(() => {
        if (!controller.signal.aborted) setPreview({ state: 'error' })
      })
    return () => {
      controller.abort()
      resource?.release()
    }
  }, [ctx, file, attempt])
  return { ...preview, retry: () => setAttempt((count) => count + 1) }
}

function pageHref(page) {
  const url = new URL(window.location.href)
  url.searchParams.set('page', page)
  url.searchParams.delete('view')
  return url.pathname + url.search
}

function ReportBody({ ctx, file, t }) {
  const preview = useReport(ctx, file)
  const data = useMemo(() => readResearchData(preview.html), [preview.html])
  if (data) return h(ResearchStudio, { report: data })
  if (preview.state === 'ready') return h(HtmlPreviewFrame, { html: preview.html, title: t.title })
  if (preview.state === 'loading')
    return h('p', { className: 'qualitative-report-window__message', role: 'status' }, t.loading)
  return h(
    'div',
    { className: 'qualitative-report-window__message' },
    h('p', { role: 'alert' }, t.error),
    h(Button, { onClick: preview.retry }, t.retry),
  )
}

function ReportWindow({ ctx, file, t, target, id, close }) {
  const closeButton = useRef(null)
  const theme = useSyncExternalStore(ctx.theme.subscribe, ctx.theme.getSnapshot)
  useEffect(() => {
    closeButton.current?.focus()
  }, [])

  return createPortal(
    h(
      'dialog',
      {
        open: true,
        id,
        className: 'qualitative-report-window',
        'data-theme': theme,
        'aria-labelledby': `${id}-title`,
        onKeyDown(event) {
          if (event.key !== 'Escape') return
          event.stopPropagation()
          event.preventDefault()
          close()
        },
      },
      h(
        'header',
        { className: 'qualitative-report-window__bar' },
        h('span', { className: 'qualitative-report-window__icon' }, h(Icon, { name: 'file-text', size: 17 })),
        h('h2', { id: `${id}-title` }, t.title),
        h(Button, { href: pageHref(pageId), size: 'small' }, t.openStudio),
        h(IconButton, { name: 'x', label: t.close, ref: closeButton, onClick: close }),
      ),
      h('div', { className: 'qualitative-report-window__content' }, h(ReportBody, { ctx, file, t })),
    ),
    target,
  )
}

function ReportAction({ ctx, file }) {
  const locale = useSyncExternalStore(ctx.locale.subscribe, () => ctx.locale.locale)
  const t = labels[locale] ?? labels.en
  const [open, setOpen] = useState(false)
  const [delivery] = useState(file)
  const trigger = useRef(null)
  const id = useId()
  const close = () => {
    setOpen(false)
    trigger.current?.focus()
  }
  return h(
    'span',
    { className: 'qualitative-report-action' },
    h(
      Button,
      {
        ref: trigger,
        size: 'small',
        icon: h(Icon, { name: 'file-text', size: 15 }),
        'aria-label': t.open,
        title: t.open,
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
        onClick: () => (open ? close() : setOpen(true)),
      },
      h('span', { className: 'qualitative-report-action__label' }, t.button),
    ),
    open && h(ReportWindow, { ctx, file: delivery, t, id, target: document.body, close }),
  )
}

export function apply(ctx) {
  const store = new DeliverablesStore(ctx.agnes, ctx.session)
  const slot = 'conversation.session.header.actions'
  const matchingFile = (snapshot) =>
    snapshot.files.findLast(
      (item) =>
        item.name === 'report.html' &&
        item.description === '访谈主题分析: final' &&
        item.artifact.mime === 'text/html' &&
        item.artifact.size <= 1024 * 1024,
    )
  function StudioFile({ file, t }) {
    const [delivery] = useState(file)
    return h('div', { className: 'qr-home' }, h(ReportBody, { ctx, file: delivery, t }))
  }
  function StudioPage() {
    const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot)
    const locale = useSyncExternalStore(ctx.locale.subscribe, () => ctx.locale.locale)
    const t = labels[locale] ?? labels.en
    const file = matchingFile(snapshot)
    if (file) return h(StudioFile, { key: file.id, file, t })
    return h(
      'section',
      { className: 'qr-studio' },
      h('h1', null, t.studio),
      h(
        'p',
        { role: 'status', className: 'qr-quiet' },
        snapshot.loading && snapshot.sessionId ? t.loading : t.empty,
      ),
      h('div', null, h(Button, { href: pageHref('agents') }, t.agents)),
    )
  }
  function HeaderAction({ owner }) {
    const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot)
    if (snapshot.sessionId !== owner?.sessionId) return null
    const file = matchingFile(snapshot)
    return file ? h(ReportAction, { key: file.id, ctx, file }) : null
  }
  ctx.effect(() => () => store.dispose())
  ctx.locale.register('qualitative-research-studio', {
    en: { 'qualitative.studio.title': labels.en.studio },
    'zh-CN': { 'qualitative.studio.title': labels['zh-CN'].studio },
  })
  ctx.homeEntries.register({
    id: pageId,
    placement: 'primary',
    titleKey: 'qualitative.studio.title',
    icon: 'network',
    order: 96,
    component: StudioPage,
  })
  return ctx.slots.inject(slot, () =>
    ctx.slots.register({ name: slot, id: 'qualitative-report-window' }, HeaderAction),
  )
}
