import type { MachineNotes } from '../types'

const L = 'https://learn.microsoft.com/en-us/'
const ROLES = `${L}fabric/fundamentals/roles-workspaces`
const PERMISSION_MODEL = `${L}fabric/security/permission-model`
const SHARE_ITEMS = `${L}fabric/fundamentals/share-items`
const WORKSPACES = `${L}fabric/fundamentals/workspaces`
const WH_RLS = `${L}fabric/data-warehouse/row-level-security`
const WH_CLS = `${L}fabric/data-warehouse/column-level-security`
const WH_GRANULAR = `${L}fabric/data-warehouse/sql-granular-permissions`
const WH_DDM = `${L}fabric/data-warehouse/dynamic-data-masking`
const ONELAKE_SECURITY = `${L}fabric/onelake/security/get-started-security`
const ONELAKE_ACCESS_MODEL = `${L}fabric/onelake/security/data-access-control-model`
const MODEL_RLS = `${L}fabric/security/service-admin-row-level-security`
const MODEL_OLS = `${L}fabric/security/service-admin-object-level-security`
const ENDPOINT = `${L}fabric/data-engineering/lakehouse-sql-analytics-endpoint`
const DIRECT_LAKE = `${L}fabric/fundamentals/direct-lake-overview`
const DL_HOW = `${L}fabric/fundamentals/direct-lake-how-it-works`
const DL_SECURITY = `${L}fabric/fundamentals/direct-lake-security-integration`
const INFO_PROTECTION = `${L}fabric/governance/information-protection`
const ENDORSEMENT = `${L}fabric/governance/endorsement-overview`
const GIT_INTRO = `${L}fabric/cicd/git-integration/intro-to-git-integration`
const GIT_PROCESS = `${L}fabric/cicd/git-integration/git-integration-process`
const PBIP = `${L}power-bi/developer/projects/projects-overview`
const PIPELINES_INTRO = `${L}fabric/cicd/deployment-pipelines/intro-to-deployment-pipelines`
const PIPELINES_START = `${L}fabric/cicd/deployment-pipelines/get-started-with-deployment-pipelines`
const PIPELINES_PROCESS = `${L}fabric/cicd/deployment-pipelines/understand-the-deployment-process`
const PIPELINES_RULES = `${L}fabric/cicd/deployment-pipelines/create-rules`
const IMPACT = `${L}fabric/governance/impact-analysis`
const LINEAGE = `${L}fabric/governance/lineage`
const XMLA = `${L}fabric/enterprise/powerbi/service-premium-connect-tools`
const TMSL_REFRESH = `${L}analysis-services/tmsl/refresh-command-tmsl?view=sql-analysis-services-2025`
const LARGE_MODELS = `${L}fabric/enterprise/powerbi/service-premium-large-models`
const TEMPLATES = `${L}power-bi/create-reports/desktop-templates`
const PBIDS = `${L}power-bi/connect-data/desktop-data-sources`
const SHARED_MODELS = `${L}power-bi/connect-data/service-datasets-across-workspaces`
const DESKTOP = `${L}power-bi/fundamentals/desktop-get-the-desktop`
const CALC_GROUPS = `${L}power-bi/transform-model/calculation-groups`

