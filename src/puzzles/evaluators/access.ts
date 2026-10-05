/**
 * Gatehouse Access Matrix evaluator: who can see or do what, from workspace
 * roles, item permissions, SQL grants, and RLS/CLS/OLS/DDM rules. Each rule
 * cites the Learn table or statement it encodes. Cases Learn doesn't settle
 * (for example DENY, or a contributor with Reshare sharing a warehouse) are
 * not modelled; asking about them throws, so the content check rejects them.
 */

const L = 'https://learn.microsoft.com/en-us/'
export const ACCESS_SOURCES = {
  roles: `${L}fabric/fundamentals/roles-workspaces`,
  warehouseShare: `${L}fabric/data-warehouse/share-warehouse-manage-permissions`,
  granular: `${L}fabric/data-warehouse/sql-granular-permissions`,
  cls: `${L}fabric/data-warehouse/column-level-security`,
  whRls: `${L}fabric/data-warehouse/row-level-security`,
  ddm: `${L}fabric/data-warehouse/dynamic-data-masking`,
  smRls: `${L}fabric/security/service-admin-row-level-security`,
  smOls: `${L}fabric/security/service-admin-object-level-security`,
} as const

export type WorkspaceRole = 'Admin' | 'Member' | 'Contributor' | 'Viewer'
/** Item permissions granted by sharing a warehouse (or a lakehouse's SQL analytics endpoint). */
export type ItemPermission = 'Read' | 'ReadData' | 'ReadAll'

export interface AccessUser {
  name: string
  role?: WorkspaceRole
  /** Item permissions on the warehouse, granted by sharing (no workspace role needed). */
  item?: ItemPermission[]
  /** SQL GRANT SELECT on a table, optionally limited to some columns. */
  grants?: { table: string; columns?: string[] }[]
  /** SQL UNMASK permission. */
  unmask?: boolean
  /** Semantic model RLS roles the user is a member of. */
  modelRoles?: string[]
}

export interface AccessSetup {
  users: AccessUser[]
  /** Warehouse tables and their columns. */
  tables?: { name: string; columns: string[] }[]
  /** Warehouse RLS: a security policy on a table that maps users to the values they may see. */
  warehouseRls?: { table: string; column: string; allow: Record<string, string[]> }
  /** Columns with a dynamic data mask. */
  masked?: { table: string; column: string }[]
  /** Semantic model RLS roles: each filters one column to some values. */
  modelRls?: { role: string; column: string; values: string[] }[]
  /** All values of the RLS column (to describe "every row"). */
  rlsValues?: string[]
  /** Semantic model OLS: columns hidden (None) for a role. */
  modelOls?: { role: string; column: string }[]
}

export type WorkspaceAction =
  | 'update-delete-workspace'
  | 'add-admins'
  | 'add-members'
  | 'share-item'
  | 'create-warehouse'
  | 'write-notebook'
  | 'run-pipeline'
  | 'view-pipeline-output'
  | 'connect-git'

export const actionText: Record<WorkspaceAction, string> = {
  'update-delete-workspace': 'update or delete the workspace',
  'add-admins': 'add another admin to the workspace',
  'add-members': 'add a member (or a lower role) to the workspace',
  'share-item': 'share an item and let others reshare it',
  'create-warehouse': 'create or modify a warehouse',
  'write-notebook': 'write or delete a notebook',
  'run-pipeline': 'run or cancel a pipeline',
  'view-pipeline-output': 'view a pipeline’s run output',
  'connect-git': 'connect the workspace to a Git repository',
}

