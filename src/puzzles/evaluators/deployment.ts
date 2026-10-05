/**
 * Conveyor evaluator: whether a deployment pipeline action succeeds for a user,
 * and how a deployed item binds in the target stage. Each rule cites the Learn
 * permissions table or autobinding statement it encodes. Cases Learn doesn't
 * settle throw, so the content check rejects a scenario that uses them.
 */

const L = 'https://learn.microsoft.com/en-us/'
export const DEPLOY_SOURCES = {
  process: `${L}fabric/cicd/deployment-pipelines/understand-the-deployment-process`,
  directLake: `${L}fabric/fundamentals/direct-lake-overview`,
  rules: `${L}fabric/cicd/deployment-pipelines/create-rules`,
} as const

export type Role = 'Admin' | 'Member' | 'Contributor' | 'Viewer'

export interface PipelineUser {
  name: string
  pipelineAdmin: boolean
  /** Workspace role in each stage's workspace, by stage name. */
  roles: Record<string, Role | undefined>
  /** Items the user owns (for dataflows and deployment rules). */
  owns?: string[]
}

export type ItemKind = 'notebook' | 'lakehouse' | 'warehouse' | 'report' | 'dataflow' | 'semantic model'

export type PipelineAction =
  | { kind: 'deploy'; user: string; from: string; to: string; items: { name: string; kind: ItemKind }[]; targetEmpty?: boolean }
  | { kind: 'compare'; user: string; stages: [string, string] }
  | { kind: 'assign'; user: string; stage: string }
  | { kind: 'set-rule'; user: string; stage: string; item: string }
  | { kind: 'delete-pipeline'; user: string }
  | { kind: 'view-history'; user: string }

export interface DeployRule {
  id: string
  text: string
  source: string
}

export const deployRules = {
  ADMIN: { id: 'DP-ADMIN', text: 'Pipeline admin is the lowest pipeline permission and is required for every deployment pipeline operation. Deleting the pipeline, managing settings, and viewing deployment history need only pipeline admin.', source: DEPLOY_SOURCES.process },
  DEPLOY: { id: 'DP-DEPLOY', text: 'Deploying to the next stage needs pipeline admin plus at least Contributor in both the source and target workspaces.', source: DEPLOY_SOURCES.process },
  EMPTY: { id: 'DP-EMPTY', text: 'Deploying to an empty stage needs pipeline admin plus Contributor (or higher) in the source workspace.', source: DEPLOY_SOURCES.process },
  DATAFLOW: { id: 'DP-DATAFLOW', text: 'To deploy a dataflow you must be its owner.', source: DEPLOY_SOURCES.process },
  COMPARE: { id: 'DP-COMPARE', text: 'Comparing two stages needs pipeline admin plus Contributor, Member, or Admin in both stages’ workspaces.', source: DEPLOY_SOURCES.process },
  ASSIGN: { id: 'DP-ASSIGN', text: 'Assigning a workspace to a stage needs pipeline admin plus Admin of that workspace.', source: DEPLOY_SOURCES.process },
  RULE: { id: 'DP-RULE', text: 'Viewing or setting a deployment rule needs pipeline admin, Contributor (or higher) in the target workspace, and ownership of the item.', source: DEPLOY_SOURCES.process },
  BIND: { id: 'DP-BIND', text: 'When a deployed item depends on an item that exists in the target stage, deployment autobinds it to the target-stage item. If the item it depends on isn’t deployed and isn’t in the target stage, the deployment fails.', source: DEPLOY_SOURCES.process },
  DL_BIND: { id: 'DP-DL-BIND', text: 'A deployed Direct Lake semantic model doesn’t autobind: it still points at the source-stage lakehouse until a datasource rule rebinds it. Other semantic models autobind to the paired item.', source: DEPLOY_SOURCES.process },
  DL_RULES: { id: 'DP-DL-RULES', text: 'Deployment pipeline rules can rebind the data source for Direct Lake on SQL, but not for Direct Lake on OneLake.', source: DEPLOY_SOURCES.directLake },
} as const

export type ActionResult = { ok: boolean; rules: DeployRule[]; why: string }

const atLeastContributor = (r: Role | undefined) => r === 'Admin' || r === 'Member' || r === 'Contributor'

