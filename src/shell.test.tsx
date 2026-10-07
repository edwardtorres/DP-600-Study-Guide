import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { Header } from './components/Header'
import { machines } from './data/machines'
import { millGraph } from './data/mill'
import { allStates } from './game/state'
import { newSave } from './save/schema'

/**
 * The static first paint in index.html (injected into #root at build by the shellHtml plugin in
 * vite.config.ts): the header in its loading state, so the page paints before any script runs.
 * It's a file snapshot of the real Header, so it can't drift: after changing the header, run
 * `npx vitest run -u src/shell.test.tsx` to rewrite src/shell.html.
 */
test('src/shell.html is the loading header, rendered from Header', async () => {
  const noop = () => {}
  const markup = renderToStaticMarkup(
    <div className="min-h-screen px-4 py-6 sm:px-8" inert>
      <Header
        loading
        machines={machines}
        states={allStates(millGraph, newSave(new Date('2026-01-01T00:00:00Z')))}
        level={{ level: 1, rank: '', xp: 0, levelStartXp: 0, nextLevelXp: 1 }}
        streak={{ current: 0, best: 0, answeredToday: 0, days: [] }}
        readiness={{ domains: [], overall: null }}
        badgesEarned={0}
        dueCount={0}
        mockActive={false}
        onOpenGlossary={noop}
        onOpenLabs={noop}
        onOpenReview={noop}
        onOpenWeak={noop}
        onOpenMock={noop}
        onOpenBadges={noop}
        onOpenSettings={noop}
      />
    </div>,
  )
  await expect(markup + '\n').toMatchFileSnapshot('./shell.html')
})