export const maintainNotes: MachineNotes[] = [
  // ── Gate Keys ────────────────────────────────────────────────────────
  {
    machineId: 'gate-keys',
    pl300Adds: [
      {
        text: 'The four workspace roles are the same as in Power BI, but Fabric extends them to new item types. For example, Contributors can create warehouses and mirrored databases, all roles can read pipelines and notebooks, and only Admins can connect the workspace to Git or create a workspace identity.',
        sources: [ROLES],
      },
      {
        text: 'Fabric separates the control plane (what you can do with items) from the data plane (what data you can see). Workspace roles also grant data access by default, which you narrow with OneLake security, SQL security, or semantic model RLS.',
        sources: [ONELAKE_SECURITY, PERMISSION_MODEL],
      },
    ],
    overview: [
      {
        text: 'Workspace-level access is the outermost gate. Anyone without a workspace role can’t open the workspace at all (unless an item is shared with them directly). Roles apply to every item in the workspace, so this is the coarsest and most powerful control.',
        sources: [PERMISSION_MODEL],
      },
    ],
    bullets: [
      {
        bulletId: 'M1.1',
        tools: ['workspace'],
        concepts: [
          {
            text: 'Admin: view, modify, share, and manage everything, including permissions, deleting the workspace, adding admins, connecting to Git. Member: view, modify, and share, and add members or lower roles. Contributor: view and modify content and create items. Viewer: view only.',
            sources: [PERMISSION_MODEL, ROLES],
          },
          {
            text: 'Roles can be assigned to users, security groups, Microsoft 365 groups, distribution lists, and service principals. A user in several groups gets the highest role they’re assigned.',
            sources: [ROLES],
          },
          {
            text: 'Admins, Members, and Contributors already have data access through write permission. OneLake security default roles mainly matter for Viewers.',
            sources: [ONELAKE_SECURITY, ONELAKE_ACCESS_MODEL],
          },
        ],
        howTo: [
          {
            text: 'Use the workspace’s Manage access option to add people or groups and pick a role. Learn recommends assigning roles to security groups and managing membership in the group.',
            sources: [WORKSPACES, ROLES, ONELAKE_SECURITY],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'Workspace roles apply only to that workspace, not to the capacity or tenant.',
        sources: [PERMISSION_MODEL],
      },
      {
        text: 'Semantic model RLS and OLS apply only to Viewers. Admins, Members, and Contributors bypass them because they have edit permission on the model.',
        sources: [MODEL_RLS, MODEL_OLS],
      },
      {
        text: 'Only Admins can connect a workspace to Git or create a workspace identity. Member is not enough.',
        sources: [ROLES, GIT_PROCESS],
      },
    ],
    dontConfuse: [
      {
        pairId: 'member-vs-contributor',
        a: 'Member',
        b: 'Contributor',
        difference: [
          {
            text: 'Both can create and modify content. Member can also share items, let others reshare, and add people with Member or lower roles. Contributor can’t share or manage access.',
            sources: [PERMISSION_MODEL, ROLES],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Workspace role',
        definition: 'One of Admin, Member, Contributor, or Viewer, granting a fixed set of capabilities on every item in one workspace.',
        sources: [PERMISSION_MODEL, ROLES],
      },
      {
        term: 'Control plane vs data plane',
        definition: 'Control plane permissions (workspace roles, item permissions) govern what you can do with items; data plane permissions (OneLake security) govern which data you can see or change.',
        sources: [ONELAKE_SECURITY],
      },
    ],
    needsVerification: [],
  },

  // ── Item Locks ───────────────────────────────────────────────────────
  {
    machineId: 'item-locks',
    pl300Adds: [
      {
        text: 'PL-300 covered sharing reports and Build permission on semantic models. Fabric adds data-item permissions: Read lets you connect to a warehouse or endpoint, Read All with SQL analytics endpoint lets you read data with T-SQL, and Read all with Apache Spark lets you read through OneLake and Spark. Item Read alone doesn’t include data access.',
        sources: [SHARE_ITEMS, PERMISSION_MODEL],
      },
    ],
    overview: [
      {
        text: 'Item permissions give someone access to one item without a workspace role, or add to what a role already allows. Sharing is how you grant them, and the permissions offered depend on the item type.',
        sources: [PERMISSION_MODEL, SHARE_ITEMS],
      },
    ],
    bullets: [
      {
        bulletId: 'M1.2',
        tools: ['workspace', 'lakehouse', 'warehouse', 'semantic-model'],
        concepts: [
          {
            text: 'Sharing always grants Read, which lets the recipient find and open the item. Optional extras: Edit, Share (reshare up to your own permissions), Read All with SQL analytics endpoint (ReadData via T-SQL), Read all with Apache Spark (ReadAll via OneLake and Spark), Build (create content on a semantic model), and Execute.',
            sources: [SHARE_ITEMS],
          },
          {
            text: 'Read permission alone shows metadata and reports but not the underlying data in SQL or OneLake. For example, a shared Direct Lake report also needs OneLake data permissions.',
            sources: [PERMISSION_MODEL],
          },
          {
            text: 'To connect to a warehouse or SQL analytics endpoint at all, a user needs a workspace role or item Read. Finer SQL permissions (GRANT/DENY) apply on top of that.',
            sources: [WH_GRANULAR],
          },
        ],
        howTo: [
          {
            text: 'Select Share on the item, choose the link audience (People in your organization, People with existing access, or Specific people), and tick the extra permissions. Manage permissions on the item lets you review and remove them.',
            sources: [SHARE_ITEMS],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'A "People with existing access" link grants nothing. It’s just a URL for people who already have access.',
        sources: [SHARE_ITEMS],
      },
      {
        text: 'Revoking item permission can take up to two hours to take effect for a signed-in user.',
        sources: [SHARE_ITEMS],
      },
      {
        text: 'Shared with me only lists Power BI items, not other Fabric items shared with you.',
        sources: [SHARE_ITEMS],
      },
    ],
    dontConfuse: [
      {
        pairId: 'access-layers',
        a: 'Workspace roles vs item permissions',
        b: 'RLS / CLS / OLS',
        difference: [
          {
            text: 'Workspace roles: coarse, for every item in the workspace, and they define who can do what (control plane). Item permissions: one item, granted by sharing (Read, ReadData, ReadAll, Build, and so on).',
            sources: [PERMISSION_MODEL, SHARE_ITEMS],
          },
          {
            text: 'RLS/CLS/OLS: inside an engine, they narrow which rows, columns, or objects a user who already has access can see. They are set in the warehouse or SQL analytics endpoint (T-SQL), in the semantic model (DAX roles), or in OneLake security roles. They narrow access; they never grant it.',
            sources: [PERMISSION_MODEL, ONELAKE_SECURITY],
          },
          {
            text: 'Each engine enforces only its own rules. SQL endpoint security applies to SQL queries only, semantic model RLS to the model only, and OneLake security across engines that honor it.',
            sources: [ENDPOINT, PERMISSION_MODEL, ONELAKE_SECURITY],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Item permission',
        definition: 'A permission on a single Fabric item (such as Read, Edit, Share, ReadData, ReadAll, Build, Execute), usually granted by sharing.',
        sources: [SHARE_ITEMS, PERMISSION_MODEL],
      },
      {
        term: 'Build permission',
        definition: 'A semantic model permission that lets a user create new content on the model, including reports, Analyze in Excel, and XMLA queries.',
        sources: [SHARED_MODELS, SHARE_ITEMS],
      },
      {
        term: 'ReadData / ReadAll',
        definition: 'Item permissions to read data through the SQL analytics endpoint (ReadData, "Read All with SQL analytics endpoint") or through OneLake and Spark (ReadAll, "Read all with Apache Spark").',
        sources: [SHARE_ITEMS, ROLES],
      },
    ],
    needsVerification: [],
  },

  // ── Thread Sieves ────────────────────────────────────────────────────
  {
    machineId: 'thread-sieves',
    pl300Adds: [
      {
        text: 'PL-300 covered semantic model RLS roles with DAX filters and group membership. DP-600 adds security in the data layer: T-SQL RLS (security policies with predicate functions), column-level security (GRANT on columns), object-level security (GRANT/DENY on tables and views), dynamic data masking in the warehouse, semantic model OLS, and OneLake security roles for folder- and file-level access.',
        sources: [WH_RLS, WH_CLS, WH_GRANULAR, MODEL_OLS, ONELAKE_SECURITY],
      },
    ],
    overview: [
      {
        text: 'Fine-grained security hides rows, columns, objects, or files from users who otherwise have access. Where you define it matters, because each engine enforces its own rules, and some choices make Direct Lake fall back to DirectQuery.',
        sources: [PERMISSION_MODEL, DL_HOW],
      },
    ],
    bullets: [
      {
        bulletId: 'M1.3',
        tools: ['warehouse', 'sql-analytics-endpoint', 'semantic-model', 'onelake', 'lakehouse'],
        concepts: [
          {
            text: 'Warehouse/endpoint RLS: an inline table-valued function returns a row when access is allowed, and CREATE SECURITY POLICY ... ADD FILTER PREDICATE binds it to a table. Rows are silently filtered for SELECT, UPDATE, and DELETE, even for dbo.',
            sources: [WH_RLS],
          },
          {
            text: 'Column-level security: GRANT SELECT on a list of columns. A query that touches a denied column fails with a permission error instead of returning nulls.',
            sources: [WH_CLS],
          },
          {
            text: 'Object-level security in the warehouse: GRANT, REVOKE, and DENY on schemas, tables, and views. You can’t run CREATE USER; the database user is created on GRANT/DENY.',
            sources: [WH_GRANULAR],
          },
          {
            text: 'Semantic model RLS: roles with DAX filter expressions (static, or dynamic with USERPRINCIPALNAME()). Members are assigned in the service. Semantic model OLS: in a role, set a table’s or column’s metadataPermission to none (with TMDL view or Tabular Editor) to hide it completely.',
            sources: [MODEL_RLS, MODEL_OLS],
          },
          {
            text: 'File-level (OneLake security): roles defined on an item grant read access to selected folders, tables, or schemas, optionally with row and column constraints. It is deny-by-default with Grant-only roles, and it is enforced consistently across engines.',
            sources: [ONELAKE_SECURITY, ONELAKE_ACCESS_MODEL],
          },
        ],
        howTo: [
          {
            text: 'Warehouse: create a schema for security objects, the predicate function, then the security policy WITH (STATE = ON). On a SQL analytics endpoint you can’t create tables, but you can create the schema, function, and policy.',
            sources: [WH_RLS],
          },
          {
            text: 'Semantic model: Modeling > Manage roles > New role, write the DAX filter, check it with Test as role, publish, then add members on the model’s Security page in the service.',
            sources: [MODEL_RLS],
          },
          {
            text: 'OneLake: on the lakehouse, manage OneLake security roles, choose the tables or folders, and assign users, groups, or a workspace-role-based assignment.',
            sources: [PERMISSION_MODEL, ONELAKE_ACCESS_MODEL],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Row-level security in a warehouse',
        language: 'tsql',
        illustrative: true,
        steps: [
          {
            code: 'CREATE SCHEMA Security;',
            explain: 'Keep security objects in their own schema.',
          },
          {
            code: "CREATE FUNCTION Security.tvf_securitypredicate(@SalesRep AS varchar(100))\n    RETURNS TABLE\nWITH SCHEMABINDING\nAS\n    RETURN SELECT 1 AS result\n    WHERE @SalesRep = USER_NAME() OR USER_NAME() = 'manager@contoso.com';",
            explain: 'The predicate returns a row (allow) when the row’s SalesRep is the signed-in user, or when the manager is querying.',
          },
          {
            code: 'CREATE SECURITY POLICY SalesFilter\nADD FILTER PREDICATE Security.tvf_securitypredicate(SalesRep)\nON sales.Orders\nWITH (STATE = ON);',
            explain: 'Bind the predicate to sales.Orders as a filter predicate and switch the policy on. Every query on the table is now filtered per user.',
          },
        ],
        sources: [WH_RLS],
      },
      {
        title: 'Column-level and object-level security',
        language: 'tsql',
        illustrative: true,
        steps: [
          {
            code: 'GRANT SELECT ON dbo.Customers (CustomerID, FirstName, LastName, Phone, Email) TO [Charlie@contoso.com];',
            explain: 'Charlie can read every listed column but not CreditCard; SELECT * fails with a permission error.',
          },
          {
            code: 'DENY SELECT ON dbo.Payroll TO [Analysts];',
            explain: 'Object-level: block a whole table for a group, even if their workspace role would otherwise allow reading it through SQL.',
          },
        ],
        sources: [WH_CLS, WH_GRANULAR],
      },
      {
        title: 'Dynamic RLS in a semantic model',
        language: 'dax',
        illustrative: true,
        steps: [
          {
            code: '[UserEmail] = USERPRINCIPALNAME()',
            explain: 'Role filter on a user-mapping table: each signed-in user sees only rows matching their email, and the filter flows to related tables through relationships.',
          },
        ],
        sources: [MODEL_RLS],
      },
    ],
    traps: [
      {
        text: 'SQL RLS and views on the SQL analytics endpoint make Direct Lake on SQL fall back to DirectQuery (How Direct Lake works also lists dynamic data masking). For SQL OLS and CLS, Learn pages differ: How Direct Lake works lists OLS as a fallback cause, while Integrate Direct Lake security says queries that touch OLS- or CLS-restricted objects return an error. Direct Lake on OneLake doesn’t check SQL-based security at all; Learn pages differ on whether such a query succeeds or returns an error.',
        sources: [DL_HOW, DIRECT_LAKE, DL_SECURITY, WH_CLS],
      },
      {
        text: 'SQL security on a SQL analytics endpoint only applies to SQL queries. The same data read through Spark is not filtered by it.',
        sources: [ENDPOINT],
      },
      {
        text: 'Semantic model RLS and OLS don’t apply to workspace Admins, Members, or Contributors.',
        sources: [MODEL_RLS, MODEL_OLS],
      },
      {
        text: 'OneLake security roles that grant ReadWrite can’t also contain RLS or CLS constraints.',
        sources: [ONELAKE_ACCESS_MODEL],
      },
      {
        text: 'To change an RLS predicate function, drop the security policy first, alter the function, then recreate the policy.',
        sources: [WH_RLS],
      },
      {
        text: 'Dynamic data masking only obscures values in results. It isn’t access control on its own; Learn says to combine it with CLS and RLS.',
        sources: [WH_DDM],
      },
    ],
    dontConfuse: [
      {
        pairId: 'cls-vs-ols-vs-ddm',
        a: 'CLS vs semantic model OLS',
        b: 'Dynamic data masking',
        difference: [
          {
            text: 'Warehouse CLS denies a column, so queries that touch it fail. Semantic model OLS hides a table or column from a role entirely (its metadata too), and visuals report the field can’t be found. Dynamic data masking returns the column but with masked values to non-privileged users.',
            sources: [WH_CLS, MODEL_OLS, WH_DDM],
          },
        ],
      },
    ],
    renamed: [],
    preview: [
      {
        feature: 'OneLake security enforcement in authorized third-party engines',
        note: 'Learn labels third-party engine enforcement as preview.',
        sources: [ONELAKE_ACCESS_MODEL],
      },
    ],
    upcoming: [],
    glossary: [
      {
        term: 'Row-level security (RLS)',
        definition: 'Restricts which rows a user can see: in a warehouse with security policies and predicate functions, or in a semantic model with DAX role filters.',
        sources: [WH_RLS, MODEL_RLS],
      },
      {
        term: 'Column-level security (CLS)',
        definition: 'Restricts which columns a user can query, granted with GRANT SELECT on column lists in a warehouse or SQL analytics endpoint.',
        sources: [WH_CLS],
      },
      {
        term: 'Object-level security (OLS)',
        definition: 'Hides whole tables or columns. In a semantic model through role metadataPermission; in a warehouse through GRANT/DENY on objects.',
        sources: [MODEL_OLS, WH_GRANULAR],
      },
      {
        term: 'Security policy',
        definition: 'A T-SQL object (CREATE SECURITY POLICY) that binds a predicate function to tables to enforce row-level security.',
        sources: [WH_RLS],
      },
      {
        term: 'OneLake security role',
        definition: 'A data-plane role on a Fabric item that grants read (or read-write) access to selected folders, tables, or schemas, optionally with row and column limits.',
        sources: [ONELAKE_SECURITY, ONELAKE_ACCESS_MODEL],
      },
      {
        term: 'Dynamic data masking',
        definition: 'A warehouse feature that masks sensitive column values in query results for non-privileged users without changing stored data.',
        sources: [WH_DDM],
      },
      {
        term: 'USERPRINCIPALNAME()',
        definition: 'A DAX function returning the signed-in user’s UPN (usually their email), used in dynamic RLS filters.',
        sources: [MODEL_RLS],
      },
    ],
    needsVerification: [
      {
        claim: 'Whether OneLake security (outside third-party engines) is generally available.',
        why: 'The pages read label only third-party engine enforcement as preview and don’t state GA for the rest.',
      },
    ],
  },

  // ── Seal & Stamp ─────────────────────────────────────────────────────
  {
    machineId: 'seal-and-stamp',
    pl300Adds: [
      {
        text: 'You applied sensitivity labels and promoted or certified content in PL-300. Fabric extends both to every item type. Labels propagate downstream through lineage, and there is a third endorsement badge, Master data, for authoritative data items.',
        sources: [INFO_PROTECTION, ENDORSEMENT],
      },
    ],
    overview: [
      {
        text: 'Sensitivity labels classify and can protect data (from Microsoft Purview Information Protection). Endorsement signals quality and trust so people find the right items. Both are governance signals, but they answer different questions: "how sensitive?" vs "how trustworthy?"',
        sources: [INFO_PROTECTION, ENDORSEMENT],
      },
    ],
    bullets: [
      {
        bulletId: 'M1.4',
        tools: ['workspace', 'admin-portal', 'semantic-model', 'power-bi-desktop'],
        concepts: [
          {
            text: 'Labels come from Microsoft Purview. Applying them to Power BI items needs a Pro or PPU license plus the Purview licensing, and the label must be published to the user.',
            sources: [INFO_PROTECTION],
          },
          {
            text: 'Capabilities: manual labeling (all items), default labeling, mandatory labeling (fully for Power BI items, partly for others), programmatic labeling with admin REST APIs, downstream inheritance (all items, with limitations), inheritance from data sources (semantic models only), and labels that follow supported exports.',
            sources: [INFO_PROTECTION],
          },
          {
            text: 'Protection travels with Excel, PDF, and PowerPoint exports and with .pbix downloads, but not with other paths such as CSV export or cross-tenant sharing.',
            sources: [INFO_PROTECTION],
          },
        ],
        howTo: [
          {
            text: 'Label items manually (supported for all Fabric items), or rely on default, mandatory, and inherited labeling. Labels can also be managed programmatically through the admin REST APIs. Use the OneLake catalog’s governance experiences to monitor label coverage and find unlabeled items.',
            sources: [INFO_PROTECTION],
          },
        ],
      },
      {
        bulletId: 'M1.5',
        tools: ['workspace', 'admin-portal'],
        concepts: [
          {
            text: 'Promoted: the creator says the item is ready to share. Any user with write permission can promote any item except dashboards.',
            sources: [ENDORSEMENT],
          },
          {
            text: 'Certified: an authorized reviewer confirms the item meets organizational standards. Anyone can request certification, but only users the Fabric admin specifies can certify.',
            sources: [ENDORSEMENT],
          },
          {
            text: 'Master data: the item is the authoritative source for core data such as customer lists. It applies only to items that contain data, such as lakehouses and semantic models, and only admin-specified users can apply it.',
            sources: [ENDORSEMENT],
          },
        ],
        howTo: [
          {
            text: 'Follow Learn’s promote, certify, and master data procedures for the item. Certification and master data must first be enabled by a Fabric admin, and certification can be delegated to domain admins so each domain has its own reviewers.',
            sources: [ENDORSEMENT],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'Endorsed items get a badge and are listed first in some lists. Endorsement doesn’t change who can access the item.',
        sources: [ENDORSEMENT],
      },
      {
        text: 'Power BI dashboards can’t be promoted or certified.',
        sources: [ENDORSEMENT],
      },
      {
        text: 'Label access control only works in the tenant where it was applied, for .pbix files, and for supported exports. Cross-tenant scenarios and CSV/TXT exports aren’t protected.',
        sources: [INFO_PROTECTION],
      },
    ],
    dontConfuse: [
      {
        pairId: 'endorse-vs-label',
        a: 'Endorsement (promoted / certified / master data)',
        b: 'Sensitivity label',
        difference: [
          {
            text: 'Endorsement says how trustworthy or authoritative an item is, to help discovery. It is set in Fabric and has no access effect. A sensitivity label says how sensitive the data is. It comes from Microsoft Purview, can enforce encryption and access through protection policies, propagates downstream, and follows supported exports.',
            sources: [ENDORSEMENT, INFO_PROTECTION],
          },
          {
            text: 'Who can apply: promote = anyone with write permission; certify and master data = admin-designated users; labels = users included in the tenant setting who also have the label published to them.',
            sources: [ENDORSEMENT, INFO_PROTECTION],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Sensitivity label',
        definition: 'A Microsoft Purview classification (such as Confidential) applied to an item. It can carry protection policies and propagate to downstream items and supported exports.',
        sources: [INFO_PROTECTION],
      },
      {
        term: 'Downstream inheritance',
        definition: 'When a label applied to an item automatically propagates to items that depend on it.',
        sources: [INFO_PROTECTION],
      },
      {
        term: 'Endorsement',
        definition: 'A Fabric badge marking an item as Promoted, Certified, or Master data to help people find trustworthy content.',
        sources: [ENDORSEMENT],
      },
      {
        term: 'Master data',
        definition: 'An endorsement for data items that are the authoritative single source of truth for core business data.',
        sources: [ENDORSEMENT],
      },
    ],
    needsVerification: [],
  },

  // ── Pattern Ledger ───────────────────────────────────────────────────
  {
    machineId: 'pattern-ledger',
    overview: [
      {
        text: 'Git integration connects a Fabric workspace to a branch in Azure DevOps or GitHub, so item definitions are versioned, can be reverted, and can be developed on branches. It is the source-control half of Fabric’s lifecycle tools.',
        sources: [GIT_INTRO],
      },
    ],
    bullets: [
      {
        bulletId: 'M2.1',
        tools: ['workspace'],
        concepts: [
          {
            text: 'Supported providers: Azure DevOps, GitHub, and GitHub Enterprise, all cloud-based only. Integration is at workspace level, and folder structure (up to 10 levels) is mirrored in the repo.',
            sources: [GIT_INTRO, GIT_PROCESS],
          },
          {
            text: 'Only a workspace Admin can connect or disconnect the workspace. After that, Members and Contributors can commit and update according to their Git permissions. Each user configures their own Git account connection.',
            sources: [GIT_PROCESS],
          },
          {
            text: 'Git status per item: Synced, Conflict, Uncommitted changes, Update required, or Unsupported. Commit sends workspace changes to Git; Update brings Git changes into the workspace.',
            sources: [GIT_PROCESS],
          },
          {
            text: 'Not every item is supported. Learn keeps a list, and some entries (including semantic models) are marked preview.',
            sources: [GIT_INTRO],
          },
        ],
        howTo: [
          {
            text: 'Your organization’s admin must first enable Git integration. Then a workspace Admin connects the workspace to a repository branch (and folder). The connected branch can later be changed from the workspace settings dialog.',
            sources: [GIT_PROCESS],
          },
          {
            text: 'Initial sync: if one side is empty, content copies to it. If both sides have content, choose a direction. Committing overwrites Git; updating overwrites the workspace, which is why Fabric asks you to confirm.',
            sources: [GIT_PROCESS],
          },
          {
            text: 'Use the Source control pane to commit and update. Use branch out or checkout to work on a new branch, then merge through your Git provider’s pull requests.',
            sources: [GIT_PROCESS],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'Updating the workspace from Git when both sides have content overwrites the workspace. A Git branch can be restored to an earlier commit, but the workspace can’t.',
        sources: [GIT_PROCESS],
      },
      {
        text: 'Members and Contributors can switch the connected branch only if an Admin enables "Allow users with at least Contributor role to change Git branch".',
        sources: [GIT_PROCESS],
      },
      {
        text: 'Empty folders aren’t copied to Git.',
        sources: [GIT_PROCESS],
      },
    ],
    dontConfuse: [
      {
        pairId: 'commit-vs-update',
        a: 'Commit',
        b: 'Update',
        difference: [
          {
            text: 'Commit pushes workspace changes into the connected Git branch. Update pulls the branch’s latest commit into the workspace. The Git status column shows which one each item needs.',
            sources: [GIT_PROCESS],
          },
        ],
      },
    ],
    renamed: [],
    preview: [
      {
        feature: 'Git integration for semantic models',
        note: 'Listed with "(preview)" in Learn’s Git supported-items list (excluding push datasets, live connections to Analysis Services, and model v1).',
        sources: [GIT_INTRO],
      },
    ],
    upcoming: [
      {
        date: '2026-12-01',
        change: 'Users without read-write permissions on workspace items can’t use Git integration. Sensitivity labels and protection policies on items may cause loss of access to those items through Git.',
        sources: [GIT_PROCESS],
      },
    ],
    glossary: [
      {
        term: 'Git integration',
        definition: 'Fabric’s workspace-level connection to an Azure DevOps or GitHub branch for versioning item definitions.',
        sources: [GIT_INTRO],
      },
      {
        term: 'Commit (Fabric Git)',
        definition: 'Saving the workspace’s changed items to the connected Git branch.',
        sources: [GIT_PROCESS],
      },
      {
        term: 'Update (Fabric Git)',
        definition: 'Bringing the latest commit from the connected branch into the workspace, overwriting workspace items.',
        sources: [GIT_PROCESS],
      },
      {
        term: 'Branched workspace',
        definition: 'A workspace created by a Git branch-out that is linked to its source workspace for isolated development.',
        sources: [`${L}fabric/fundamentals/workspaces`],
      },
    ],
    needsVerification: [],
  },

  // ── Draft Table ──────────────────────────────────────────────────────
  {
    machineId: 'draft-table',
    overview: [
      {
        text: 'A Power BI Desktop project (.pbip) saves a report and its semantic model as folders of plain-text files instead of one binary .pbix. That makes Power BI work diffable, reviewable, and ready for Git and CI/CD. Windows only: Power BI Desktop requires Windows.',
        sources: [PBIP, DESKTOP],
      },
    ],
    bullets: [
      {
        bulletId: 'M2.2',
        tools: ['power-bi-desktop'],
        concepts: [
          {
            text: 'Saving as a project creates <name>.Report and <name>.SemanticModel folders, a .gitignore, and a <name>.pbip file that just points to the report folder. You can also open the report directly from its definition.pbir.',
            sources: [PBIP],
          },
          {
            text: 'The generated .gitignore excludes the local data cache (cache.abf) and localSettings.json, so data isn’t committed to source control.',
            sources: [PBIP],
          },
          {
            text: 'Model metadata is stored as TMDL files in the semantic model’s definition folder, which you can edit in VS Code or other tools.',
            sources: [PBIP],
          },
        ],
        howTo: [
          {
            text: 'In Power BI Desktop, save a new or existing report as a project (.pbip) and commit the folder to Git. To publish, use Desktop’s Publish (which sends a temporary .pbix with data) or deploy only the metadata through other mechanisms such as Fabric Git integration.',
            sources: [PBIP],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'You can’t save a PBIP directly to OneDrive or SharePoint from Desktop, and saving into a locally synced OneDrive folder can cause sync failures.',
        sources: [PBIP],
      },
      {
        text: 'The .pbip file is optional. It is only a shortcut to the report folder; the definition files are what matter.',
        sources: [PBIP],
      },
      {
        text: 'Other deployment paths deploy metadata only, so the model must be refreshed in the service to get data. Desktop Publish also sends the local data cache.',
        sources: [PBIP],
      },
    ],
    dontConfuse: [],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Power BI project (.pbip)',
        definition: 'A Power BI Desktop save format that stores report and semantic model definitions as plain-text files in folders, designed for source control.',
        sources: [PBIP],
      },
      {
        term: 'TMDL',
        definition: 'Tabular Model Definition Language: the text format of semantic model metadata in a .pbip project. Also used in Desktop’s TMDL view.',
        sources: [PBIP, CALC_GROUPS],
      },
    ],
    needsVerification: [],
  },

  // ── Conveyor ─────────────────────────────────────────────────────────
  {
    machineId: 'conveyor',
    overview: [
      {
        text: 'Deployment pipelines move content through stages (by default Development, Test, Production) inside the Fabric service, so you can test before users see changes. They are the release half of the lifecycle tools, alongside Git integration for version control.',
        sources: [PIPELINES_INTRO, PIPELINES_START],
      },
    ],
    bullets: [
      {
        bulletId: 'M2.3',
        tools: ['workspace'],
        concepts: [
          {
            text: 'A pipeline has 2 to 10 stages, set when it is created and fixed afterwards. Each stage is assigned one workspace (on a capacity).',
            sources: [PIPELINES_START],
          },
          {
            text: 'Deploying copies item definitions (metadata) from one stage to the next, keeps links between items, and overwrites the paired items in the target. Data isn’t copied, so refresh semantic models after deploying.',
            sources: [PIPELINES_PROCESS],
          },
          {
            text: 'Deployment rules change settings per stage: data source rules, parameter rules, and default lakehouse rules for notebooks. For example, production points at the production database.',
            sources: [PIPELINES_RULES],
          },
          {
            text: 'An optional deployment plan adds ordering and pre- or post-deployment actions.',
            sources: [PIPELINES_INTRO],
          },
          {
            text: 'Pipelines have only one permission, Admin, and it grants no access to workspace content. What you can do inside a stage comes from your workspace role there, so pipeline admin and workspace roles are managed separately.',
            sources: [PIPELINES_PROCESS],
          },
          {
            text: 'Autobinding: a deployed item reconnects to the item it depends on in the target stage (for example a report to the target stage’s semantic model). A Direct Lake semantic model is the exception: it stays bound to the source stage’s lakehouse until you add a datasource rule.',
            sources: [PIPELINES_PROCESS],
          },
        ],
        howTo: [
          {
            text: 'Create the pipeline (you need to be a workspace admin), name the stages, and assign a workspace to a stage. Compare stages, then deploy all or selected items to the next stage. Rules are defined on the target stage and take effect on the next deployment.',
            sources: [PIPELINES_START, PIPELINES_RULES],
          },
          {
            text: 'Permissions per action: deploy between stages = pipeline admin + at least Contributor on both the source and target workspaces. Deploy to an empty stage = pipeline admin + Contributor on the source workspace. Assign a workspace to a stage = pipeline admin + Admin of that workspace. Nuance: the same page’s “Granted permissions” table lists workspace Member as the permission to deploy an existing semantic model or paginated report, and dataflow owner for dataflows. The two tables differ for semantic models and paginated reports, so this app doesn’t test a Contributor deploying those.',
            sources: [PIPELINES_PROCESS],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'A deployment fails if an item depends on another item that isn’t in the target stage and isn’t being deployed (for example a report without its semantic model).',
        sources: [PIPELINES_PROCESS],
      },
      {
        text: 'A Direct Lake semantic model doesn’t autobind to the target stage’s lakehouse. After deployment it still reads the source stage’s lakehouse until you add a datasource rule. Other semantic models autobind to items in the target stage.',
        sources: [PIPELINES_PROCESS],
      },
      {
        text: 'Being a pipeline admin alone doesn’t let you see or deploy content. You also need a workspace role in the stages involved.',
        sources: [PIPELINES_PROCESS],
      },
      {
        text: 'Data source rules only work when switching between data sources of the same type.',
        sources: [PIPELINES_RULES],
      },
      {
        text: 'Since February 12, 2026, deployment pipelines no longer support semantic models that haven’t been upgraded to Enhanced Metadata.',
        sources: [PIPELINES_INTRO],
      },
      {
        text: 'A data pipeline (Data Factory) is unrelated to a deployment pipeline (lifecycle).',
        sources: [`${L}fabric/fundamentals/fabric-terminology`],
      },
    ],
    dontConfuse: [
      {
        pairId: 'pipelines-vs-git',
        a: 'Deployment pipelines',
        b: 'Git integration',
        difference: [
          {
            text: 'Git integration is version control: a workspace syncs with a branch for history, branching, and reverting. Deployment pipelines are release management: they copy content between stage workspaces (Dev → Test → Prod) inside Fabric, applying rules per stage.',
            sources: [GIT_INTRO, PIPELINES_INTRO],
          },
          {
            text: 'They’re independent. Deployment pipelines don’t require Git (Learn’s pipeline docs point to Git separately for version control), and many teams use both: Git on the development workspace, pipelines to promote.',
            sources: [PIPELINES_INTRO],
          },
          {
            text: 'Permissions differ: connecting Git needs the workspace Admin role; creating a deployment pipeline needs you to be a workspace admin, and sharing the pipeline makes others pipeline admins.',
            sources: [GIT_PROCESS, PIPELINES_START],
          },
        ],
      },
    ],
    renamed: [],
    preview: [
      {
        feature: 'New deployment pipelines user interface',
        note: 'The new UI is in preview, and some deployable item types are preview too.',
        sources: [PIPELINES_INTRO],
      },
    ],
    upcoming: [
      {
        date: '2026-12-01',
        change: 'Users without read-write permissions on all workspace items can’t deploy to, or assign, workspaces that contain items protected by sensitivity labels with protection policies.',
        sources: [PIPELINES_PROCESS],
      },
    ],
    glossary: [
      {
        term: 'Deployment pipeline',
        definition: 'A Fabric lifecycle tool with 2 to 10 stages, each backed by a workspace, used to promote content from development to production.',
        sources: [PIPELINES_INTRO, PIPELINES_START],
      },
      {
        term: 'Deployment rule',
        definition: 'A per-stage setting (data source, parameter, or default lakehouse) that changes an item’s configuration when content is deployed to that stage.',
        sources: [PIPELINES_RULES],
      },
      {
        term: 'Paired items',
        definition: 'Items in different pipeline stages linked as the same content. Deployment overwrites the paired item in the target stage.',
        sources: [PIPELINES_PROCESS],
      },
    ],
    needsVerification: [
      {
        claim: 'Which workspace role is needed to deploy an existing semantic model or paginated report through a deployment pipeline: Contributor (the page’s action table) or Member (its “Granted permissions” item table).',
        why: 'Both tables are on Understand the deployment process and disagree for these item types (Step 5 review). No question or puzzle tests a Contributor deploying them; confirm in Step 8.',
      },
    ],
  },

  // ── Ripple Map ───────────────────────────────────────────────────────
  {
    machineId: 'ripple-map',
    overview: [
      {
        text: 'Before you change a lakehouse table, a warehouse, a dataflow, or a semantic model, find out what depends on it. Lineage view shows how items connect, and impact analysis lists every downstream item and workspace a change could break, with a way to warn their owners.',
        sources: [LINEAGE, IMPACT],
      },
    ],
    bullets: [
      {
        bulletId: 'M2.4',
        tools: ['workspace', 'lakehouse', 'warehouse', 'dataflow-gen2', 'semantic-model'],
        concepts: [
          {
            text: 'Lineage view (one per workspace) shows every item in the workspace and how they connect, plus upstream sources one level outside the workspace. Downstream items in other workspaces aren’t shown there.',
            sources: [LINEAGE],
          },
          {
            text: 'Impact analysis shows direct children or all downstream items, including those in other workspaces, grouped by type or by workspace. For data sources it shows only direct children and the connection string.',
            sources: [IMPACT],
          },
          {
            text: 'Notify contacts emails the contact lists of all affected workspaces, even ones you can’t access.',
            sources: [IMPACT],
          },
        ],
        howTo: [
          {
            text: 'Open impact analysis from the item’s card in lineage view or from Lineage on the item’s details page. Switch between Child items and All downstream items, then select Notify contacts and describe the change.',
            sources: [IMPACT],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'You need write permission on an item to run impact analysis on it. Items you can’t access appear as "Limited access".',
        sources: [IMPACT],
      },
      {
        text: 'Viewers can open lineage view but don’t see data sources.',
        sources: [LINEAGE],
      },
      {
        text: 'To see downstream dependencies outside the current workspace, use impact analysis, not lineage view.',
        sources: [LINEAGE],
      },
    ],
    dontConfuse: [
      {
        pairId: 'lineage-vs-impact',
        a: 'Lineage view',
        b: 'Impact analysis',
        difference: [
          {
            text: 'Lineage view is a workspace-wide diagram of how items connect (plus upstream sources one level out). Impact analysis starts from one item and lists everything downstream, across workspaces, with counts and a notify option.',
            sources: [LINEAGE, IMPACT],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Lineage view',
        definition: 'A workspace view showing the items in the workspace and the data flow between them, including upstream sources one level outside.',
        sources: [LINEAGE],
      },
      {
        term: 'Impact analysis',
        definition: 'A pane listing an item’s direct or all downstream dependents across workspaces, with an option to notify their contacts.',
        sources: [IMPACT],
      },
      {
        term: 'Workspace contact list',
        definition: 'The users or groups notified about issues in a workspace. Impact analysis notifications go to these lists.',
        sources: [WORKSPACES, IMPACT],
      },
    ],
    needsVerification: [],
  },

  // ── Remote Loom Control ──────────────────────────────────────────────
  {
    machineId: 'remote-loom-control',
    overview: [
      {
        text: 'The XMLA endpoint exposes semantic models in a capacity workspace with the same protocol as Analysis Services. That lets enterprise tools query, script, deploy, and refresh models outside Power BI Desktop, for example SSMS, Tabular Editor, Visual Studio, ALM Toolkit, and PowerShell.',
        sources: [XMLA],
      },
    ],
    bullets: [
      {
        bulletId: 'M2.5',
        tools: ['semantic-model', 'admin-portal', 'workspace'],
        concepts: [
          {
            text: 'Read-only XMLA is on by default for the capacity’s semantic models workload. Writing (deploying, changing metadata, TMSL scripting) needs the capacity’s XMLA Endpoint setting set to Read Write, which applies to all workspaces on the capacity.',
            sources: [XMLA],
          },
          {
            text: 'Workspace Contributors and above have Write permission on semantic models over XMLA, which is effectively Analysis Services database admin.',
            sources: [XMLA],
          },
          {
            text: 'Each capacity workspace has a connection URL: powerbi://api.powerbi.com/v1.0/[tenant]/[workspace name].',
            sources: [XMLA],
          },
          {
            text: 'TMSL refresh types include full (refresh data and recalculate dependents), dataOnly, calculate, and automatic (refresh only what needs it). TMSL refresh can also override an incremental refresh policy.',
            sources: [TMSL_REFRESH],
          },
        ],
        howTo: [
          {
            text: 'Enable read-write: in the admin portal’s capacity settings, expand Workloads (or the semantic model workload settings for PPU) and set XMLA Endpoint to Read Write.',
            sources: [XMLA],
          },
          {
            text: 'Copy the URL from Workspace settings > Premium > Workspace Connection, paste it as the server in SSMS or Tabular Editor, or as the Deployment Server in a Visual Studio tabular project.',
            sources: [XMLA],
          },
          {
            text: 'Turn on the large semantic model storage format for models you manage through XMLA, because it improves XMLA write performance.',
            sources: [LARGE_MODELS],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Refresh one table over XMLA with TMSL',
        language: 'tmsl',
        illustrative: true,
        steps: [
          {
            code: '{\n  "refresh": {\n    "type": "full",\n    "objects": [\n      { "database": "SalesModel", "table": "FactSales" }\n    ]\n  }\n}',
            explain: 'Run in SSMS connected to the workspace’s XMLA URL. It fully refreshes the FactSales table (reload data and recalculate dependents) in the SalesModel semantic model.',
          },
        ],
        sources: [TMSL_REFRESH, XMLA],
      },
    ],
    traps: [
      {
        text: 'Semantic models in Pro workspaces don’t support XMLA write operations. You need a capacity or PPU.',
        sources: [LARGE_MODELS, XMLA],
      },
      {
        text: 'Read-only is the default. If a deployment from Tabular Editor or Visual Studio fails, check the capacity’s XMLA Endpoint setting.',
        sources: [XMLA],
      },
    ],
    dontConfuse: [
      {
        pairId: 'xmla-read-vs-readwrite',
        a: 'XMLA read-only',
        b: 'XMLA read-write',
        difference: [
          {
            text: 'Read-only (default) lets tools query data, metadata, events, and schema: Excel, DAX Studio, Report Builder, SSMS queries. Read-write adds metadata changes and deployment: SSMS TMSL scripting, Tabular Editor saves, the Visual Studio deployment wizard, ALM Toolkit deploys, and PowerShell refresh.',
            sources: [XMLA],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'XMLA endpoint',
        definition: 'An Analysis Services-compatible endpoint on capacity workspaces that client tools use to query and manage semantic models.',
        sources: [XMLA],
      },
      {
        term: 'TMSL',
        definition: 'Tabular Model Scripting Language: JSON commands (such as refresh, createOrReplace, export) sent over XMLA to manage tabular models.',
        sources: [TMSL_REFRESH, XMLA],
      },
      {
        term: 'Workspace connection URL',
        definition: 'The powerbi:// address of a capacity workspace used as the server name by XMLA tools.',
        sources: [XMLA],
      },
    ],
    needsVerification: [],
  },

  // ── Pattern Book ─────────────────────────────────────────────────────
  {
    machineId: 'pattern-book',
    pl300Adds: [
      {
        text: 'PL-300 covered connecting to shared semantic models. DP-600 adds packaging reuse: .pbit templates (report plus model plus queries without data), .pbids files (a ready-made data connection), and managing shared models with Build permission, endorsement, and cross-workspace reuse. .pbit and .pbids are created in Power BI Desktop, which is Windows only.',
        sources: [TEMPLATES, PBIDS, SHARED_MODELS, DESKTOP],
      },
    ],
    overview: [
      {
        text: 'Reusable assets stop teams rebuilding the same model or connection. One certified shared semantic model serves many reports. A template gives authors a standard starting layout and model. A .pbids file gives beginners a one-click connection.',
        sources: [SHARED_MODELS, TEMPLATES, PBIDS],
      },
    ],
    bullets: [
      {
        bulletId: 'M2.6',
        tools: ['power-bi-desktop', 'semantic-model', 'workspace'],
        concepts: [
          {
            text: '.pbit (Power BI template): contains report pages and visuals, the data model definition, and all queries and parameters, but no data. Opening it prompts for parameter values and data source credentials.',
            sources: [TEMPLATES],
          },
          {
            text: '.pbids (Power BI data source file): a small JSON file describing one data source connection (protocol, address, optional DirectQuery or Import mode). Opening it prompts for credentials and opens Navigator to pick tables. It holds no credentials and no table list.',
            sources: [PBIDS],
          },
          {
            text: 'Shared semantic models: one model reused by reports in many workspaces. Build permission controls who can create content on it, and promotion or certification helps people find it.',
            sources: [SHARED_MODELS],
          },
        ],
        howTo: [
          {
            text: 'Create a template: File > Export > Power BI template, then add a description. Use it by double-clicking the .pbit or with File > Import > Power BI template.',
            sources: [TEMPLATES],
          },
          {
            text: 'Create a .pbids: File > Options and settings > Data source settings, select the source, then Export PBIDS. Or write the JSON by hand.',
            sources: [PBIDS],
          },
          {
            text: 'Share a model: grant Build permission, endorse it, and let authors connect from the OneLake catalog or Get data in Desktop.',
            sources: [SHARED_MODELS, ENDORSEMENT],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'A .pbids file supports only one data source; listing more causes an error.',
        sources: [PBIDS],
      },
      {
        text: 'A .pbit has no data, but filter values saved in report metadata (for example Company = "Contoso") remain in the file.',
        sources: [TEMPLATES],
      },
      {
        text: 'Users with only a free license can build reports from shared models (with Build permission) only when the model is on Premium or an F64-or-larger capacity. Copying reports between workspaces needs Pro or PPU.',
        sources: [SHARED_MODELS],
      },
    ],
    dontConfuse: [
      {
        pairId: 'pbi-files',
        a: '.pbix vs .pbip',
        b: '.pbit vs .pbids',
        difference: [
          {
            text: '.pbix: a single Power BI Desktop report file with the model and data. .pbip: a project folder of plain-text report and model definitions (TMDL), with the local data cache git-ignored, built for source control.',
            sources: [TEMPLATES, PBIP],
          },
          {
            text: '.pbit: a template with report, model, and queries but no data, used as a starting point. .pbids: only a data source connection (JSON) that opens Get data for that source.',
            sources: [TEMPLATES, PBIDS],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: '.pbix',
        definition: 'The standard Power BI Desktop report file, containing report, model, and imported data in one file.',
        sources: [TEMPLATES],
      },
      {
        term: 'Power BI template (.pbit)',
        definition: 'A Power BI Desktop file containing report pages, model definition, and queries but no data, used as a starting point for new reports.',
        sources: [TEMPLATES],
      },
      {
        term: 'Power BI data source file (.pbids)',
        definition: 'A JSON file describing a single data source connection that opens Power BI Desktop’s Get data for that source.',
        sources: [PBIDS],
      },
      {
        term: 'Shared semantic model',
        definition: 'A semantic model reused by reports in other workspaces, controlled with Build permission and usually endorsed.',
        sources: [SHARED_MODELS],
      },
    ],
    needsVerification: [],
  },
]