export function evaluateAction(users: PipelineUser[], a: PipelineAction): ActionResult {
  const u = users.find((x) => x.name === a.user)
  if (!u) throw new Error(`Unknown user ${a.user}`)
  const R = deployRules
  if (!u.pipelineAdmin) return { ok: false, rules: [R.ADMIN], why: `${u.name} isn’t a pipeline admin.` }
  switch (a.kind) {
    case 'delete-pipeline':
    case 'view-history':
      return { ok: true, rules: [R.ADMIN], why: `${u.name} is a pipeline admin, which is all this needs.` }
    case 'assign': {
      const ok = u.roles[a.stage] === 'Admin'
      return { ok, rules: [R.ASSIGN], why: ok ? `${u.name} is Admin of the ${a.stage} workspace.` : `${u.name} isn’t Admin of the ${a.stage} workspace.` }
    }
    case 'compare': {
      const ok = a.stages.every((s) => atLeastContributor(u.roles[s]))
      return { ok, rules: [R.COMPARE], why: ok ? `${u.name} is at least Contributor in both stages.` : `${u.name} needs Contributor or higher in both ${a.stages.join(' and ')}.` }
    }
    case 'set-rule': {
      const owner = !!u.owns?.includes(a.item)
      const ok = atLeastContributor(u.roles[a.stage]) && owner
      const why = !atLeastContributor(u.roles[a.stage]) ? `${u.name} needs Contributor or higher in ${a.stage}.` : !owner ? `${u.name} doesn’t own ${a.item}.` : `${u.name} owns ${a.item} and is at least Contributor in ${a.stage}.`
      return { ok, rules: [R.RULE], why }
    }
    case 'deploy': {
      if (a.items.some((i) => i.kind === 'semantic model' || i.kind === 'report') && [u.roles[a.from], u.roles[a.to]].includes('Contributor')) {
        // Learn's item table says deploying an existing semantic model or paginated report needs Member; the action table says Contributor.
        throw new Error('Contributor deploying a semantic model or report isn’t settled on Learn')
      }
      const rules: DeployRule[] = [a.targetEmpty ? R.EMPTY : R.DEPLOY]
      const roleOk = a.targetEmpty ? atLeastContributor(u.roles[a.from]) : atLeastContributor(u.roles[a.from]) && atLeastContributor(u.roles[a.to])
      if (!roleOk)
        return { ok: false, rules, why: a.targetEmpty ? `${u.name} needs Contributor or higher in ${a.from}.` : `${u.name} needs Contributor or higher in both ${a.from} and ${a.to}.` }
      const dataflows = a.items.filter((i) => i.kind === 'dataflow' && !u.owns?.includes(i.name))
      if (dataflows.length) return { ok: false, rules: [...rules, R.DATAFLOW], why: `${u.name} doesn’t own ${dataflows.map((d) => d.name).join(', ')}.` }
      return { ok: true, rules: a.items.some((i) => i.kind === 'dataflow') ? [...rules, R.DATAFLOW] : rules, why: `${u.name} has the roles this deployment needs.` }
    }
  }
}

export type BindOutcome = 'target' | 'source' | 'fails'
export const bindLabel: Record<BindOutcome, string> = {
  target: 'Bound to the target-stage item',
  source: 'Still bound to the source-stage item',
  fails: 'The deployment fails',
}

/**
 * How a deployed item binds to what it depends on.
 * - report → semantic model: autobinds if the model is in the target stage (or deployed with it); otherwise the deployment fails.
 * - semantic model → lakehouse/warehouse: Direct Lake models stay on the source stage unless a datasource rule rebinds them
 *   (allowed for Direct Lake on SQL only); other models autobind.
 */
export type BindingCase =
  | { kind: 'report-to-model'; modelInTarget: boolean }
  | { kind: 'model-to-source'; storage: 'import' | 'directlake-sql' | 'directlake-onelake'; datasourceRule: boolean }

export function evaluateBinding(c: BindingCase): { outcome: BindOutcome; rules: DeployRule[] } {
  const R = deployRules
  if (c.kind === 'report-to-model') return { outcome: c.modelInTarget ? 'target' : 'fails', rules: [R.BIND] }
  if (c.storage === 'import') {
    if (c.datasourceRule) throw new Error('Rules on autobound import models aren’t modelled')
    return { outcome: 'target', rules: [R.DL_BIND] }
  }
  if (!c.datasourceRule) return { outcome: 'source', rules: [R.DL_BIND] }
  return { outcome: c.storage === 'directlake-sql' ? 'target' : 'source', rules: [R.DL_BIND, R.DL_RULES] }
}
