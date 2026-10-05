import { describe, expect, it } from 'vitest'
import { evaluateAccess, type AccessSetup } from './access'
import { evaluateAction, evaluateBinding, type PipelineUser } from './deployment'
import { evaluateFallback, fallbackRules, type DirectLakeBehavior, type Situation } from './fallback'
import { assertAcyclic, children, downstream } from './lineage'

describe('Shuttle Fallback evaluator (Direct Lake overview / How Direct Lake works)', () => {
  const run = (mode: 'onelake' | 'sql', behavior: DirectLakeBehavior, situation: Situation) => evaluateFallback({ mode, behavior, situation })?.outcome ?? null

  it('encodes Learn’s DirectLakeBehavior table for Direct Lake on SQL', () => {
    // Automatic: silently falls back. DirectLakeOnly: fails. DirectQueryOnly: always DirectQuery.
    for (const s of ['sql-rls', 'sql-ols', 'sql-ddm', 'sql-view', 'unprocessed', 'guardrail'] as const) {
      expect(run('sql', 'Automatic', s)).toBe('directquery')
      expect(run('sql', 'DirectLakeOnly', s)).toBe('error')
      expect(run('sql', 'DirectQueryOnly', s)).toBe('directquery')
    }
    expect(run('sql', 'Automatic', 'none')).toBe('directlake')
    expect(run('sql', 'DirectLakeOnly', 'none')).toBe('directlake')
    expect(run('sql', 'DirectQueryOnly', 'none')).toBe('directquery')
  })

  it('Learn’s examples: a SQL view source and SQL-based security fall back on SQL endpoints', () => {
    expect(run('sql', 'Automatic', 'sql-view')).toBe('directquery')
    expect(run('sql', 'Automatic', 'sql-rls')).toBe('directquery')
  })

  it('Direct Lake on OneLake never falls back and ignores DirectLakeBehavior', () => {
    for (const b of ['Automatic', 'DirectLakeOnly', 'DirectQueryOnly'] as const) {
      expect(run('onelake', b, 'none')).toBe('directlake')
      // SQL RLS isn’t applied: queries succeed in Direct Lake.
      expect(run('onelake', b, 'sql-rls')).toBe('directlake')
      expect(run('onelake', b, 'unprocessed')).toBe('error')
      expect(run('onelake', b, 'guardrail')).toBe('error')
      expect(['directquery']).not.toContain(run('onelake', b, 'none'))
    }
  })

  it('returns null for combinations Learn doesn’t state outright', () => {
    expect(run('onelake', 'Automatic', 'sql-view')).toBeNull()
    expect(run('onelake', 'Automatic', 'sql-ols')).toBeNull()
    expect(run('onelake', 'Automatic', 'sql-ddm')).toBeNull()
  })

  it('every rule cites a Learn page and is reachable', () => {
    const used = new Set<string>()
    for (const mode of ['onelake', 'sql'] as const)
      for (const behavior of ['Automatic', 'DirectLakeOnly', 'DirectQueryOnly'] as const)
        for (const situation of ['none', 'sql-rls', 'sql-ols', 'sql-ddm', 'sql-view', 'unprocessed', 'guardrail'] as const) {
          const r = evaluateFallback({ mode, behavior, situation })
          if (r) used.add(r.rule.id)
        }
    expect([...used].sort()).toEqual(fallbackRules.map((r) => r.id).sort())
    for (const r of fallbackRules) expect(r.source).toMatch(/^https:\/\/learn\.microsoft\.com\//)
  })
})

describe('Access evaluator (roles table, item permissions, RLS/CLS/OLS/DDM)', () => {
  const setup: AccessSetup = {
    users: [
      { name: 'admin', role: 'Admin' },
      { name: 'member', role: 'Member' },
      { name: 'contrib', role: 'Contributor', modelRoles: ['East'] },
      { name: 'viewer', role: 'Viewer', modelRoles: ['East'] },
      { name: 'viewer2', role: 'Viewer', modelRoles: ['East', 'West'] },
      { name: 'reader', item: ['Read'] },
      { name: 'readData', item: ['Read', 'ReadData'] },
      { name: 'readAll', item: ['Read', 'ReadAll'] },
      // Learn's CLS example: Charlie may read every Customers column except CreditCard.
      { name: 'charlie', item: ['Read'], grants: [{ table: 'Customers', columns: ['CustomerID', 'FirstName', 'LastName', 'Phone', 'Email'] }] },
      { name: 'unmasked', item: ['Read', 'ReadData'], unmask: true },
      { name: 'nobody' },
    ],
    warehouseRls: { table: 'Sales', column: 'Region', allow: { admin: ['East'] } },
    masked: [{ table: 'Customers', column: 'Email' }],
    modelRls: [
      { role: 'East', column: 'Region', values: ['East'] },
      { role: 'West', column: 'Region', values: ['West'] },
    ],
    rlsValues: ['East', 'North', 'West'],
    modelOls: [{ role: 'East', column: 'Salary' }],
  }
  const bool = (q: Parameters<typeof evaluateAccess>[1]) => {
    const a = evaluateAccess(setup, q)
    if (a.kind !== 'bool') throw new Error('expected bool')
    return a.value
  }
  const set = (q: Parameters<typeof evaluateAccess>[1]) => {
    const a = evaluateAccess(setup, q)
    if (a.kind !== 'set') throw new Error('expected set')
    return a.value
  }

  it('follows the workspace roles table', () => {
    expect(bool({ kind: 'action', user: 'admin', action: 'update-delete-workspace' })).toBe(true)
    expect(bool({ kind: 'action', user: 'member', action: 'update-delete-workspace' })).toBe(false)
    expect(bool({ kind: 'action', user: 'member', action: 'add-members' })).toBe(true)
    expect(bool({ kind: 'action', user: 'member', action: 'add-admins' })).toBe(false)
    expect(bool({ kind: 'action', user: 'contrib', action: 'share-item' })).toBe(false)
    expect(bool({ kind: 'action', user: 'contrib', action: 'write-notebook' })).toBe(true)
    expect(bool({ kind: 'action', user: 'viewer', action: 'run-pipeline' })).toBe(false)
    expect(bool({ kind: 'action', user: 'viewer', action: 'view-pipeline-output' })).toBe(true)
    expect(bool({ kind: 'action', user: 'member', action: 'connect-git' })).toBe(false)
  })

  it('follows the item permission defaults table (Read / ReadData / ReadAll)', () => {
    expect(bool({ kind: 'connect', user: 'reader' })).toBe(true)
    expect(bool({ kind: 'connect', user: 'nobody' })).toBe(false)
    expect(bool({ kind: 'sql-select', user: 'reader', table: 'Sales', columns: ['Region'] })).toBe(false)
    expect(bool({ kind: 'sql-select', user: 'readData', table: 'Sales', columns: ['Region'] })).toBe(true)
    expect(bool({ kind: 'sql-select', user: 'viewer', table: 'Sales', columns: ['Region'] })).toBe(true)
    expect(bool({ kind: 'spark-read', user: 'viewer' })).toBe(false)
    expect(bool({ kind: 'spark-read', user: 'contrib' })).toBe(true)
    expect(bool({ kind: 'spark-read', user: 'readAll' })).toBe(true)
    // ReadData and ReadAll don't overlap.
    expect(bool({ kind: 'spark-read', user: 'readData' })).toBe(false)
    expect(bool({ kind: 'sql-select', user: 'readAll', table: 'Sales', columns: ['Region'] })).toBe(false)
  })

  it('Learn’s column-level security example: SELECT * fails when CreditCard isn’t granted', () => {
    expect(bool({ kind: 'sql-select', user: 'charlie', table: 'Customers', columns: ['CustomerID', 'FirstName', 'LastName', 'Phone', 'Email'] })).toBe(true)
    expect(bool({ kind: 'sql-select', user: 'charlie', table: 'Customers', columns: ['CustomerID', 'FirstName', 'CreditCard', 'LastName', 'Phone', 'Email'] })).toBe(false)
  })

  it('warehouse RLS applies to admins; semantic model RLS skips Admin/Member/Contributor and is additive', () => {
    expect(set({ kind: 'sql-rows', user: 'admin' })).toEqual(['East'])
    expect(set({ kind: 'model-rows', user: 'member' })).toEqual(['East', 'North', 'West'])
    expect(set({ kind: 'model-rows', user: 'contrib' })).toEqual(['East', 'North', 'West'])
    expect(set({ kind: 'model-rows', user: 'viewer' })).toEqual(['East'])
    expect(set({ kind: 'model-rows', user: 'viewer2' })).toEqual(['East', 'West'])
  })

  it('masks for everyone except Admin/Member/Contributor or UNMASK; OLS hides only for viewers', () => {
    expect(bool({ kind: 'masked', user: 'admin', table: 'Customers', column: 'Email' })).toBe(false)
    expect(bool({ kind: 'masked', user: 'viewer', table: 'Customers', column: 'Email' })).toBe(true)
    expect(bool({ kind: 'masked', user: 'readData', table: 'Customers', column: 'Email' })).toBe(true)
    expect(bool({ kind: 'masked', user: 'unmasked', table: 'Customers', column: 'Email' })).toBe(false)
    expect(bool({ kind: 'model-column', user: 'viewer', column: 'Salary' })).toBe(false)
    expect(bool({ kind: 'model-column', user: 'contrib', column: 'Salary' })).toBe(true)
  })

  it('refuses cases Learn doesn’t settle', () => {
    expect(() => evaluateAccess({ users: [{ name: 'x', role: 'Contributor', item: ['ReadAll'] }] }, { kind: 'action', user: 'x', action: 'share-item' })).toThrow()
    expect(() => evaluateAccess({ users: [{ name: 'x', role: 'Viewer' }], modelRls: [] }, { kind: 'model-rows', user: 'x' })).toThrow()
    expect(() => evaluateAccess({ users: [{ name: 'x', item: ['Read'] }] }, { kind: 'model-rows', user: 'x' })).toThrow()
  })
})

describe('Ripple evaluator (impact analysis)', () => {
  const edges: [string, string][] = [
    ['nb', 'lh'],
    ['lh', 'sm'],
    ['sm', 'rp'],
    ['rp', 'db'],
    ['lh', 'df'],
  ]
  it('lists direct children and all downstream items, never upstream ones', () => {
    expect(children(edges, 'lh').sort()).toEqual(['df', 'sm'])
    expect(downstream(edges, 'lh').sort()).toEqual(['db', 'df', 'rp', 'sm'])
    expect(downstream(edges, 'lh')).not.toContain('nb')
    expect(downstream(edges, 'db')).toEqual([])
  })
  it('detects cycles', () => {
    expect(() => assertAcyclic(['a', 'b'], [['a', 'b'], ['b', 'a']])).toThrow()
    expect(() => assertAcyclic(['nb', 'lh', 'sm', 'rp', 'db', 'df'], edges)).not.toThrow()
  })
})

describe('Conveyor evaluator (deployment pipeline permissions and autobinding)', () => {
  const users: PipelineUser[] = [
    { name: 'pat', pipelineAdmin: true, roles: { Dev: 'Contributor', Test: 'Contributor', Prod: 'Viewer' }, owns: ['flow'] },
    { name: 'lee', pipelineAdmin: true, roles: {} },
    { name: 'kim', pipelineAdmin: false, roles: { Dev: 'Admin', Test: 'Admin' } },
    { name: 'ana', pipelineAdmin: true, roles: { Prod: 'Admin', Test: 'Member' } },
  ]
  const notebook = [{ name: 'nb', kind: 'notebook' as const }]
  it('deploy needs pipeline admin and Contributor+ in both stages (source only for an empty stage)', () => {
    expect(evaluateAction(users, { kind: 'deploy', user: 'pat', from: 'Dev', to: 'Test', items: notebook }).ok).toBe(true)
    expect(evaluateAction(users, { kind: 'deploy', user: 'pat', from: 'Test', to: 'Prod', items: notebook }).ok).toBe(false)
    expect(evaluateAction(users, { kind: 'deploy', user: 'pat', from: 'Test', to: 'Prod', items: notebook, targetEmpty: true }).ok).toBe(true)
    // Learn: a pipeline admin without a workspace role can't deploy.
    expect(evaluateAction(users, { kind: 'deploy', user: 'lee', from: 'Dev', to: 'Test', items: notebook }).ok).toBe(false)
    expect(evaluateAction(users, { kind: 'deploy', user: 'kim', from: 'Dev', to: 'Test', items: notebook }).ok).toBe(false)
  })
  it('dataflows need their owner; assign needs workspace Admin; rules need ownership', () => {
    expect(evaluateAction(users, { kind: 'deploy', user: 'pat', from: 'Dev', to: 'Test', items: [{ name: 'flow', kind: 'dataflow' }] }).ok).toBe(true)
    expect(evaluateAction(users, { kind: 'deploy', user: 'pat', from: 'Dev', to: 'Test', items: [{ name: 'other', kind: 'dataflow' }] }).ok).toBe(false)
    expect(evaluateAction(users, { kind: 'assign', user: 'ana', stage: 'Prod' }).ok).toBe(true)
    expect(evaluateAction(users, { kind: 'assign', user: 'ana', stage: 'Test' }).ok).toBe(false)
    expect(evaluateAction(users, { kind: 'set-rule', user: 'pat', stage: 'Test', item: 'flow' }).ok).toBe(true)
    expect(evaluateAction(users, { kind: 'set-rule', user: 'pat', stage: 'Test', item: 'model' }).ok).toBe(false)
    expect(evaluateAction(users, { kind: 'compare', user: 'ana', stages: ['Test', 'Prod'] }).ok).toBe(true)
    expect(evaluateAction(users, { kind: 'delete-pipeline', user: 'lee' }).ok).toBe(true)
  })
  it('refuses a contributor deploying a semantic model (Learn’s two tables disagree)', () => {
    expect(() => evaluateAction(users, { kind: 'deploy', user: 'pat', from: 'Dev', to: 'Test', items: [{ name: 'm', kind: 'semantic model' }] })).toThrow()
  })
  it('Learn’s Direct Lake binding example: the model keeps the source-stage lakehouse unless a datasource rule rebinds it (SQL only)', () => {
    expect(evaluateBinding({ kind: 'model-to-source', storage: 'directlake-sql', datasourceRule: false }).outcome).toBe('source')
    expect(evaluateBinding({ kind: 'model-to-source', storage: 'directlake-sql', datasourceRule: true }).outcome).toBe('target')
    expect(evaluateBinding({ kind: 'model-to-source', storage: 'directlake-onelake', datasourceRule: true }).outcome).toBe('source')
    expect(evaluateBinding({ kind: 'model-to-source', storage: 'import', datasourceRule: false }).outcome).toBe('target')
    // Learn's report example: the test stage doesn't contain its semantic model, so the deployment fails.
    expect(evaluateBinding({ kind: 'report-to-model', modelInTarget: false }).outcome).toBe('fails')
    expect(evaluateBinding({ kind: 'report-to-model', modelInTarget: true }).outcome).toBe('target')
  })
})
