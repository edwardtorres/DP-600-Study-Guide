/**
 * Source pages for lab steps. Steps link to a section (#anchor) rather than
 * repeating long click paths. microsoftlearning.github.io exercises are used
 * for lab steps only, never for exam facts or questions.
 */

const L = 'https://learn.microsoft.com/en-us/'
const ML = 'https://microsoftlearning.github.io/mslearn-fabric/Instructions/Labs/'

/** A Microsoft Learn exercise page, optionally at a section. */
export const ex = (file: string, anchor?: string) => `${ML}${file}.html${anchor ? `#${anchor}` : ''}`
/** A learn.microsoft.com page, optionally at a section. */
export const learn = (path: string, anchor?: string) => `${L}${path}${anchor ? `#${anchor}` : ''}`

export const P = {
  trial: 'fabric/fundamentals/fabric-trial',
  workspaces: 'fabric/fundamentals/create-workspaces',
  terminology: 'fabric/fundamentals/fabric-terminology',
  roles: 'fabric/fundamentals/roles-workspaces',
  shortcut: 'fabric/onelake/shortcuts/create-onelake-shortcut',
  decideLhWh: 'fabric/fundamentals/decision-guide-lakehouse-warehouse',
  union: 'sql/t-sql/language-elements/set-operators-union-transact-sql?view=fabric',
  dlOverview: 'fabric/fundamentals/direct-lake-overview',
  gitIntro: 'fabric/cicd/git-integration/intro-to-git-integration',
  catalogExplore: 'fabric/governance/onelake-catalog-explore',
  dataStoreGuide: 'fabric/fundamentals/decision-guide-data-store',
  connections: 'fabric/data-factory/data-source-management',
  dataflow: 'fabric/data-factory/create-first-dataflow-gen2',
  pipeline: 'fabric/data-factory/create-first-pipeline-with-sample-data',
  dataWrangler: 'fabric/data-science/data-wrangler',
  visualQuery: 'fabric/data-warehouse/visual-query-editor',
  sqlEditor: 'fabric/data-warehouse/sql-query-editor',
  createView: 'sql/t-sql/statements/create-view-transact-sql?view=fabric',
  createEventhouse: 'fabric/real-time-intelligence/create-eventhouse',
  ehOneLake: 'fabric/real-time-intelligence/event-house-onelake-availability',
  rtHub: 'fabric/real-time-hub/real-time-hub-overview',
  dlDevelop: 'fabric/fundamentals/direct-lake-develop',
  dlHow: 'fabric/fundamentals/direct-lake-how-it-works',
  composite: 'power-bi/transform-model/desktop-composite-models',
  calcGroups: 'power-bi/transform-model/calculation-groups',
  dfs: 'power-bi/create-reports/desktop-dynamic-format-strings',
  fieldParams: 'power-bi/create-reports/power-bi-field-parameters',
  perfAnalyzer: 'power-bi/create-reports/performance-analyzer',
  daxQueryView: 'power-bi/transform-model/dax-query-view',
  daxQueries: 'dax/dax-queries',
  defineStatement: 'dax/define-statement-dax',
  summarizecolumns: 'dax/summarizecolumns-function-dax',
  smRls: 'fabric/security/service-admin-row-level-security',
  smOls: 'fabric/security/service-admin-object-level-security',
  whRls: 'fabric/data-warehouse/row-level-security',
  whCls: 'fabric/data-warehouse/column-level-security',
  ddm: 'fabric/data-warehouse/dynamic-data-masking',
  whShare: 'fabric/data-warehouse/share-warehouse-manage-permissions',
  oneLakeSecurity: 'fabric/onelake/security/get-started-security',
  endorse: 'fabric/fundamentals/endorsement-promote-certify',
  labels: 'fabric/fundamentals/apply-sensitivity-labels',
  lineage: 'fabric/governance/lineage',
  impact: 'fabric/governance/impact-analysis',
  git: 'fabric/cicd/git-integration/git-get-started',
  deployStart: 'fabric/cicd/deployment-pipelines/get-started-with-deployment-pipelines',
  deployRules: 'fabric/cicd/deployment-pipelines/create-rules',
  getDesktop: 'power-bi/fundamentals/desktop-get-the-desktop',
  liveConnect: 'power-bi/connect-data/desktop-report-lifecycle-datasets',
  pbip: 'power-bi/developer/projects/projects-overview',
  pbipModel: 'power-bi/developer/projects/projects-dataset',
  pbit: 'power-bi/create-reports/desktop-templates',
  pbids: 'power-bi/connect-data/desktop-data-sources',
  sharedModels: 'power-bi/connect-data/service-datasets-across-workspaces',
  whConnect: 'fabric/data-warehouse/how-to-connect',
  incremental: 'power-bi/connect-data/incremental-refresh-configure',
  largeModels: 'fabric/enterprise/powerbi/service-premium-large-models',
  xmla: 'fabric/enterprise/powerbi/service-premium-connect-tools',
  smOneLake: 'fabric/enterprise/powerbi/onelake-integration-overview',
  webModel: 'fabric/fundamentals/direct-lake-web-modeling',
  editModels: 'power-bi/transform-model/service-edit-data-models',
  comparePipeline: 'fabric/cicd/deployment-pipelines/compare-pipeline-content',
  shortcuts: 'fabric/onelake/onelake-shortcuts',
  m2m: 'power-bi/guidance/relationships-many-to-many',
  relationships: 'power-bi/transform-model/desktop-relationships-understand',
  ctas: 'sql/t-sql/statements/create-table-as-select-azure-sql-data-warehouse?view=fabric',
  whModels: 'fabric/data-warehouse/semantic-models',
  whCreateModel: 'fabric/data-warehouse/create-semantic-model',
} as const
