import type { Question } from './types'

const L = 'https://learn.microsoft.com/en-us/'
const OVERVIEW = `${L}fabric/fundamentals/microsoft-fabric-overview`
const TERMS = `${L}fabric/fundamentals/fabric-terminology`
const ONELAKE = `${L}fabric/onelake/onelake-overview`
const LICENSES = `${L}fabric/enterprise/licenses`
const THROTTLING = `${L}fabric/enterprise/throttling`
const TRIAL = `${L}fabric/fundamentals/fabric-trial`
const DECISION = `${L}fabric/fundamentals/decision-guide-data-store`
const LAKEHOUSE = `${L}fabric/data-engineering/lakehouse-overview`
const WAREHOUSE = `${L}fabric/data-warehouse/data-warehousing`
const EVENTHOUSE = `${L}fabric/real-time-intelligence/eventhouse`
const DECIDE_LH_WH = `${L}fabric/fundamentals/decision-guide-lakehouse-warehouse`
const WORKSPACES = `${L}fabric/fundamentals/workspaces`
const DATA_FACTORY = `${L}fabric/data-factory/data-factory-overview`

export const orientationQuestions: Question[] = [
  // ── Founding Charter ─────────────────────────────────────────────────
  {
    id: 'FO-01',
    machineId: 'founding-charter',
    bulletIds: [],
    format: 'single',
    difficulty: 1,
    stem: 'Your company is adopting Microsoft Fabric. Data engineers will use Spark, analysts will use T-SQL, and report authors will use Power BI. You need all three groups to work on the same copy of the data. Which Fabric component provides the shared storage?',
    sources: [OVERVIEW, ONELAKE],
    options: [
      { id: 'a', text: 'OneLake', explain: 'Correct. Every Fabric workload stores and reads data in OneLake, so one copy serves Spark, T-SQL, and Power BI without duplication.' },
      { id: 'b', text: 'The Real-Time hub', explain: 'The Real-Time hub is the tenant-wide place to discover and ingest streaming data and events, not the storage layer for all workloads.' },
      { id: 'c', text: 'A Fabric capacity', explain: 'A capacity provides compute (capacity units), not storage. Workspaces run on capacities, but data lives in OneLake.' },
      { id: 'd', text: 'The OneLake catalog', explain: 'The OneLake catalog is for discovering and governing items. It doesn’t store the data itself.' },
    ],
    answer: 'a',
  },
  {
    id: 'FO-02',
    machineId: 'founding-charter',
    bulletIds: [],
    format: 'match',
    difficulty: 1,
    stem: 'You are explaining Fabric workloads to a new team. Match each task to the workload that provides it.',
    sources: [OVERVIEW, TERMS, DATA_FACTORY],
    prompts: [
      { id: 'p1', text: 'Connect to many data sources with built-in connectors and orchestrate data movement with pipelines' },
      { id: 'p2', text: 'Process large datasets with Apache Spark notebooks' },
      { id: 'p3', text: 'Analyze streaming IoT and log data as it arrives' },
      { id: 'p4', text: 'Build an enterprise warehouse developed with T-SQL' },
    ],
    choices: [
      { id: 'c1', text: 'Data Factory' },
      { id: 'c2', text: 'Data Engineering' },
      { id: 'c3', text: 'Real-Time Intelligence' },
      { id: 'c4', text: 'Data Warehouse' },
      { id: 'c5', text: 'Data Science' },
    ],
    pairs: [
      { promptId: 'p1', choiceId: 'c1', explain: 'Data Factory provides the connectors, pipelines, and Dataflow Gen2 used for data integration.' },
      { promptId: 'p2', choiceId: 'c2', explain: 'Data Engineering provides Apache Spark with notebooks for large-scale processing.' },
      { promptId: 'p3', choiceId: 'c3', explain: 'Real-Time Intelligence analyzes data in motion such as IoT readings, logs, and clickstreams.' },
      { promptId: 'p4', choiceId: 'c4', explain: 'Fabric Data Warehouse is a T-SQL relational warehouse. Data Science (the unused choice) is for building ML models.' },
    ],
  },
  {
    id: 'FO-03',
    machineId: 'founding-charter',
    bulletIds: [],
    format: 'yesno',
    difficulty: 2,
    stem: 'You are reviewing statements in a Fabric onboarding document. For each statement, select Yes if it is true. Otherwise, select No.',
    sources: [OVERVIEW, ONELAKE, TERMS],
    statements: [
      { id: 's1', text: 'Each user needs their own Azure subscription before they can use Fabric.', answer: false, explain: 'No. Fabric is SaaS and OneLake hides Azure details; Learn states you don’t need an Azure account to use Fabric.' },
      { id: 's2', text: 'A table created with T-SQL in a warehouse can be read by a Spark notebook without exporting or copying it.', answer: true, explain: 'Yes. All engines store tables in OneLake in Delta format, so Spark reads the warehouse’s tables directly.' },
      { id: 's3', text: 'A Data Factory pipeline and a deployment pipeline are the same kind of item.', answer: false, explain: 'No. Learn notes that data pipelines (orchestration) are different from deployment pipelines (lifecycle promotion between stages).' },
    ],
  },

  // ── Water Wheel ──────────────────────────────────────────────────────
  {
    id: 'FO-04',
    machineId: 'water-wheel',
    bulletIds: [],
    format: 'single',
    difficulty: 2,
    stem: 'Your organization will publish Power BI reports to a Fabric workspace. Most report consumers have only a Microsoft Fabric free license and will be given the Viewer role. You need them to view the reports without buying more per-user licenses, at the lowest cost. What should you assign the workspace to?',
    sources: [LICENSES],
    options: [
      { id: 'a', text: 'F32', explain: 'On F SKUs smaller than F64, every viewer of Power BI content needs a Pro, PPU, or individual trial license.' },
      { id: 'b', text: 'F64', explain: 'Correct. On F64 or larger, users with only a free license and the Viewer role can view Power BI content.' },
      { id: 'c', text: 'F2', explain: 'F2 is the smallest F SKU. Free-license viewers still need Pro, PPU, or a trial license to view Power BI content there.' },
      { id: 'd', text: 'A Premium Per User (PPU) workspace', explain: 'A PPU workspace requires each viewer to have a PPU license (or individual trial), and it isn’t a Fabric capacity.' },
    ],
    answer: 'b',
  },
  {
    id: 'FO-05',
    machineId: 'water-wheel',
    bulletIds: [],
    format: 'yesno',
    difficulty: 2,
    stem: 'A capacity administrator is investigating slow reports during a large overnight data load. For each statement about Fabric capacity behavior, select Yes if it is true. Otherwise, select No.',
    sources: [THROTTLING],
    statements: [
      { id: 's1', text: 'Background operations, such as scheduled refreshes, have their CU usage smoothed over 24 hours.', answer: true, explain: 'Yes. Fabric smooths background operations over a 24-hour period.' },
      { id: 's2', text: 'As soon as utilization goes above 100%, Fabric rejects all new requests.', answer: false, explain: 'No. Overage protection allows 10 minutes of future capacity first; throttling then escalates in stages (delays, then rejecting interactive, then rejecting all).' },
      { id: 's3', text: 'An overloaded capacity slows down workspaces that are assigned to other capacities in the same tenant.', answer: false, explain: 'No. Throttling applies at the capacity level; other capacities can keep running normally.' },
    ],
  },
  {
    id: 'FO-06',
    machineId: 'water-wheel',
    bulletIds: [],
    format: 'single',
    difficulty: 1,
    stem: 'Your Fabric tenant has dozens of workspaces owned by Finance, Marketing, and Operations. You need to group the workspaces by business area so that Fabric administrators can delegate management and apply governance above the workspace level. What should you use?',
    sources: [TERMS, ONELAKE, WORKSPACES],
    options: [
      { id: 'a', text: 'A separate capacity for each business area', explain: 'Capacities control compute and billing. They don’t provide a governance grouping for delegating management.' },
      { id: 'b', text: 'Workspace folders', explain: 'Folders organize items inside a single workspace, not workspaces across the tenant.' },
      { id: 'c', text: 'Domains', explain: 'Correct. Domains group workspaces into business areas so admins can delegate management and apply governance policies above the workspace level.' },
      { id: 'd', text: 'OneLake shortcuts', explain: 'Shortcuts reference data in other locations. They don’t organize workspaces or delegate administration.' },
    ],
    answer: 'c',
  },

  // ── Three Vats ───────────────────────────────────────────────────────
  {
    id: 'FO-07',
    machineId: 'three-vats',
    bulletIds: [],
    format: 'single',
    difficulty: 2,
    stem: 'A team of SQL developers needs a Fabric data store for curated sales data. Their load procedures update several tables and must commit or roll back all the changes together. Which data store should they use?',
    sources: [DECIDE_LH_WH, WAREHOUSE, EVENTHOUSE],
    trapPairId: 'stores',
    options: [
      { id: 'a', text: 'A lakehouse', explain: 'A lakehouse doesn’t support multi-table transactions, and it is developed mainly with Spark.' },
      { id: 'b', text: 'The SQL analytics endpoint of a lakehouse', explain: 'The SQL analytics endpoint is read-only for data, so T-SQL there can’t insert, update, or delete rows.' },
      { id: 'c', text: 'An eventhouse', explain: 'An eventhouse targets streaming, time-based event data queried with KQL, not transactional T-SQL loads.' },
      { id: 'd', text: 'A warehouse', explain: 'Correct. A warehouse is developed with T-SQL and supports full multi-table ACID transactions.' },
    ],
    answer: 'd',
  },
  {
    id: 'FO-08',
    machineId: 'three-vats',
    bulletIds: [],
    format: 'single',
    difficulty: 2,
    stem: 'You uploaded several CSV files to the Files area of a lakehouse. Analysts report that the data doesn’t appear when they connect to the lakehouse’s SQL analytics endpoint. You need the data to be queryable from the endpoint. What should you do?',
    sources: [LAKEHOUSE],
    trapPairId: 'stores',
    options: [
      { id: 'a', text: 'Load the CSV data into a Delta table in the Tables area', explain: 'Correct. Only Delta tables appear in the SQL analytics endpoint; CSV and Parquet files in Files can’t be queried there until converted.' },
      { id: 'b', text: 'Give the analysts the Contributor workspace role', explain: 'This is about format and location, not permissions. Even workspace admins can’t query CSV files through the endpoint.' },
      { id: 'c', text: 'Turn on OneLake availability for the lakehouse', explain: 'OneLake availability and sync don’t convert files: the SQL analytics endpoint shows only Delta tables, so CSV files in Files stay invisible until loaded into a Delta table.' },
      { id: 'd', text: 'Create a shortcut to the CSV folder in the Files area', explain: 'Files-area shortcuts aren’t discovered as tables, and the data still isn’t in Delta format.' },
    ],
    answer: 'a',
  },
  {
    id: 'FO-09',
    machineId: 'three-vats',
    bulletIds: [],
    format: 'match',
    difficulty: 2,
    stem: 'You are designing a Fabric solution with three workloads. Match each workload to the data store you should use.',
    sources: [DECISION, DECIDE_LH_WH, EVENTHOUSE],
    trapPairId: 'stores',
    prompts: [
      { id: 'p1', text: 'High-volume telemetry events analyzed interactively with KQL within seconds of arrival' },
      { id: 'p2', text: 'Raw JSON, images, and Parquet files processed by data engineers in PySpark notebooks' },
      { id: 'p3', text: 'A star schema for BI built and loaded by SQL developers with T-SQL stored procedures' },
    ],
    choices: [
      { id: 'c1', text: 'Eventhouse' },
      { id: 'c2', text: 'Lakehouse' },
      { id: 'c3', text: 'Warehouse' },
      { id: 'c4', text: 'SQL database in Fabric' },
    ],
    pairs: [
      { promptId: 'p1', choiceId: 'c1', explain: 'Eventhouses are built for streaming, time-based event data queried with KQL.' },
      { promptId: 'p2', choiceId: 'c2', explain: 'Lakehouses hold structured and unstructured data and are developed mainly with Spark.' },
      { promptId: 'p3', choiceId: 'c3', explain: 'Warehouses are T-SQL-first and suit dimensional models for BI. SQL database in Fabric (unused) also runs T-SQL, but Learn positions it for operational OLTP workloads, not enterprise warehousing and SQL-based BI.' },
    ],
  },

  // ── Mill Lease ───────────────────────────────────────────────────────
  {
    id: 'FO-10',
    machineId: 'mill-lease',
    bulletIds: [],
    format: 'single',
    difficulty: 2,
    stem: 'Your 60-day Fabric trial capacity expired yesterday. The workspace contains a lakehouse and notebooks you want to keep using. What should you do?',
    sources: [TRIAL],
    options: [
      { id: 'a', text: 'Export each item to a .pbix file before the content is deleted', explain: 'Learn’s way to keep trial content is to reassign the workspace to a paid capacity within 7 days; exporting items isn’t part of that guidance.' },
      { id: 'b', text: 'Assign the workspace to a paid F or P capacity within 7 days', explain: 'Correct. Content stays in OneLake for 7 days after the trial ends and is reactivated when the workspace is assigned to a paid F or P capacity.' },
      { id: 'c', text: 'Start a new Power BI individual trial', explain: 'A Power BI individual trial is a per-user license. It doesn’t give the workspace the capacity that non-Power BI items need.' },
      { id: 'd', text: 'Change the workspace type to Pro', explain: 'The workspace is already reverted to Pro when the trial ends, and Pro can’t run non-Power BI Fabric items.' },
    ],
    answer: 'b',
  },
  {
    id: 'FO-11',
    machineId: 'mill-lease',
    bulletIds: [],
    format: 'yesno',
    difficulty: 1,
    stem: 'You are planning hands-on labs on a Fabric trial capacity. For each statement, select Yes if it is true. Otherwise, select No.',
    sources: [TRIAL],
    statements: [
      { id: 's1', text: 'When the trial ends, workspaces assigned to the trial capacity are reassigned to Pro.', answer: true, explain: 'Yes. Learn: workspaces assigned to the trial capacity are reassigned to Pro, and non-Power BI items become inaccessible until the workspace gets a paid F or P capacity.' },
      { id: 's2', text: 'You can use Copilot in Fabric on the trial capacity.', answer: false, explain: 'No. Copilot isn’t supported on trial capacities.' },
      { id: 's3', text: 'You can store up to 1 TB of data in OneLake during the trial.', answer: true, explain: 'Yes. The trial allows up to 1 TB of OneLake storage.' },
    ],
  },
  {
    id: 'FO-12',
    machineId: 'mill-lease',
    bulletIds: [],
    format: 'order',
    difficulty: 1,
    stem: 'You need to start a Fabric trial from the Account manager and begin building items in it. Put the steps in order.',
    sources: [TRIAL],
    items: [
      { id: 'i1', text: 'Create a workspace and set its workspace type to Trial', explain: 'Last: workspaces must use the Trial type so their items run on the trial capacity.' },
      { id: 'i2', text: 'Select Start trial in the Account manager', explain: 'Second: Start trial is in the Account manager.' },
      { id: 'i3', text: 'Open the Account manager from your profile picture', explain: 'First: the Account manager opens from the photo in the upper-right corner.' },
      { id: 'i4', text: 'Choose the trial capacity region and select Activate', explain: 'Third: you choose the trial capacity region (the default is your home region, which you can keep or change) and select Activate.' },
    ],
    answerOrder: ['i3', 'i2', 'i4', 'i1'],
  },
]