/** Rows of the "Microsoft Fabric workspace roles" table on Roles in workspaces. */
const roleTable: Record<WorkspaceAction, WorkspaceRole[]> = {
  'update-delete-workspace': ['Admin'],
  'add-admins': ['Admin'],
  'add-members': ['Admin', 'Member'],
  'share-item': ['Admin', 'Member'],
  'create-warehouse': ['Admin', 'Member', 'Contributor'],
  'write-notebook': ['Admin', 'Member', 'Contributor'],
  'run-pipeline': ['Admin', 'Member', 'Contributor'],
  'view-pipeline-output': ['Admin', 'Member', 'Contributor', 'Viewer'],
  'connect-git': ['Admin'],
}

/** Default item permissions each workspace role gets (Share your data and manage permissions). */
const roleItemDefaults: Record<WorkspaceRole, ItemPermission[]> = {
  Admin: ['Read', 'ReadData', 'ReadAll'],
  Member: ['Read', 'ReadData', 'ReadAll'],
  Contributor: ['Read', 'ReadData', 'ReadAll'],
  Viewer: ['Read', 'ReadData'],
}

export type AccessQuestion =
  | { kind: 'action'; user: string; action: WorkspaceAction }
  | { kind: 'connect'; user: string }
  | { kind: 'sql-select'; user: string; table: string; columns: string[] }
  | { kind: 'spark-read'; user: string }
  | { kind: 'sql-rows'; user: string }
  | { kind: 'masked'; user: string; table: string; column: string }
  | { kind: 'model-rows'; user: string }
  | { kind: 'model-column'; user: string; column: string }

export interface AccessRule {
  id: string
  text: string
  source: string
}

export const accessRules: Record<string, AccessRule> = {
  ROLE: { id: 'AC-ROLE', text: 'Workspace roles grant the capabilities in the Fabric workspace roles table (for example, only Admin can update or delete the workspace or connect it to Git; Admin and Member can add members and share; Viewer can’t write or run items but can view run output).', source: ACCESS_SOURCES.roles },
  CONNECT: { id: 'AC-CONNECT', text: 'To connect to a warehouse or SQL analytics endpoint, a user needs a workspace role or at least the item Read permission.', source: ACCESS_SOURCES.granular },
  READ_ONLY: { id: 'AC-READ', text: 'Read alone only lets a user connect; they can’t query any table or view unless a T-SQL GRANT gives them access.', source: ACCESS_SOURCES.warehouseShare },
  READDATA: { id: 'AC-READDATA', text: 'ReadData (“Read all data using SQL”) lets a user read every table and view with T-SQL, like db_datareader. Every workspace role, Viewer included, has it by default.', source: ACCESS_SOURCES.warehouseShare },
  READALL: { id: 'AC-READALL', text: 'ReadAll (“Read all data using Apache Spark”) lets a user read the files through OneLake and Spark. Admin, Member, and Contributor have it by default; Viewer doesn’t.', source: ACCESS_SOURCES.warehouseShare },
  CLS: { id: 'AC-CLS', text: 'Column-level security is a GRANT SELECT on listed columns; a query that includes any other column fails with a permission error.', source: ACCESS_SOURCES.cls },
  WH_RLS: { id: 'AC-WH-RLS', text: 'Warehouse row-level security policies apply to every user, including dbo and members of Admin, Member, and Contributor; the policy itself must allow anyone who needs all rows.', source: ACCESS_SOURCES.whRls },
  DDM: { id: 'AC-DDM', text: 'Users see masked values unless they’re Admin, Member, or Contributor (which carry CONTROL) or have UNMASK.', source: ACCESS_SOURCES.ddm },
  SM_RLS: { id: 'AC-SM-RLS', text: 'Semantic model RLS only restricts users with Viewer permissions (Build doesn’t change that). Admin, Member, and Contributor can edit the model, so RLS doesn’t apply to them. Roles are additive.', source: ACCESS_SOURCES.smRls },
  SM_OLS: { id: 'AC-SM-OLS', text: 'Object-level security only applies to Viewers. For them a secured column behaves as if it doesn’t exist; Admin, Member, and Contributor aren’t affected.', source: ACCESS_SOURCES.smOls },
}

