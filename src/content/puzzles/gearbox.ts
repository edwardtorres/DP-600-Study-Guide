import { gearboxPuzzle, type DeckOption, type GearboxCard } from '../../puzzles/build'
import type { Puzzle } from '../../puzzles/types'

const L = 'https://learn.microsoft.com/en-us/'
const STORAGE = `${L}power-bi/transform-model/desktop-storage-mode`
const DQ = `${L}power-bi/connect-data/desktop-directquery-about`
const COMPOSITE = `${L}power-bi/transform-model/desktop-composite-models`
const DL = `${L}fabric/fundamentals/direct-lake-overview`
const DL_HOW = `${L}fabric/fundamentals/direct-lake-how-it-works`
const STORE = `${L}fabric/fundamentals/decision-guide-data-store`
const LW = `${L}fabric/fundamentals/decision-guide-lakehouse-warehouse`

export const storageOptions: DeckOption[] = [
  { id: 'import', label: 'Import', explain: 'Import stores a snapshot of the data in the model for fast visuals; refresh to get new data.' },
  { id: 'directquery', label: 'DirectQuery', explain: 'DirectQuery keeps no copy: each visual’s DAX is translated into a query against the source.' },
  { id: 'dual', label: 'Dual', explain: 'Dual lets a table act as Import or DirectQuery depending on the query; it keeps relationships with Import tables regular in a composite model.' },
  { id: 'dl-onelake', label: 'Direct Lake on OneLake', explain: 'Direct Lake on OneLake loads Delta tables from one or more Fabric items, never falls back to DirectQuery, and can be mixed with Import tables.' },
  { id: 'dl-sql', label: 'Direct Lake on SQL analytics endpoint', explain: 'Direct Lake on SQL uses a single Fabric source through its SQL analytics endpoint and falls back to DirectQuery for views, SQL-based security, or guardrails.' },
  { id: 'composite', label: 'Composite model', explain: 'A composite model has tables in more than one storage mode (or DirectQuery tables from different sources).' },
]

export const storeOptions: DeckOption[] = [
  { id: 'lakehouse', label: 'Lakehouse', explain: 'A lakehouse suits big data, data engineering, and machine learning on structured, semi-structured, or unstructured data, mainly with Spark.' },
  { id: 'warehouse', label: 'Warehouse', explain: 'A warehouse suits enterprise data warehousing and SQL-based BI with full T-SQL DML/DDL and multi-table transactions.' },
  { id: 'eventhouse', label: 'Eventhouse', explain: 'An eventhouse suits streaming event data and high-granularity, time-based activity data for interactive analytics with KQL.' },
  { id: 'sqldb', label: 'SQL database in Fabric', explain: 'SQL database in Fabric suits operational, transactional (OLTP), normalized databases for applications.' },
]

const S = (id: string, machine: 'loom-gearbox' | 'direct-lake-shuttle' | 'double-loom', difficulty: 1 | 2 | 3, card: Omit<GearboxCard, 'id' | 'machineIds' | 'bulletIds' | 'difficulty'>): GearboxCard => ({
  id,
  machineIds: [machine],
  bulletIds: machine === 'loom-gearbox' ? ['S1.1'] : machine === 'direct-lake-shuttle' ? ['S2.4'] : ['S1.7'],
  difficulty,
  ...card,
})