export type AccessAnswer = { kind: 'bool'; value: boolean; rules: AccessRule[] } | { kind: 'set'; value: string[]; rules: AccessRule[] }

const editorRoles: WorkspaceRole[] = ['Admin', 'Member', 'Contributor']

function permissions(u: AccessUser): Set<ItemPermission> {
  return new Set([...(u.role ? roleItemDefaults[u.role] : []), ...(u.item ?? [])])
}

export function evaluateAccess(setup: AccessSetup, q: AccessQuestion): AccessAnswer {
  const user = setup.users.find((u) => u.name === q.user)
  if (!user) throw new Error(`Unknown user ${q.user}`)
  const perms = permissions(user)
  const canConnect = user.role !== undefined || perms.has('Read')
  const R = accessRules
  switch (q.kind) {
    case 'action': {
      if (q.action === 'share-item' && (user.role === 'Contributor' || user.role === 'Viewer') && user.item?.length) {
        throw new Error('Sharing by a contributor or viewer with extra item permissions isn’t settled on Learn')
      }
      return { kind: 'bool', value: !!user.role && roleTable[q.action].includes(user.role), rules: [R.ROLE!] }
    }
    case 'connect':
      return { kind: 'bool', value: canConnect, rules: [R.CONNECT!] }
    case 'spark-read':
      return { kind: 'bool', value: perms.has('ReadAll'), rules: [R.READALL!] }
    case 'sql-select': {
      if (!canConnect) return { kind: 'bool', value: false, rules: [R.CONNECT!] }
      if (perms.has('ReadData')) {
        if (user.grants?.length) throw new Error('Column grants on top of ReadData aren’t modelled')
        return { kind: 'bool', value: true, rules: [R.READDATA!] }
      }
      const grant = user.grants?.find((g) => g.table === q.table)
      if (!grant) return { kind: 'bool', value: false, rules: [R.READ_ONLY!] }
      const ok = !grant.columns || q.columns.every((c) => grant.columns!.includes(c))
      return { kind: 'bool', value: ok, rules: [R.READ_ONLY!, R.CLS!] }
    }
    case 'sql-rows': {
      const rls = setup.warehouseRls
      if (!rls) throw new Error('No warehouse RLS policy in this scenario')
      if (!canConnect || !(perms.has('ReadData') || user.grants?.some((g) => g.table === rls.table))) throw new Error('User can’t query the table at all')
      return { kind: 'set', value: [...(rls.allow[user.name] ?? [])].sort(), rules: [R.WH_RLS!] }
    }
    case 'masked': {
      if (!setup.masked?.some((m) => m.table === q.table && m.column === q.column)) throw new Error('Column isn’t masked')
      const sees = (user.role !== undefined && editorRoles.includes(user.role)) || !!user.unmask
      return { kind: 'bool', value: !sees, rules: [R.DDM!] }
    }
    case 'model-rows': {
      if (!user.role) throw new Error('Semantic model RLS questions use workspace roles only')
      if (editorRoles.includes(user.role)) return { kind: 'set', value: [...(setup.rlsValues ?? [])].sort(), rules: [R.SM_RLS!] }
      const roles = (setup.modelRls ?? []).filter((r) => user.modelRoles?.includes(r.role))
      if (!roles.length) throw new Error('A viewer in no RLS role isn’t modelled')
      return { kind: 'set', value: [...new Set(roles.flatMap((r) => r.values))].sort(), rules: [R.SM_RLS!] }
    }
    case 'model-column': {
      if (!user.role) throw new Error('Semantic model OLS questions use workspace roles only')
      if (editorRoles.includes(user.role)) return { kind: 'bool', value: true, rules: [R.SM_OLS!] }
      const hidden = (setup.modelOls ?? []).some((o) => o.column === q.column && user.modelRoles?.includes(o.role))
      return { kind: 'bool', value: !hidden, rules: [R.SM_OLS!] }
    }
  }
}