const storageCards: GearboxCard[] = [
  S('GB-S01', 'loom-gearbox', 1, {
    title: 'Spreadsheets for a self-service analyst',
    scenario: 'A finance analyst combines two Excel workbooks and a CSV export. The data changes weekly, and the analyst wants the fastest possible visuals without waiting on IT.',
    accepted: ['import'],
    why: 'Import stores a snapshot in the model for quick visuals, and Learn notes Import often works well for a self-service analyst who needs to act quickly; a weekly refresh is enough here.',
    notes: { 'dl-onelake': 'Direct Lake needs Delta tables in Fabric; these files aren’t in OneLake.', 'dl-sql': 'Direct Lake needs a Fabric source with Delta tables; these files aren’t in one.' },
    sources: [STORAGE, DL],
    trapPairId: 'storage-modes',
  }),
  S('GB-S02', 'loom-gearbox', 2, {
    title: 'Seconds-old data from an external database',
    scenario: 'Operations needs a report on an on-premises SQL Server whose order table changes every few seconds. Data must never be copied into Power BI, and visuals must reflect the latest data when they load.',
    accepted: ['directquery'],
    why: 'DirectQuery queries the source when visuals load and stores no data in the model. Direct Lake isn’t possible because the data isn’t in Fabric Delta tables.',
    notes: { import: 'Import copies the data into the model and only sees changes after a refresh.' },
    sources: [STORAGE, DQ],
    trapPairId: 'storage-modes',
  }),
  S('GB-S03', 'loom-gearbox', 2, {
    title: 'Security enforced by the source',
    scenario: 'An Azure SQL Database applies its own per-user security rules. The report must show each user only what the database allows, using the database’s rules rather than rebuilding them as model roles.',
    accepted: ['directquery'],
    why: 'DirectQuery can (where supported) pass the user’s identity through SSO, so the source enforces its own security. Import relies on Power BI credentials and RLS defined in the model.',
    sources: [DQ],
  }),
  S('GB-S04', 'loom-gearbox', 1, {
    title: 'Nightly external data, fast visuals',
    scenario: 'A 2 GB sales extract in an Azure SQL Database (outside Fabric) is loaded nightly. Users want visuals to load quickly; next-day data is fine.',
    accepted: ['import'],
    why: 'Import keeps a snapshot in the model for quick visuals, and a scheduled nightly refresh meets the latency need. Direct Lake needs Fabric Delta tables.',
    sources: [STORAGE, DQ],
  }),
  S('GB-S05', 'direct-lake-shuttle', 2, {
    title: 'New model over large lakehouse tables',
    scenario: 'IT is building a new semantic model over very large Delta tables in a lakehouse and a warehouse in Fabric. Replicating the data with Import is impractical, and the team wants the option Learn recommends for new Direct Lake models.',
    accepted: ['dl-onelake'],
    why: 'Direct Lake on OneLake can use one or more Fabric sources with Delta tables, and Learn recommends it for new semantic models. Direct Lake on SQL is limited to a single source.',
    notes: { 'dl-sql': 'Direct Lake on SQL uses a single Fabric source, so it can’t combine the lakehouse and the warehouse.' },
    sources: [DL, DL_HOW],
    trapPairId: 'dl-onelake-vs-sql',
  }),
  S('GB-S06', 'direct-lake-shuttle', 3, {
    title: 'A SQL view as a model table',
    scenario: 'A warehouse exposes a non-materialized SQL view that must appear as a model table, alongside Direct Lake tables from the same warehouse. The team accepts slower queries for that one table.',
    accepted: ['dl-sql'],
    why: 'Direct Lake on SQL analytics endpoints can use SQL views by falling back to DirectQuery. Creating a Direct Lake on OneLake table from a non-materialized SQL view isn’t supported.',
    notes: { 'dl-onelake': 'Learn: it isn’t supported to create a Direct Lake on OneLake table based on a non-materialized SQL view.' },
    sources: [DL, STORAGE],
    trapPairId: 'dl-onelake-vs-sql',
  }),
  S('GB-S07', 'direct-lake-shuttle', 3, {
    title: 'Keep answering when a table grows too big',
    scenario: 'A fast-growing Delta table may cross a capacity guardrail before the team can optimize it. The business would rather have slower reports than reports that stop working.',
    accepted: ['dl-sql'],
    why: 'When a guardrail is exceeded, Direct Lake on SQL falls back to DirectQuery (if fallback is enabled) and queries still return results. Direct Lake on OneLake behaves like Import: refresh fails and the model can’t be queried until the tables are optimized.',
    sources: [DL],
    trapPairId: 'dl-fallback',
  }),
  S('GB-S08', 'direct-lake-shuttle', 2, {
    title: 'Respect the warehouse’s SQL row-level security',
    scenario: 'A warehouse already defines row-level security in T-SQL. The model should stay in Direct Lake where possible, but report users must be filtered by that SQL security.',
    accepted: ['dl-sql'],
    why: 'With SQL row-level security at the endpoint, Direct Lake on SQL falls back to DirectQuery, so the SQL rules apply. Direct Lake on OneLake queries succeed without applying SQL-based RLS.',
    notes: { 'dl-onelake': 'Learn: with Direct Lake on OneLake, queries succeed and SQL-based RLS isn’t applied.' },
    sources: [DL, DL_HOW],
    trapPairId: 'dl-onelake-vs-sql',
  }),
  S('GB-S09', 'double-loom', 2, {
    title: 'Lakehouse tables plus an Excel budget',
    scenario: 'A model reads large lakehouse Delta tables with Direct Lake and also needs a small budget table from an Excel file, imported.',
    accepted: ['dl-onelake', 'composite'],
    why: 'Direct Lake on OneLake models can have Import tables from other sources added, and a model with tables in more than one storage mode is, by definition, a composite model. Either name describes the design.',
    notes: { 'dl-sql': 'Direct Lake on SQL is single source only and can’t be part of a composite model.' },
    sources: [DL, COMPOSITE],
  }),
  S('GB-S10', 'double-loom', 2, {
    title: 'Dimension shared by Import and DirectQuery facts',
    scenario: 'In a composite model, a Date table relates to an Import aggregation table and to a very large DirectQuery fact table from the same source. Which storage mode should Date use so neither relationship is limited?',
    accepted: ['dual'],
    why: 'Relationships between DirectQuery and Import tables are limited. When Import and DirectQuery tables come from the same source, Dual storage mode keeps those relationships regular.',
    sources: [STORAGE, COMPOSITE],
    trapPairId: 'dual-vs-hybrid',
  }),
  S('GB-S11', 'double-loom', 2, {
    title: 'Add a local table to a published model',
    scenario: 'A report author needs one extra Excel mapping table next to a certified semantic model owned by another team, for a single report, without changing the shared model.',
    accepted: ['composite'],
    why: 'Connecting to a published semantic model with DirectQuery and adding a local Import table makes a composite model, the pattern Learn describes for a small change to an existing model for one report.',
    sources: [STORAGE, COMPOSITE],
  }),
  S('GB-S12', 'loom-gearbox', 2, {
    title: 'Fabric data without the SQL endpoint',
    scenario: 'A model must read Delta tables from a lakehouse without depending on its SQL analytics endpoint, and must never fall back to DirectQuery.',
    accepted: ['dl-onelake'],
    why: 'Direct Lake on OneLake isn’t coupled with the SQL analytics endpoint and doesn’t support DirectQuery fallback; it runs only in Direct Lake mode.',
    sources: [DL_HOW, DL],
    trapPairId: 'dl-onelake-vs-sql',
  }),
  S('GB-S13', 'loom-gearbox', 3, {
    title: 'Too large to import, outside Fabric',
    scenario: 'A 3 TB fact table lives in an external cloud database. A full import would exceed memory and refresh windows, and the data can’t be moved into Fabric.',
    accepted: ['directquery'],
    why: 'When a full import might exceed memory or refresh windows, DirectQuery queries the data in place. Direct Lake would require the data as Delta tables in Fabric.',
    sources: [DQ],
  }),
]

const D = (id: string, difficulty: 1 | 2 | 3, card: Omit<GearboxCard, 'id' | 'machineIds' | 'bulletIds' | 'difficulty'>): GearboxCard => ({
  id,
  machineIds: ['vat-selector'],
  bulletIds: ['P1.4'],
  difficulty,
  ...card,
})

const storeCards: GearboxCard[] = [
  D('GB-D01', 1, {
    title: 'Spark engineers with JSON and images',
    scenario: 'Data engineers who work in PySpark notebooks must store semi-structured JSON and image files alongside tables to train machine learning models.',
    accepted: ['lakehouse'],
    why: 'A lakehouse is for big data and machine learning on unstructured, semi-structured, or structured data, and its primary skill set is PySpark, Delta Lake, and notebooks.',
    sources: [STORE, LW],
    trapPairId: 'stores',
  }),
  D('GB-D02', 2, {
    title: 'Multi-table transactions in T-SQL',
    scenario: 'SQL developers load several related tables in one T-SQL transaction, with INSERT, UPDATE, and DELETE, and need it to commit or roll back as a whole.',
    accepted: ['warehouse'],
    why: 'A warehouse provides ACID-compliant data warehousing with multi-table transaction support in T-SQL and full DML/DDL.',
    notes: { lakehouse: 'A lakehouse’s SQL analytics endpoint is read-only for T-SQL; writes go through Spark, pipelines, or dataflows.' },
    sources: [LW, STORE],
    trapPairId: 'stores',
  }),
  D('GB-D03', 1, {
    title: 'Streaming telemetry, queried in KQL',
    scenario: 'Thousands of devices stream high-granularity telemetry. Analysts explore it interactively by time with KQL.',
    accepted: ['eventhouse'],
    why: 'An eventhouse is for streaming event data and high-granularity activity data for interactive analytics; its primary language is KQL.',
    sources: [STORE],
    trapPairId: 'stores',
  }),
  D('GB-D04', 2, {
    title: 'An application’s operational database',
    scenario: 'A .NET order-entry app needs high concurrency, full ACID transactions, enforced foreign keys, and automatic performance tuning.',
    accepted: ['sqldb'],
    why: 'SQL database in Fabric is for operational, transactional (OLTP) workloads, with the SQL Database Engine, transaction isolation levels, and automatic index management.',
    notes: { warehouse: 'A warehouse targets analytics (SQL-based BI, OLAP), not an application’s OLTP workload.' },
    sources: [STORE],
    trapPairId: 'warehouse-vs-sql-database',
  }),
  D('GB-D05', 2, {
    title: 'Mixed skills, read-only SQL consumers',
    scenario: 'A team stores several terabytes. Engineers transform data in notebooks; most T-SQL users only read the data and never write INSERT, UPDATE, or DELETE.',
    accepted: ['lakehouse'],
    why: 'This is Learn’s own example: a lakehouse lets data engineers use Spark while T-SQL consumers query the read-only SQL analytics endpoint.',
    sources: [STORE, LW],
  }),
  D('GB-D06', 1, {
    title: 'Enterprise star schema with stored procedures',
    scenario: 'A data warehouse team builds a star schema loaded by T-SQL stored procedures and serves SQL-based BI.',
    accepted: ['warehouse'],
    why: 'Fabric Data Warehouse is for enterprise data warehousing, SQL-based BI, and full SQL support, with views, functions, and stored procedures.',
    sources: [STORE, LW],
  }),
  D('GB-D07', 2, {
    title: 'Billions of supply-chain events with time-series and geospatial analysis',
    scenario: 'A retailer analyzes billions of rows from plants and shippers, needs time-series and geospatial functions, and wants fast DirectQuery reports in Power BI.',
    accepted: ['eventhouse'],
    why: 'This matches Learn’s scenario for an eventhouse: scalable, quick to respond, with time-series and geospatial analysis and a fast direct query mode in Power BI.',
    sources: [STORE],
  }),
  D('GB-D08', 1, {
    title: 'Unstructured files next to tables',
    scenario: 'Scanned PDFs and audio files must be kept in the same store as curated Delta tables, and nobody is sure yet how the files will be used.',
    accepted: ['lakehouse'],
    why: 'For unstructured and structured data, or when you’re not sure, Learn’s decision guide says use a lakehouse.',
    sources: [LW],
  }),
  D('GB-D09', 2, {
    title: 'Vectors in a relational app',
    scenario: 'An app team develops AI features that store vector data types next to normalized relational tables, using T-SQL.',
    accepted: ['sqldb'],
    why: 'To develop AI with vector data types, the decision guide lists SQL database in Fabric (or Cosmos DB in Fabric, which isn’t in this deck).',
    sources: [STORE],
  }),
  D('GB-D10', 2, {
    title: 'Moving a SQL Server warehouse',
    scenario: 'A developer with years of SQL Server warehouse experience wants to reuse existing T-SQL, use SSMS, and query other warehouses with three-part names.',
    accepted: ['warehouse'],
    why: 'This is Learn’s Susan scenario: existing T-SQL works in Fabric Data Warehouse, SSMS works, and cross-database queries use three-part names.',
    sources: [STORE],
  }),
  D('GB-D11', 3, {
    title: 'Keep analytics off the operational database',
    scenario: 'An operational SQL database serves an app. Analysts want Spark and Power BI access without loading the operational engine, and without denormalizing.',
    accepted: ['sqldb'],
    why: 'In Learn’s Kirby scenario, SQL database in Fabric serves the app, and its SQL analytics endpoint gives Spark and Power BI access without the overhead of analytics on the primary database.',
    sources: [STORE],
    trapPairId: 'warehouse-vs-sql-database',
  }),
  D('GB-D12', 2, {
    title: 'Data scientists training in Scala and R',
    scenario: 'Data scientists train models on Delta tables with Spark in Scala and R.',
    accepted: ['lakehouse'],
    why: 'A lakehouse’s primary languages are Spark (Scala, PySpark, Spark SQL, R), and it targets data science and machine learning.',
    sources: [STORE, LW],
  }),
  D('GB-D13', 3, {
    title: 'High-granularity logs, KQL and T-SQL',
    scenario: 'App developers store JSON activity logs for interactive analysis. They prefer KQL but also want to run some T-SQL against the same data.',
    accepted: ['eventhouse'],
    why: 'An eventhouse is for high-granularity activity data such as JSON logs; its primary languages are KQL and T-SQL.',
    sources: [STORE],
  }),
]

export const gearboxPuzzles: Puzzle[] = [
  ...storageCards.map((c) => gearboxPuzzle('Storage mode', storageOptions, c)),
  ...storeCards.map((c) => gearboxPuzzle('Data store', storeOptions, c)),
]

export const gearboxDeck = (id: string): 'storage' | 'store' => (id.startsWith('GB-S') ? 'storage' : 'store')
