import type { MachineNotes } from '../types'

const L = 'https://learn.microsoft.com/en-us/'
const TERMS = `${L}fabric/fundamentals/fabric-terminology`
const CONNECTORS = `${L}fabric/data-factory/connector-overview`
const CONNECTIONS = `${L}fabric/data-factory/data-source-management`
const DATA_FACTORY = `${L}fabric/data-factory/data-factory-overview`
const GATEWAY = `${L}fabric/data-factory/how-to-access-on-premises-data`
const MOVEMENT = `${L}fabric/data-factory/decision-guide-data-movement`
const LOAD_LAKEHOUSE = `${L}fabric/data-engineering/load-data-lakehouse`
const NOTEBOOK_LOAD = `${L}fabric/data-engineering/lakehouse-notebook-load-data`
const SHORTCUTS = `${L}fabric/onelake/onelake-shortcuts`
const MIRRORING = `${L}fabric/mirroring/overview`
const INGEST_WAREHOUSE = `${L}fabric/data-warehouse/ingest-data`
const COPY_INTO = `${L}fabric/data-warehouse/ingest-data-copy`
const DATAFLOW_GEN2 = `${L}fabric/data-factory/dataflows-gen2-overview`
const CATALOG = `${L}fabric/governance/onelake-catalog-overview`
const CATALOG_EXPLORE = `${L}fabric/governance/onelake-catalog-explore`
const RT_HUB = `${L}fabric/real-time-hub/real-time-hub-overview`
const FABRIC_OVERVIEW = `${L}fabric/fundamentals/microsoft-fabric-overview`
const ONELAKE = `${L}fabric/onelake/onelake-overview`
const DECIDE_LH_WH = `${L}fabric/fundamentals/decision-guide-lakehouse-warehouse`
const DECIDE_STORE = `${L}fabric/fundamentals/decision-guide-data-store`
const EVENTHOUSE_ONELAKE = `${L}fabric/real-time-intelligence/event-house-onelake-availability`
const MODEL_ONELAKE = `${L}fabric/enterprise/powerbi/onelake-integration-overview`
const DIM_OVERVIEW = `${L}fabric/data-warehouse/dimensional-modeling-overview`
const DIM_TABLES = `${L}fabric/data-warehouse/dimensional-modeling-dimension-tables`
const FACT_TABLES = `${L}fabric/data-warehouse/dimensional-modeling-fact-tables`
const LOAD_TABLES = `${L}fabric/data-warehouse/dimensional-modeling-load-tables`
const TSQL_SURFACE = `${L}fabric/data-warehouse/tsql-surface-area`
const DATA_TYPES = `${L}fabric/data-warehouse/data-types`
const ENDPOINT = `${L}fabric/data-engineering/lakehouse-sql-analytics-endpoint`
const WAREHOUSE = `${L}fabric/data-warehouse/data-warehousing`
const VISUAL_QUERY = `${L}fabric/data-warehouse/visual-query-editor`
const QUERY_WAREHOUSE = `${L}fabric/data-warehouse/query-warehouse`
const LAKEHOUSE_PREP = `${L}fabric/data-engineering/tutorial-lakehouse-data-preparation`
const DATA_WRANGLER = `${L}fabric/data-science/data-wrangler`
const LAKEHOUSE = `${L}fabric/data-engineering/lakehouse-overview`
const QUALIFY = `${L}sql/t-sql/queries/select-qualify-clause-transact-sql?view=fabric`
const TRY_CAST = `${L}sql/t-sql/functions/try-cast-transact-sql?view=fabric`
const COALESCE = `${L}sql/t-sql/language-elements/coalesce-transact-sql?view=fabric`
const CREATE_VIEW = `${L}sql/t-sql/statements/create-view-transact-sql?view=fabric`
const CREATE_PROC = `${L}sql/t-sql/statements/create-procedure-transact-sql?view=fabric`
const MERGE = `${L}sql/t-sql/statements/merge-transact-sql?view=fabric`
const KQL_OPERATORS = `${L}kusto/query/tutorials/learn-common-operators?view=microsoft-fabric`
const KQL_SUMMARIZE = `${L}kusto/query/summarize-operator?view=microsoft-fabric`
const KQL_QUERYSET = `${L}fabric/real-time-intelligence/kusto-query-set`
const KQL_JOIN = `${L}kusto/query/join-operator?view=microsoft-fabric`
const KQL_JOIN_TUTORIAL = `${L}kusto/query/tutorials/join-data-from-multiple-tables?view=microsoft-fabric`
const KQL_TAKE = `${L}kusto/query/take-operator?view=microsoft-fabric`
const KQL_TOP = `${L}kusto/query/top-operator?view=microsoft-fabric`
const KQL_SORT = `${L}kusto/query/sort-operator?view=microsoft-fabric`
const KQL_WHERE = `${L}kusto/query/where-operator?view=microsoft-fabric`
const KQL_PROJECT = `${L}kusto/query/project-operator?view=microsoft-fabric`
const KQL_EXTEND = `${L}kusto/query/extend-operator?view=microsoft-fabric`
const KQL_BIN = `${L}kusto/query/bin-function?view=microsoft-fabric`
const SQL_TO_KQL = `${L}kusto/query/sql-cheat-sheet?view=microsoft-fabric`
const DAX_QUERIES = `${L}dax/dax-queries`
const DAX_QUERY_VIEW = `${L}power-bi/transform-model/dax-query-view`

export const prepareNotes: MachineNotes[] = [
  // ── Thread Intake ────────────────────────────────────────────────────
  {
    machineId: 'thread-intake',
    pl300Adds: [
      {
        text: 'In PL-300 you connected Power BI Desktop to a source and loaded it into a model. In DP-600 the destination is a Fabric store (lakehouse, warehouse, eventhouse), and you choose the tool that moves the data: Dataflow Gen2, a pipeline Copy activity, a Copy job, a notebook, mirroring, a shortcut, or T-SQL COPY INTO.',
        sources: [DATA_FACTORY, LOAD_LAKEHOUSE, INGEST_WAREHOUSE],
      },
      {
        text: 'New for DP-600: "access" without copying. Shortcuts and mirroring make data available in OneLake without you building an ETL process, and the exam asks when to use each instead of copying.',
        sources: [ONELAKE, MOVEMENT],
      },
    ],
    overview: [
      {
        text: 'Every analytics solution starts by connecting to source data and getting it into OneLake, or pointing OneLake at it. Fabric gives you several ways to do this, from no-code to full code. The exam tests whether you pick the right one for the source, the volume, the latency, and the team’s skills.',
        sources: [LOAD_LAKEHOUSE, MOVEMENT],
      },
      {
        text: 'Data Factory in Fabric provides the connectors (Learn cites more than 170 sources, including on-premises sources through a gateway) and the movement tools: Copy job, the Copy activity in pipelines, and mirroring. It also provides transformation tools: Dataflow Gen2 and pipeline activities such as notebooks and stored procedures.',
        sources: [DATA_FACTORY],
      },
    ],
    bullets: [
      {
        bulletId: 'P1.1',
        tools: ['dataflow-gen2', 'pipeline', 'admin-portal'],
        concepts: [
          {
            text: 'A connector is the built-in adapter for a data store. Fabric lists which connectors work as a source or destination in Dataflow Gen2, pipelines (Copy activity), and Copy job.',
            sources: [CONNECTORS],
          },
          {
            text: 'A connection is the saved, reusable definition of how to reach one data source: server, database, authentication method, and an optional privacy level. Connections are managed centrally under Settings > Manage connections and gateways.',
            sources: [CONNECTIONS],
          },
          {
            text: 'For data behind a firewall or on-premises, you install an on-premises data gateway, and Fabric reaches the source through it.',
            sources: [GATEWAY],
          },
        ],
        howTo: [
          {
            text: 'Create a cloud connection: Settings > Manage connections and gateways > New > Cloud, then pick the connection type, fill in the source details, and choose an authentication method (for example Basic, OAuth2, or Service Principal).',
            sources: [CONNECTIONS],
          },
          {
            text: 'Learn notes that these cloud connections currently work with pipelines and Kusto. For semantic models and dataflows, you create connections through Power Query Online’s Get data experience.',
            sources: [CONNECTIONS],
          },
          {
            text: 'Removing a connection breaks every item that depends on it, so check dependents first.',
            sources: [CONNECTIONS],
          },
        ],
      },
      {
        bulletId: 'P1.3',
        tools: ['lakehouse', 'warehouse', 'pipeline', 'dataflow-gen2', 'notebook', 'onelake'],
        concepts: [
          {
            text: 'Ingest means copying data into Fabric. Access means referencing data where it already lives (shortcuts) or having Fabric keep a managed replica for you (mirroring).',
            sources: [ONELAKE, LOAD_LAKEHOUSE],
          },
          {
            text: 'Ways into a lakehouse, from simplest to most flexible: upload files, shortcuts, Dataflow Gen2, pipelines (Copy activity), notebook code, and Eventstream for real-time events.',
            sources: [LOAD_LAKEHOUSE],
          },
          {
            text: 'Ways into a warehouse: the T-SQL COPY statement (highest throughput, from Azure storage or OneLake), pipelines, dataflows, and T-SQL INSERT...SELECT, SELECT INTO, or CREATE TABLE AS SELECT from other items in the same workspace.',
            sources: [INGEST_WAREHOUSE],
          },
          {
            text: 'A shortcut is a pointer, like a symbolic link. Deleting the shortcut doesn’t touch the target, but moving or deleting the target breaks the shortcut. Shortcuts can be created in lakehouses and KQL databases.',
            sources: [SHORTCUTS],
          },
          {
            text: 'Mirroring continuously replicates an operational database into OneLake as Delta tables and creates a SQL analytics endpoint over them. Learn’s data movement guide calls the mirrored destination read-only.',
            sources: [MIRRORING, MOVEMENT],
          },
        ],
        howTo: [
          {
            text: 'Learn’s data movement guide recommends: mirroring when you mainly need curated data replicated for reporting; Copy job for raw (bronze) ingestion with incremental loads; Eventstreams for real-time data; and pipelines when you need complex orchestration.',
            sources: [MOVEMENT],
          },
          {
            text: 'In a notebook, read the source into a DataFrame and write it to the lakehouse. Writing in Delta format with saveAsTable creates a table in the Tables section; writing CSV or Parquet to a Files path stores plain files.',
            sources: [NOTEBOOK_LOAD],
          },
          {
            text: 'In a lakehouse, shortcuts in the Tables folder can only be created at the top level, and a Delta target is recognized as a table automatically. Shortcuts in the Files folder can go anywhere and point at any format.',
            sources: [SHORTCUTS],
          },
          {
            text: 'In a warehouse, create the destination table first, then run COPY INTO with the source path and FILE_TYPE.',
            sources: [COPY_INTO],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Load a Parquet file into a lakehouse table from a notebook',
        language: 'pyspark',
        illustrative: true,
        steps: [
          {
            code: 'df = spark.read.parquet("Files/raw/sales.parquet")',
            explain: 'Read the source file from the default lakehouse’s Files area into a Spark DataFrame, using a relative path.',
          },
          {
            code: 'df.write.mode("overwrite").format("delta").saveAsTable("sales")',
            explain: 'Write the DataFrame as a Delta table named sales in the Tables section, replacing any existing data.',
          },
          {
            code: 'df.write.mode("append").format("delta").saveAsTable("sales")',
            explain: 'For later loads, append mode adds new rows to the existing Delta table instead of replacing it.',
          },
        ],
        sources: [NOTEBOOK_LOAD],
      },
      {
        title: 'Bulk-load a warehouse table with COPY INTO',
        language: 'tsql',
        illustrative: true,
        steps: [
          {
            code: 'CREATE TABLE dbo.Trips (TripId int NULL, FareAmount float NULL, PickupTime datetime2(6) NULL);',
            explain: 'COPY needs an existing destination table, so create it first with warehouse-supported data types.',
          },
          {
            code: "COPY INTO dbo.Trips\nFROM 'https://<storage-account>.blob.core.windows.net/<container>/trips/'\nWITH (FILE_TYPE = 'PARQUET');",
            explain: 'Load all Parquet files from the storage location into the table. FILE_TYPE tells COPY how to parse the files.',
          },
          {
            code: 'SELECT COUNT_BIG(*) FROM dbo.Trips;',
            explain: 'Count the rows to confirm the load worked.',
          },
        ],
        sources: [COPY_INTO, INGEST_WAREHOUSE],
      },
    ],
    traps: [
      {
        text: 'External Delta tables written with Spark outside the lakehouse’s Tables area aren’t visible to the SQL analytics endpoint. Use a shortcut in the Tables section to expose them.',
        sources: [LOAD_LAKEHOUSE],
      },
      {
        text: 'Shortcut names that contain spaces aren’t recognized as Delta tables in the lakehouse.',
        sources: [SHORTCUTS],
      },
      {
        text: 'COPY INTO is the recommended T-SQL ingestion statement. BULK INSERT exists for compatibility with existing SQL Server code and maps to COPY behavior.',
        sources: [COPY_INTO, INGEST_WAREHOUSE],
      },
      {
        text: 'T-SQL cross-item ingestion (INSERT...SELECT, CTAS) reads tables only from the same workspace. OPENROWSET reads files in Azure storage.',
        sources: [INGEST_WAREHOUSE],
      },
      {
        text: 'A privacy level set on a connection doesn’t affect DirectQuery connections.',
        sources: [CONNECTIONS],
      },
    ],
    dontConfuse: [
      {
        pairId: 'shortcut-mirror-copy',
        a: 'Shortcut vs mirroring',
        b: 'Copy (Copy job, Copy activity, COPY INTO)',
        difference: [
          {
            text: 'Shortcut: no copy. A live reference to data in another location (OneLake, ADLS, S3, and more). Changes at the source show up immediately.',
            sources: [ONELAKE, SHORTCUTS],
          },
          {
            text: 'Mirroring: Fabric manages continuous replication of a database into OneLake as read-only Delta tables. There is no pipeline to build.',
            sources: [MIRRORING, MOVEMENT],
          },
          {
            text: 'Copy: you control a physical copy. Copy job (bulk, incremental, CDC), Copy activity (fully customizable, orchestrated in a pipeline), and COPY INTO (T-SQL into a warehouse).',
            sources: [MOVEMENT, COPY_INTO],
          },
        ],
      },
      {
        pairId: 'dataflow-pipeline-notebook',
        a: 'Dataflow Gen2 vs pipeline',
        b: 'Notebook',
        difference: [
          {
            text: 'Dataflow Gen2 is low-code Power Query with 300+ transformations, suited to small and medium data with visual transforms. A pipeline orchestrates activities (copy, notebook, stored procedure, scripts) with schedules, triggers, and control flow. A notebook is code (Spark) and the most flexible option for complex logic.',
            sources: [DATAFLOW_GEN2, DATA_FACTORY, LOAD_LAKEHOUSE],
          },
        ],
      },
    ],
    renamed: [
      {
        oldName: 'Power BI dataflow',
        newName: 'Dataflow Gen1',
        examLikely: 'The study guide only says "dataflows". Expect Dataflow Gen2 in Fabric scenarios.',
        note: 'Learn calls the original Power BI dataflow "Gen1" and recommends Dataflow Gen2 for new work. You can’t upgrade Gen1 to Gen2.',
        sources: [DATAFLOW_GEN2, TERMS],
      },
    ],
    preview: [
      {
        feature: 'BCP API for warehouse ingestion',
        note: 'Client-side bulk ingestion (bcp.exe, SqlBulkCopy) into a warehouse without staging files.',
        sources: [INGEST_WAREHOUSE],
      },
    ],
    upcoming: [],
    glossary: [
      {
        term: 'Connector',
        definition: 'A built-in adapter that lets Dataflow Gen2, pipelines, and Copy job read from or write to a specific data store.',
        sources: [CONNECTORS],
      },
      {
        term: 'Connection',
        definition: 'A saved definition of how to reach one data source (location plus authentication), managed in Manage connections and gateways and reused by items.',
        sources: [CONNECTIONS],
      },
      {
        term: 'On-premises data gateway',
        definition: 'Software you install near an on-premises source so Fabric can reach that data securely from the cloud.',
        sources: [GATEWAY],
      },
      {
        term: 'Shortcut',
        definition: 'An object in OneLake that points to data in another location (inside or outside OneLake) without copying it. It appears as a folder and behaves like a symbolic link.',
        sources: [SHORTCUTS, TERMS],
      },
      {
        term: 'Mirroring',
        definition: 'Continuous, managed replication of an external database or catalog into OneLake, exposed as Delta tables with a SQL analytics endpoint.',
        sources: [MIRRORING, TERMS],
      },
      {
        term: 'Copy job',
        definition: 'A Data Factory item for data movement without building a pipeline. It supports bulk copy, incremental copy, and change data capture replication.',
        sources: [DATA_FACTORY, MOVEMENT],
      },
      {
        term: 'Copy activity',
        definition: 'A pipeline activity that copies data between supported sources and destinations, with extensive customization.',
        sources: [DATA_FACTORY, MOVEMENT],
      },
      {
        term: 'Pipeline',
        definition: 'A Data Factory item that orchestrates data movement and transformation activities, with schedules, triggers, and control flow. Not the same as a deployment pipeline.',
        sources: [TERMS, DATA_FACTORY],
      },
      {
        term: 'Dataflow Gen2',
        definition: 'A low-code Power Query-based item for ingesting and transforming data and loading it to destinations such as a lakehouse or warehouse.',
        sources: [DATAFLOW_GEN2, TERMS],
      },
      {
        term: 'Notebook',
        definition: 'An interactive code item (Spark: Python, Scala, Spark SQL, R) used to read, transform, and write lakehouse data.',
        sources: [LAKEHOUSE],
      },
      {
        term: 'COPY INTO',
        definition: 'The T-SQL statement for high-throughput ingestion of CSV, JSONL, or Parquet files from Azure storage or OneLake into a warehouse table.',
        sources: [COPY_INTO, INGEST_WAREHOUSE],
      },
      {
        term: 'Eventstream',
        definition: 'A no-code item that captures, transforms, and routes real-time events to destinations such as an eventhouse or lakehouse.',
        sources: [TERMS, MOVEMENT],
      },
      {
        term: 'ABFS path',
        definition: 'The absolute Azure Blob File System path to a file or folder in OneLake. You use it to read data from a lakehouse other than the notebook’s default one.',
        sources: [NOTEBOOK_LOAD],
      },
    ],
    needsVerification: [],
  },

  // ── Bale Catalog ─────────────────────────────────────────────────────
  {
    machineId: 'bale-catalog',
    overview: [
      {
        text: 'Before you build anything, find out what data already exists. Fabric has two discovery hubs: the OneLake catalog for data items (lakehouses, warehouses, semantic models, and more) and the Real-Time hub for streaming data and events.',
        sources: [CATALOG, RT_HUB],
      },
      {
        text: 'Discovering existing items avoids building duplicate pipelines and copies. It also shows ownership, endorsement, sensitivity, and lineage before you depend on an item.',
        sources: [CATALOG_EXPLORE, ONELAKE],
      },
    ],
    bullets: [
      {
        bulletId: 'P1.2',
        tools: ['onelake', 'eventhouse', 'other'],
        concepts: [
          {
            text: 'The OneLake catalog has three tabs. Explore finds and inspects items. Govern shows governance insights and recommended actions for data you own. Secure shows workspace roles and OneLake security roles in one place.',
            sources: [CATALOG],
          },
          {
            text: 'Explore lists every item you have access to (or can request access to). You can filter by domain, workspace, item type, endorsement, and more, and each item shows metadata such as owner, description, schema, lineage, and usage.',
            sources: [CATALOG_EXPLORE, ONELAKE],
          },
          {
            text: 'The Real-Time hub is the single, tenant-wide place for streaming data. It lists data streams and KQL tables you can access, and offers connectors for sources such as Azure Event Hubs, IoT Hub, Kafka, database CDC feeds, and Fabric and Azure events.',
            sources: [RT_HUB, FABRIC_OVERVIEW],
          },
        ],
        howTo: [
          {
            text: 'Open the OneLake catalog from the Fabric navigation pane. It opens on Explore by default. Narrow the list with filters, select an item to see its details without losing the list, and use the item’s options menu to act on it.',
            sources: [CATALOG_EXPLORE, CATALOG],
          },
          {
            text: 'The catalog is also embedded in Teams, Excel, and Copilot Studio, and there is a Catalog Search REST API for programmatic discovery.',
            sources: [CATALOG],
          },
          {
            text: 'In the Real-Time hub, connect a source to create a stream. Process it in the parent eventstream (filter, aggregate, group by, union), analyze it by routing it to a KQL database table, or act on it by setting alerts.',
            sources: [RT_HUB],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'The OneLake catalog shows items you can access or request access to. It doesn’t grant access by itself.',
        sources: [CATALOG_EXPLORE],
      },
      {
        text: 'Administrative tasks such as capacity and workspace management are moving from the Admin portal into the catalog’s Govern tab, so a question may describe admin settings "in the OneLake catalog".',
        sources: [CATALOG],
      },
      {
        text: 'Every tenant gets a Real-Time hub automatically. There is nothing to provision.',
        sources: [RT_HUB],
      },
    ],
    dontConfuse: [
      {
        pairId: 'catalog-vs-rthub',
        a: 'OneLake catalog',
        b: 'Real-Time hub',
        difference: [
          {
            text: 'The OneLake catalog is for discovering and governing Fabric items: data at rest, such as lakehouses, warehouses, and semantic models. The Real-Time hub is for discovering and ingesting data in motion: streams, KQL tables, and Fabric or Azure events.',
            sources: [CATALOG, RT_HUB],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'OneLake catalog',
        definition: 'The central Fabric experience for discovering, governing, and securing items, with Explore, Govern, and Secure tabs.',
        sources: [CATALOG],
      },
      {
        term: 'Real-Time hub',
        definition: 'A tenant-wide, automatically provisioned place to discover, ingest, process, and act on streaming data and events.',
        sources: [RT_HUB],
      },
    ],
    needsVerification: [
      {
        claim: '"OneLake data hub" was renamed to "OneLake catalog".',
        why: 'The old Learn URL (fabric/get-started/onelake-data-hub) now redirects to the OneLake catalog overview, but no current Learn page states the rename in words.',
      },
    ],
  },

  // ── Vat Selector ─────────────────────────────────────────────────────
  {
    machineId: 'vat-selector',
    overview: [
      {
        text: 'Choosing the right data store is a design decision the exam tests through scenarios. Learn frames it as a few questions: How does the team develop (Spark or T-SQL)? Do you need multi-table transactions? Is the data structured only, or also semi-structured and unstructured? Is it streaming events?',
        sources: [DECIDE_LH_WH, DECIDE_STORE],
      },
    ],
    bullets: [
      {
        bulletId: 'P1.4',
        tools: ['lakehouse', 'warehouse', 'eventhouse', 'sql-analytics-endpoint'],
        concepts: [
          {
            text: 'Lakehouse: Spark-first, structured and unstructured data, no multi-table transactions, with a read-only SQL analytics endpoint for T-SQL readers.',
            sources: [DECIDE_LH_WH],
          },
          {
            text: 'Warehouse: T-SQL-first, structured data, full multi-table ACID transactions, with views, functions, and stored procedures.',
            sources: [DECIDE_LH_WH],
          },
          {
            text: 'Eventhouse: streaming event data and high-granularity interactive analytics with KQL.',
            sources: [DECIDE_STORE],
          },
          {
            text: 'Fabric has other stores too: SQL database in Fabric for operational (OLTP) workloads, and Cosmos DB in Fabric for NoSQL.',
            sources: [DECIDE_STORE],
          },
        ],
        howTo: [
          {
            text: 'Apply the decision points in order. Spark developers → lakehouse; T-SQL developers → warehouse. Multi-table transactions needed → warehouse. Unstructured or mixed data → lakehouse. Streaming events → eventhouse.',
            sources: [DECIDE_LH_WH, DECIDE_STORE],
          },
          {
            text: 'You can mix stores in one workspace, for example landing and transforming in a lakehouse with Spark and then serving curated tables from a warehouse. A warehouse can query lakehouse tables with three-part names.',
            sources: [LAKEHOUSE, DECIDE_STORE],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'A team that mostly reads with T-SQL doesn’t automatically need a warehouse. Learn’s scenario picks a lakehouse when the developers use PySpark and the T-SQL users only consume data through the SQL analytics endpoint.',
        sources: [DECIDE_STORE],
      },
      {
        text: 'Both lakehouse and warehouse store Delta tables in OneLake and share the same SQL engine. The choice is about how you write and what transactions you need, not where the data lives.',
        sources: [DECIDE_LH_WH],
      },
    ],
    dontConfuse: [
      {
        pairId: 'warehouse-vs-sql-database',
        a: 'Warehouse',
        b: 'SQL database in Fabric',
        difference: [
          {
            text: 'A warehouse is for analytics: enterprise data warehousing, SQL-based BI, OLAP. SQL database in Fabric is for operational, transactional (OLTP), normalized workloads, and it also exposes a SQL analytics endpoint for analytics.',
            sources: [DECIDE_STORE],
          },
        ],
      },
    ],
    renamed: [],
    preview: [
      {
        feature: 'AI functions in Fabric Data Warehouse',
        note: 'Listed in the data store decision guide as "AI functions (preview)".',
        sources: [DECIDE_STORE, TSQL_SURFACE],
      },
    ],
    upcoming: [],
    glossary: [
      {
        term: 'SQL database in Fabric',
        definition: 'A transactional (OLTP) database in Fabric that uses the same SQL Database Engine as Azure SQL Database.',
        sources: [DECIDE_STORE],
      },
      {
        term: 'Multi-table transaction',
        definition: 'A transaction that changes several tables atomically. The warehouse supports them; the lakehouse doesn’t.',
        sources: [DECIDE_LH_WH],
      },
    ],
    needsVerification: [],
  },

  // ── Shared Spool ─────────────────────────────────────────────────────
  {
    machineId: 'shared-spool',
    overview: [
      {
        text: 'OneLake integration makes data that lives in an engine-specific format also available as Delta tables in OneLake, so other engines can use one copy. The outline names two cases: eventhouse (KQL database) data and semantic model (import) data.',
        sources: [EVENTHOUSE_ONELAKE, MODEL_ONELAKE],
      },
    ],
    bullets: [
      {
        bulletId: 'P1.5',
        tools: ['eventhouse', 'semantic-model', 'onelake', 'lakehouse'],
        concepts: [
          {
            text: 'Eventhouse OneLake availability creates a logical copy of KQL database data in Delta format. Other engines (Power BI Direct Lake, warehouse, lakehouse, notebooks) can then query it. There is no extra storage cost.',
            sources: [EVENTHOUSE_ONELAKE],
          },
          {
            text: 'You can turn it on at the database level (all new tables, optionally back-filling existing ones) or per table. The KQL database’s retention policy also applies to the OneLake copy.',
            sources: [EVENTHOUSE_ONELAKE],
          },
          {
            text: 'Semantic model OneLake integration writes the data of import-mode tables to Delta tables in OneLake. It needs a Premium P or Fabric F capacity; Pro, PPU, and Embedded A/EM aren’t supported.',
            sources: [MODEL_ONELAKE],
          },
        ],
        howTo: [
          {
            text: 'Eventhouse: select the database or table, then in the OneLake section of the details pane set Availability to Enabled. Then create a OneLake shortcut from a lakehouse or warehouse, or query it with Direct Lake.',
            sources: [EVENTHOUSE_ONELAKE],
          },
          {
            text: 'Semantic model: in the model’s settings, turn on OneLake integration. Then run at least one manual or scheduled refresh, because data is only written to Delta during a refresh.',
            sources: [MODEL_ONELAKE],
          },
          {
            text: 'To use the exported tables, create a shortcut in Lakehouse explorer (Tables > New shortcut > Microsoft OneLake) and select the semantic model and its tables.',
            sources: [MODEL_ONELAKE],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Trigger a semantic model export to OneLake with TMSL',
        language: 'tmsl',
        illustrative: true,
        steps: [
          {
            code: '{\n  "export": {\n    "layout": "delta",\n    "type": "full",\n    "objects": [ { "database": "<semantic model name>" } ]\n  }\n}',
            explain: 'Run this TMSL command (for example in SSMS over the XMLA endpoint) to export all import tables of the named semantic model as Delta tables. XMLA read-write must be enabled.',
          },
        ],
        sources: [MODEL_ONELAKE],
      },
    ],
    traps: [
      {
        text: 'While eventhouse OneLake availability is on, you can’t rename tables, alter a column type, apply row-level security to tables, or delete, truncate, or purge data. Turn it off, make the change, and turn it back on.',
        sources: [EVENTHOUSE_ONELAKE],
      },
      {
        text: 'Turning eventhouse OneLake availability off soft-deletes the data from OneLake.',
        sources: [EVENTHOUSE_ONELAKE],
      },
      {
        text: 'Eventhouse writes to OneLake in batches and can delay writes (by default up to 3 hours) until it has enough data for well-sized Parquet files. Freshly ingested rows may not appear in OneLake immediately.',
        sources: [EVENTHOUSE_ONELAKE],
      },
      {
        text: 'Semantic model OneLake integration only applies to import tables, and nothing is exported until a refresh runs.',
        sources: [MODEL_ONELAKE],
      },
    ],
    dontConfuse: [
      {
        pairId: 'onelake-availability-vs-integration',
        a: 'Eventhouse OneLake availability',
        b: 'Semantic model OneLake integration',
        difference: [
          {
            text: 'Eventhouse OneLake availability exposes KQL database data as Delta. You turn it on per database or table, and it follows the KQL retention policy. Semantic model OneLake integration exports import-mode model tables to Delta. You turn it on in model settings, and data appears after a refresh.',
            sources: [EVENTHOUSE_ONELAKE, MODEL_ONELAKE],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'OneLake availability',
        definition: 'An eventhouse setting that makes KQL database or table data available in OneLake in Delta format for other Fabric engines.',
        sources: [EVENTHOUSE_ONELAKE],
      },
      {
        term: 'OneLake integration for semantic models',
        definition: 'A semantic model setting that writes import-mode table data to Delta tables in OneLake during refresh.',
        sources: [MODEL_ONELAKE],
      },
    ],
    needsVerification: [],
  },

  // ── Carding Machine ──────────────────────────────────────────────────
  {
    machineId: 'carding-machine',
    pl300Adds: [
      {
        text: 'In PL-300 you removed duplicates, replaced nulls, set types, and filtered rows in Power Query. DP-600 expects the same cleaning in Fabric tools: T-SQL in a warehouse (for example ROW_NUMBER with QUALIFY to remove duplicates, TRY_CAST and COALESCE for types and nulls), Data Wrangler in a notebook, or Dataflow Gen2.',
        sources: [QUALIFY, TRY_CAST, COALESCE, DATA_WRANGLER, DATAFLOW_GEN2],
      },
      {
        text: 'Fabric-specific: warehouse tables support only a subset of T-SQL data types, so type conversion includes mapping unsupported types (such as datetime, money, nvarchar) to supported ones.',
        sources: [DATA_TYPES],
      },
    ],
    overview: [
      {
        text: 'Raw data has duplicates, gaps, wrong types, and rows you don’t want. Cleaning it before modeling keeps facts correct and keys joinable. In a medallion design, this is the silver layer’s job: fix errors, standardize formats, remove duplicates.',
        sources: [LOAD_TABLES, `${L}fabric/onelake/onelake-medallion-lakehouse-architecture`],
      },
    ],
    bullets: [
      {
        bulletId: 'P2.7',
        tools: ['warehouse', 'notebook', 'dataflow-gen2'],
        concepts: [
          {
            text: 'Duplicates: identify them by the business key and keep one row per key, usually the latest. In T-SQL, ROW_NUMBER() OVER (PARTITION BY key ORDER BY ...) numbers the rows within each key, and QUALIFY keeps row 1 without a subquery.',
            sources: [QUALIFY],
          },
          {
            text: 'Missing or null values: replace them with a default (COALESCE returns the first non-null argument), drop the rows, or map them to an "Unknown" dimension member so fact rows still have a valid key.',
            sources: [COALESCE, LOAD_TABLES, DIM_TABLES],
          },
          {
            text: 'In a notebook, Data Wrangler offers point-and-click operations that generate pandas or PySpark code: Drop duplicate rows, Drop missing values, Fill missing values, Change column type, and Filter.',
            sources: [DATA_WRANGLER],
          },
        ],
        howTo: [
          {
            text: 'Warehouse: clean in staging tables, then load the dimensional tables with set-based INSERT...SELECT or CTAS. Learn recommends staging source data in a separate schema that business users never see.',
            sources: [LOAD_TABLES],
          },
          {
            text: 'Notebook: open Data Wrangler on a DataFrame, apply cleaning operations, preview each one, then export the generated code back to the notebook as a function.',
            sources: [DATA_WRANGLER],
          },
          {
            text: 'Dataflow Gen2: use Power Query transformations (300+ available) and write the result to a lakehouse or warehouse destination.',
            sources: [DATAFLOW_GEN2],
          },
        ],
      },
      {
        bulletId: 'P2.8',
        tools: ['warehouse', 'notebook', 'dataflow-gen2'],
        concepts: [
          {
            text: 'Warehouse tables support: bit, smallint, int, bigint, decimal/numeric, float, real, date, time, datetime2, char, varchar, varbinary, and uniqueidentifier.',
            sources: [DATA_TYPES],
          },
          {
            text: 'Unsupported in warehouse tables, with Learn’s alternatives: money → decimal; datetime/smalldatetime → datetime2; nchar/nvarchar → char/varchar; text/ntext → varchar; image → varbinary; tinyint → smallint; json → varchar.',
            sources: [DATA_TYPES],
          },
          {
            text: 'TRY_CAST converts a value to a target type and returns NULL instead of an error when the conversion fails. That makes bad values easy to find and handle.',
            sources: [TRY_CAST],
          },
        ],
        howTo: [
          {
            text: 'Convert to the dimensional model’s types during the ETL transform step, before loading.',
            sources: [LOAD_TABLES],
          },
          {
            text: 'Use TRY_CAST in a SELECT to convert, then filter or COALESCE the NULLs it returns for values that didn’t convert.',
            sources: [TRY_CAST, COALESCE],
          },
        ],
      },
      {
        bulletId: 'P2.9',
        tools: ['warehouse', 'sql-analytics-endpoint', 'notebook', 'dataflow-gen2'],
        concepts: [
          {
            text: 'WHERE filters rows before grouping and window functions. HAVING filters groups after aggregation. QUALIFY filters after window functions are calculated.',
            sources: [QUALIFY],
          },
          {
            text: 'Filtering early, when staging, keeps only relevant rows in later steps.',
            sources: [LOAD_TABLES],
          },
        ],
        howTo: [
          {
            text: 'T-SQL: add a WHERE clause to the SELECT that feeds your load. Notebook: use Data Wrangler’s Filter operation or a DataFrame filter. Dataflow Gen2: filter rows in Power Query before the destination step.',
            sources: [QUALIFY, DATA_WRANGLER, DATAFLOW_GEN2],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Keep the latest row per customer, fix types, and fill nulls (warehouse)',
        language: 'tsql',
        illustrative: true,
        steps: [
          {
            code: 'SELECT CustomerID,\n       COALESCE(Region, \'Unknown\') AS Region,\n       TRY_CAST(SignupDate AS date) AS SignupDate,\n       ModifiedAt\nFROM staging.Customer',
            explain: 'Read from the staging table, replace a missing Region with "Unknown", and convert SignupDate to date (NULL if a value isn’t a valid date).',
          },
          {
            code: "WHERE CustomerID IS NOT NULL",
            explain: 'Filter out rows with no business key before any window function runs.',
          },
          {
            code: 'QUALIFY ROW_NUMBER() OVER (PARTITION BY CustomerID ORDER BY ModifiedAt DESC) = 1;',
            explain: 'Number each customer’s rows from newest to oldest and keep only the newest, which removes duplicates without a subquery.',
          },
        ],
        sources: [QUALIFY, COALESCE, TRY_CAST, LOAD_TABLES],
      },
    ],
    traps: [
      {
        text: 'Don’t use nvarchar or datetime when creating warehouse tables; they aren’t supported for persisted storage. Use varchar and datetime2.',
        sources: [DATA_TYPES],
      },
      {
        text: 'datetime2 and time are limited to 6 digits of fractional-second precision in the warehouse.',
        sources: [DATA_TYPES],
      },
      {
        text: 'uniqueidentifier columns can be stored in a warehouse, but the SQL analytics endpoint reads them as binary. Joins between a warehouse and a lakehouse endpoint on such a column don’t work as expected.',
        sources: [DATA_TYPES],
      },
      {
        text: 'Filters in WHERE run before window functions, so a WHERE can’t reference ROW_NUMBER(). Use QUALIFY, a CTE, or a subquery.',
        sources: [QUALIFY],
      },
    ],
    dontConfuse: [
      {
        pairId: 'where-having-qualify',
        a: 'WHERE vs HAVING',
        b: 'QUALIFY',
        difference: [
          {
            text: 'WHERE filters individual rows before grouping and window functions. HAVING filters grouped results after GROUP BY. QUALIFY filters after window functions are evaluated. Order: FROM → WHERE → GROUP BY → HAVING → window functions → QUALIFY → ORDER BY.',
            sources: [QUALIFY],
          },
        ],
      },
    ],
    renamed: [],
    preview: [
      {
        feature: 'ALTER TABLE … ALTER COLUMN in Warehouse',
        note: 'Changing an existing column’s type in place is in preview. Otherwise only ADD nullable column and DROP COLUMN are supported.',
        sources: [TSQL_SURFACE],
      },
    ],
    upcoming: [],
    glossary: [
      {
        term: 'QUALIFY',
        definition: 'A T-SQL clause (Fabric Warehouse and SQL analytics endpoint) that filters rows on the result of window functions such as ROW_NUMBER, without a subquery.',
        sources: [QUALIFY],
      },
      {
        term: 'TRY_CAST',
        definition: 'A T-SQL function that converts a value to a type and returns NULL if the conversion fails.',
        sources: [TRY_CAST],
      },
      {
        term: 'COALESCE',
        definition: 'A T-SQL expression that returns the first of its arguments that isn’t NULL.',
        sources: [COALESCE],
      },
      {
        term: 'Data Wrangler',
        definition: 'A notebook tool for exploring and cleaning pandas or Spark DataFrames through a UI that generates reusable code.',
        sources: [DATA_WRANGLER],
      },
      {
        term: 'Staging table',
        definition: 'A table that holds extracted source data for the ETL process. It is emptied at the start of each run and never exposed to business users.',
        sources: [LOAD_TABLES],
      },
    ],
    needsVerification: [
      {
        claim: 'PySpark code for de-duplication and null handling (dropDuplicates, fillna).',
        why: 'The Learn pages read for this machine show Data Wrangler’s operation names but not the PySpark calls it generates, so the notes use T-SQL for code. Find a Learn page with the PySpark methods in Step 8.',
      },
    ],
  },

  // ── Twisting Frame ───────────────────────────────────────────────────
  {
    machineId: 'twisting-frame',
    pl300Adds: [
      {
        text: 'In PL-300 you used Merge queries and Group By in Power Query. In DP-600 the same operations appear as T-SQL JOIN and GROUP BY in a warehouse (often inside CREATE TABLE AS SELECT), as PySpark join() and groupBy() or Spark SQL in a notebook, and as Merge queries in Dataflow Gen2 or the visual query editor.',
        sources: [INGEST_WAREHOUSE, LAKEHOUSE_PREP, VISUAL_QUERY],
      },
    ],
    overview: [
      {
        text: 'Combining (merging on keys or appending rows) and aggregating (summarizing to a coarser grain) are core ETL transforms. They build dimension tables from several sources and produce summary tables for reporting.',
        sources: [LOAD_TABLES],
      },
    ],
    bullets: [
      {
        bulletId: 'P2.5',
        tools: ['warehouse', 'notebook', 'dataflow-gen2', 'lakehouse'],
        concepts: [
          {
            text: 'Aggregation can reduce a fact table’s dimensionality or raise its grain. For example, if you don’t need sales order numbers, group by all the dimension keys and sum the measures.',
            sources: [LOAD_TABLES],
          },
          {
            text: 'Learn’s lakehouse tutorial builds business aggregate tables (for example sales by date and city) from the star schema in a notebook, using PySpark or Spark SQL.',
            sources: [LAKEHOUSE_PREP],
          },
        ],
        howTo: [
          {
            text: 'PySpark: join the DataFrames, groupBy the grouping columns, apply sum(), rename the result columns, and write the result as a Delta table.',
            sources: [LAKEHOUSE_PREP],
          },
          {
            text: 'T-SQL in a warehouse: use CREATE TABLE AS SELECT ... GROUP BY to materialize the aggregate as a new table.',
            sources: [INGEST_WAREHOUSE, LOAD_TABLES],
          },
        ],
      },
      {
        bulletId: 'P2.6',
        tools: ['warehouse', 'sql-analytics-endpoint', 'notebook', 'dataflow-gen2'],
        concepts: [
          {
            text: 'Merging (joining) combines data from different sources on matching keys, for example product data from two systems that share a SKU. Appending (a union) stacks rows that share the same structure.',
            sources: [LOAD_TABLES],
          },
          {
            text: 'Warehouse T-SQL can join tables across warehouses and lakehouses in the same workspace by using three-part names (item.schema.table).',
            sources: [INGEST_WAREHOUSE, QUERY_WAREHOUSE],
          },
        ],
        howTo: [
          {
            text: 'Visual query editor: drag two tables onto the canvas, choose Merge queries as new, and pick the key columns and the join kind (for example Inner).',
            sources: [VISUAL_QUERY],
          },
          {
            text: 'T-SQL: CREATE TABLE AS SELECT with JOINs across items is a set-based load, which Learn calls likely the most efficient way to load dimensional tables.',
            sources: [LOAD_TABLES, INGEST_WAREHOUSE],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Join and aggregate sales by date and city (notebook)',
        language: 'pyspark',
        illustrative: true,
        steps: [
          {
            code: 'sale = spark.read.format("delta").load("Tables/dbo/fact_sale")\ndate = spark.read.format("delta").load("Tables/dbo/dimension_date")\ncity = spark.read.format("delta").load("Tables/dbo/dimension_city")',
            explain: 'Load the fact table and two dimension tables from the lakehouse into DataFrames.',
          },
          {
            code: 'joined = (sale.join(date, sale.InvoiceDateKey == date.Date, "inner")\n              .join(city, sale.CityKey == city.CityKey, "inner"))',
            explain: 'Inner-join the fact rows to their date and city rows on the key columns.',
          },
          {
            code: 'agg = (joined.groupBy("Date", "City")\n          .sum("TotalExcludingTax", "Profit")\n          .withColumnRenamed("sum(Profit)", "SumOfProfit"))',
            explain: 'Group by date and city, sum the measures, and give the summed column a readable name.',
          },
          {
            code: 'agg.write.mode("overwrite").format("delta").save("Tables/dbo/aggregate_sale_by_date_city")',
            explain: 'Save the aggregate as a new Delta table that reports can read.',
          },
        ],
        sources: [LAKEHOUSE_PREP],
      },
      {
        title: 'Join across items and aggregate into a new table (warehouse)',
        language: 'tsql',
        illustrative: true,
        steps: [
          {
            code: 'CREATE TABLE Reporting.dbo.SalesByRegion\nAS',
            explain: 'CTAS creates the target table from the result of the SELECT that follows.',
          },
          {
            code: 'SELECT p.Category, s.Region, SUM(s.Amount) AS TotalAmount\nFROM SalesLakehouse.dbo.Sales AS s\nJOIN Reporting.dbo.Products AS p ON s.ProductID = p.ProductID',
            explain: 'Join a lakehouse table and a warehouse table in the same workspace using three-part names.',
          },
          {
            code: 'GROUP BY p.Category, s.Region;',
            explain: 'Aggregate to one row per category and region.',
          },
        ],
        sources: [INGEST_WAREHOUSE, QUERY_WAREHOUSE],
      },
    ],
    traps: [
      {
        text: 'Cross-database queries with three-part names work only within the same workspace.',
        sources: [QUERY_WAREHOUSE, INGEST_WAREHOUSE],
      },
      {
        text: 'Aggregating a fact table loses detail for good. Learn notes that dropping columns like sales order numbers by grouping raises the grain, so do it only when no analysis needs that detail.',
        sources: [LOAD_TABLES],
      },
    ],
    dontConfuse: [
      {
        pairId: 'merge-vs-append',
        a: 'Merge (join)',
        b: 'Append (union)',
        difference: [
          {
            text: 'Merge adds columns by matching rows on keys. Append adds rows from sources with the same structure. Example: product attributes from two systems (merge on SKU) vs sales from several systems (append into one set).',
            sources: [LOAD_TABLES],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'CREATE TABLE AS SELECT (CTAS)',
        definition: 'T-SQL that creates a new table and fills it from a SELECT in one set-based statement. Commonly used to load warehouse tables.',
        sources: [INGEST_WAREHOUSE, LOAD_TABLES],
      },
      {
        term: 'Three-part name',
        definition: 'An item.schema.object reference (for example Sales.dbo.Orders) used to query another warehouse or lakehouse endpoint in the same workspace.',
        sources: [QUERY_WAREHOUSE, INGEST_WAREHOUSE],
      },
      {
        term: 'Grain',
        definition: 'The level of detail one fact row represents. Aggregation raises (coarsens) the grain.',
        sources: [LOAD_TABLES, FACT_TABLES],
      },
    ],
    needsVerification: [],
  },

  // ── Dye Vat ──────────────────────────────────────────────────────────
  {
    machineId: 'dye-vat',
    pl300Adds: [
      {
        text: 'In PL-300 you added custom and conditional columns in Power Query, or calculated columns in the model. In DP-600 enrichment happens upstream: withColumn() in PySpark, computed expressions in T-SQL CTAS or views, or Dataflow Gen2 columns, so the stored table already has the columns.',
        sources: [LAKEHOUSE_PREP, LOAD_TABLES, INGEST_WAREHOUSE],
      },
    ],
    overview: [
      {
        text: 'Enriching data means adding what the source doesn’t have: derived columns (full name, gross revenue, year and quarter), lookups from other tables, or whole new tables such as a date dimension. Doing it in the data store means every consumer gets the same values.',
        sources: [LOAD_TABLES, DIM_TABLES],
      },
    ],
    bullets: [
      {
        bulletId: 'P2.2',
        tools: ['notebook', 'warehouse', 'dataflow-gen2', 'lakehouse'],
        concepts: [
          {
            text: 'Calculated columns in the ETL: concatenate first and last name into a full name, or multiply unit price by quantity to get gross revenue.',
            sources: [LOAD_TABLES],
          },
          {
            text: 'New tables: a date dimension should cover the date range of all fact tables (and future dates for budgets or forecasts). Learn recommends extending it with a T-SQL stored procedure.',
            sources: [DIM_TABLES, LOAD_TABLES],
          },
          {
            text: 'Dataflow Gen2 can add columns while ingesting, for example by changing data types, adding or removing columns, or using functions to produce calculated columns.',
            sources: [INGEST_WAREHOUSE],
          },
        ],
        howTo: [
          {
            text: 'Notebook: use withColumn() to add derived columns (Learn’s tutorial adds Year, Quarter, and Month from a date), then write the Delta table, optionally partitioned by the new columns.',
            sources: [LAKEHOUSE_PREP],
          },
          {
            text: 'Warehouse: compute the columns in the SELECT of a CTAS or INSERT...SELECT, or expose them in a view.',
            sources: [INGEST_WAREHOUSE, WAREHOUSE],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Add date-part columns and partition the table (notebook)',
        language: 'pyspark',
        illustrative: true,
        steps: [
          {
            code: 'from pyspark.sql.functions import col, year, quarter, month\ndf = spark.read.format("parquet").load("Files/raw/fact_sale")',
            explain: 'Import the date functions and read the raw sales files.',
          },
          {
            code: 'df = (df.withColumn("Year", year(col("InvoiceDateKey")))\n        .withColumn("Quarter", quarter(col("InvoiceDateKey")))\n        .withColumn("Month", month(col("InvoiceDateKey"))))',
            explain: 'Add three new columns derived from the invoice date.',
          },
          {
            code: 'df.write.mode("overwrite").format("delta").partitionBy("Year", "Quarter").save("Tables/dbo/fact_sale")',
            explain: 'Save as a Delta table partitioned by the new Year and Quarter columns.',
          },
        ],
        sources: [LAKEHOUSE_PREP],
      },
      {
        title: 'The same enrichment in Spark SQL',
        language: 'sparksql',
        illustrative: true,
        steps: [
          {
            code: 'CREATE OR REPLACE TABLE delta.`Tables/dbo/fact_sale`\nUSING DELTA\nPARTITIONED BY (Year, Quarter)\nAS',
            explain: 'Create or replace a partitioned Delta table from a query.',
          },
          {
            code: 'SELECT *, year(InvoiceDateKey) AS Year, quarter(InvoiceDateKey) AS Quarter, month(InvoiceDateKey) AS Month\nFROM parquet.`Files/raw/fact_sale`;',
            explain: 'Select every source column plus the three derived date columns.',
          },
        ],
        sources: [LAKEHOUSE_PREP],
      },
    ],
    traps: [
      {
        text: 'Columns derived in the ETL are stored once and shared by every engine. A DAX calculated column exists only inside one semantic model.',
        sources: [LOAD_TABLES, ONELAKE],
      },
      {
        text: 'If a dimensional model is built only in Power Query inside a semantic model, it can’t manage historical change. Learn says to use a warehouse with periodic ETL when history matters.',
        sources: [DIM_OVERVIEW],
      },
    ],
    dontConfuse: [],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Date dimension',
        definition: 'A dimension with one row per date covering every date the facts use (plus future dates for plans), with attributes like year, quarter, and month.',
        sources: [DIM_TABLES],
      },
      {
        term: 'Partitioning (Delta)',
        definition: 'Writing a Delta table split into folders by column values (for example Year and Quarter), as Learn’s lakehouse tutorial does with partitionBy.',
        sources: [LAKEHOUSE_PREP],
      },
    ],
    needsVerification: [],
  },

  // ── Weave Planner ────────────────────────────────────────────────────
  {
    machineId: 'weave-planner',
    pl300Adds: [
      {
        text: 'PL-300 taught star schemas inside a semantic model. DP-600 asks you to build the star in the data store itself: surrogate keys, slowly changing dimensions, unknown members, and ETL into warehouse or lakehouse tables. Learn calls a dimensional model in the warehouse a recommended prerequisite for enterprise semantic models.',
        sources: [DIM_OVERVIEW, DIM_TABLES, LOAD_TABLES],
      },
    ],
    overview: [
      {
        text: 'A star schema has fact tables (measurements of events) surrounded by dimension tables (the things you filter and group by). It is optimized for analytic queries, with fewer joins and simpler maintenance, and it is the recommended design for a Fabric warehouse.',
        sources: [DIM_OVERVIEW],
      },
    ],
    bullets: [
      {
        bulletId: 'P2.3',
        tools: ['warehouse', 'lakehouse', 'notebook', 'pipeline'],
        concepts: [
          {
            text: 'Dimension tables describe entities (product, customer, date). Each should have a surrogate key: a single-column, meaningless integer key generated in the warehouse. The source system’s natural (business) key is kept as a column for matching during ETL.',
            sources: [DIM_TABLES],
          },
          {
            text: 'Slowly changing dimensions: Type 1 overwrites the member; Type 2 inserts a new versioned row with validity dates, which needs the surrogate key; Type 3 tracks limited history in extra columns and is rarely used.',
            sources: [DIM_TABLES],
          },
          {
            text: 'Fact tables store dimension keys plus measures at a declared grain. Learn names three types: transaction (one row per event), periodic snapshot (measured at intervals, semi-additive measures), and accumulating snapshot (milestones of a process, several date keys).',
            sources: [FACT_TABLES],
          },
          {
            text: 'Add special dimension members (for example Unknown or N/A) so a fact row whose dimension lookup fails still gets a valid key.',
            sources: [DIM_TABLES, LOAD_TABLES],
          },
        ],
        howTo: [
          {
            text: 'Warehouse ETL: stage the source data, then process dimensions (match on business keys and apply SCD type 1 updates or type 2 expire-and-insert), then load facts by looking up the current surrogate key for each dimension. Use pipelines to orchestrate stored procedures and SQL scripts.',
            sources: [LOAD_TABLES],
          },
          {
            text: 'Lakehouse: Learn’s tutorial writes fact_sale and the dimension_* tables as Delta tables from notebooks, forming a star schema in the lakehouse.',
            sources: [LAKEHOUSE_PREP],
          },
          {
            text: 'Load fact tables incrementally where possible; truncating and reloading a large fact table is a last resort.',
            sources: [LOAD_TABLES],
          },
          {
            text: 'Never truncate and fully reload a dimension with generated surrogate keys. It breaks fact references and SCD type 2 history. Record source deletions as soft deletes (an IsDeleted bit column) instead.',
            sources: [LOAD_TABLES],
          },
        ],
      },
      {
        bulletId: 'P2.4',
        tools: ['warehouse', 'sql-analytics-endpoint', 'notebook'],
        concepts: [
          {
            text: 'Dimension tables should almost always be denormalized: hierarchy levels (for example subcategory and category) are flattened into one product table, accepting some repeated values.',
            sources: [DIM_TABLES],
          },
          {
            text: 'A snowflake dimension is the normalized exception, spread over several related tables. In a semantic model a hierarchy can only use columns from one table, so Learn suggests exposing a snowflake through a view that joins it back into one denormalized result.',
            sources: [DIM_TABLES],
          },
        ],
        howTo: [
          {
            text: 'Denormalize with joins in the ETL (CTAS or INSERT...SELECT) or in a view over the normalized tables.',
            sources: [DIM_TABLES, LOAD_TABLES],
          },
          {
            text: 'Many small lookup dimensions can be combined into one junk dimension.',
            sources: [DIM_TABLES],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Flatten a snowflaked product dimension with a view (warehouse)',
        language: 'tsql',
        illustrative: true,
        steps: [
          {
            code: 'CREATE VIEW dbo.vDimProduct\nAS',
            explain: 'A view stores the denormalizing query so consumers see one product table.',
          },
          {
            code: 'SELECT p.Product_SK, p.ProductCode, p.ProductName,\n       s.SubcategoryName, c.CategoryName',
            explain: 'Return the surrogate key, the natural key, and the attributes from all three hierarchy levels.',
          },
          {
            code: 'FROM dbo.Product AS p\nJOIN dbo.Subcategory AS s ON p.Subcategory_FK = s.Subcategory_SK\nJOIN dbo.Category AS c ON s.Category_FK = c.Category_SK;',
            explain: 'Join product to subcategory to category, flattening the snowflake into a single denormalized row per product.',
          },
        ],
        sources: [DIM_TABLES, CREATE_VIEW],
      },
      {
        title: 'Apply type 1 changes to a dimension with MERGE (warehouse)',
        language: 'tsql',
        illustrative: true,
        steps: [
          {
            code: 'MERGE dbo.DimCustomer AS tgt\nUSING staging.Customer AS src\nON tgt.CustomerID = src.CustomerID',
            explain: 'Match staged source rows to existing dimension rows on the natural (business) key.',
          },
          {
            code: 'WHEN MATCHED THEN UPDATE SET tgt.Region = src.Region',
            explain: 'Type 1: overwrite the changed attribute on the existing member.',
          },
          {
            code: 'WHEN NOT MATCHED BY TARGET THEN\n  INSERT (CustomerID, Region) VALUES (src.CustomerID, src.Region);',
            explain: 'Insert customers the dimension doesn’t have yet.',
          },
        ],
        sources: [MERGE, TSQL_SURFACE, LOAD_TABLES],
      },
    ],
    traps: [
      {
        text: 'Surrogate keys should be the smallest suitable integer type with no business meaning, except date and time keys, which Learn suggests storing as YYYYMMDD and HHMM.',
        sources: [LOAD_TABLES, DIM_TABLES],
      },
      {
        text: 'IDENTITY columns exist in Fabric Data Warehouse but with limitations. Check them before relying on IDENTITY for surrogate keys.',
        sources: [LOAD_TABLES, TSQL_SURFACE],
      },
      {
        text: 'Primary key, unique, and foreign key constraints can be added in a warehouse only with NOT ENFORCED.',
        sources: [TSQL_SURFACE],
      },
      {
        text: 'SCD type 3 is hard to use in a semantic model. Learn suggests considering type 2 instead.',
        sources: [DIM_TABLES],
      },
      {
        text: 'MERGE is generally available in Fabric Data Warehouse.',
        sources: [TSQL_SURFACE],
      },
    ],
    dontConfuse: [
      {
        pairId: 'scd1-vs-scd2',
        a: 'SCD type 1',
        b: 'SCD type 2',
        difference: [
          {
            text: 'Type 1 overwrites the attribute, so history is lost and reports show the current value everywhere. Type 2 expires the current row and inserts a new version, so facts keep pointing at the version that was true when they happened.',
            sources: [DIM_TABLES, LOAD_TABLES],
          },
        ],
      },
      {
        pairId: 'star-vs-snowflake',
        a: 'Star (denormalized dimension)',
        b: 'Snowflake dimension',
        difference: [
          {
            text: 'A star keeps each dimension in one denormalized table, which means fewer joins and simpler models. A snowflake normalizes a dimension into related tables, which is less redundant but needs a joining view before a semantic model can build hierarchies on it.',
            sources: [DIM_TABLES, DIM_OVERVIEW],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Star schema',
        definition: 'A dimensional design with a fact table at the center and denormalized dimension tables around it, optimized for analytic queries.',
        sources: [DIM_OVERVIEW],
      },
      {
        term: 'Fact table',
        definition: 'A table of measurements for events or observations at a declared grain, holding dimension keys and (usually additive) measures.',
        sources: [DIM_OVERVIEW, FACT_TABLES],
      },
      {
        term: 'Dimension table',
        definition: 'A table describing an entity used to filter and group facts, such as product, customer, or date.',
        sources: [DIM_OVERVIEW],
      },
      {
        term: 'Surrogate key',
        definition: 'A single-column, warehouse-generated key with no business meaning, used to relate dimensions to facts and to track SCD type 2 history.',
        sources: [DIM_TABLES],
      },
      {
        term: 'Natural key',
        definition: 'The key from the source system (also called a business key), used by ETL to match incoming rows to dimension members.',
        sources: [DIM_TABLES],
      },
      {
        term: 'Slowly changing dimension (SCD)',
        definition: 'A technique for handling changes to dimension attributes over time: type 1 overwrite, type 2 versioned rows, type 3 limited history.',
        sources: [DIM_TABLES],
      },
      {
        term: 'Snowflake dimension',
        definition: 'A dimension normalized into several related tables, for example Product → Subcategory → Category.',
        sources: [DIM_TABLES],
      },
      {
        term: 'Denormalization',
        definition: 'Storing precomputed, redundant data (such as flattened hierarchy levels) in one table to simplify and speed up queries.',
        sources: [DIM_TABLES],
      },
      {
        term: 'Junk dimension',
        definition: 'A dimension that combines many small, low-cardinality lookup attributes into one table.',
        sources: [DIM_TABLES],
      },
      {
        term: 'Soft delete',
        definition: 'Marking a dimension member as no longer valid (for example IsDeleted = 1) instead of physically deleting it.',
        sources: [LOAD_TABLES],
      },
      {
        term: 'MERGE',
        definition: 'A T-SQL statement that inserts, updates, or deletes target rows based on a join with a source. Generally available in Fabric Data Warehouse.',
        sources: [MERGE, TSQL_SURFACE],
      },
    ],
    needsVerification: [],
  },

  // ── Inspection Bench ─────────────────────────────────────────────────
  {
    machineId: 'inspection-bench',
    overview: [
      {
        text: 'Analytics engineers constantly query data to check loads, explore sources, and answer questions. In a warehouse or SQL analytics endpoint you have two editors in the Fabric portal: the no-code visual query editor and the SQL query editor. You can also use external tools like SSMS or VS Code through the SQL connection string.',
        sources: [QUERY_WAREHOUSE, VISUAL_QUERY],
      },
    ],
    bullets: [
      {
        bulletId: 'P3.1',
        tools: ['warehouse', 'sql-analytics-endpoint'],
        concepts: [
          {
            text: 'The visual query editor uses the Power Query diagram view. You drag tables onto a canvas and apply steps such as merge, filter, and group without writing SQL. It works on warehouses, SQL analytics endpoints, and mirrored databases.',
            sources: [VISUAL_QUERY],
          },
          {
            text: 'View SQL shows the T-SQL generated from your steps. You can then open it in the SQL editor to edit it.',
            sources: [VISUAL_QUERY],
          },
        ],
        howTo: [
          {
            text: 'Select New visual query, drag tables from the Explorer, use Merge queries as new to join on a key, apply filter or group steps, then save the result as a view (Save as view) or as a table (Save as table, which uses CREATE TABLE AS SELECT).',
            sources: [VISUAL_QUERY],
          },
          {
            text: 'For a cross-warehouse visual query, add the other warehouse with + Warehouses and merge tables from both.',
            sources: [VISUAL_QUERY, QUERY_WAREHOUSE],
          },
        ],
      },
      {
        bulletId: 'P3.2',
        tools: ['warehouse', 'sql-analytics-endpoint'],
        concepts: [
          {
            text: 'SELECT, WHERE, GROUP BY, HAVING, and ORDER BY work as in SQL Server. Fabric also supports newer syntax: FROM-first queries, GROUP BY ALL and ORDER BY ALL, QUALIFY, and analytic functions such as MEDIAN and APPROX_QUANTILE.',
            sources: [TSQL_SURFACE],
          },
          {
            text: 'Cross-database queries join tables from other warehouses or lakehouse endpoints in the same workspace by using three-part names.',
            sources: [QUERY_WAREHOUSE],
          },
        ],
        howTo: [
          {
            text: 'Select New SQL query, write the query, and run it. To query another item, add it to the Explorer, then reference it as item.schema.table.',
            sources: [QUERY_WAREHOUSE],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Filter, aggregate, and filter groups (SQL analytics endpoint or warehouse)',
        language: 'tsql',
        illustrative: true,
        steps: [
          {
            code: 'SELECT c.Region, COUNT(*) AS Orders, SUM(o.Amount) AS Revenue',
            explain: 'Return one row per region with an order count and total revenue.',
          },
          {
            code: 'FROM SalesLakehouse.dbo.Orders AS o\nJOIN dbo.Customer AS c ON o.CustomerID = c.CustomerID',
            explain: 'Join a lakehouse table (three-part name) to a local table.',
          },
          {
            code: "WHERE o.OrderDate >= '2026-01-01'",
            explain: 'Keep only orders from 2026 before grouping.',
          },
          {
            code: 'GROUP BY c.Region\nHAVING SUM(o.Amount) > 10000\nORDER BY Revenue DESC;',
            explain: 'Group by region, keep only regions above 10,000, and sort by revenue descending.',
          },
        ],
        sources: [QUERY_WAREHOUSE, QUALIFY],
      },
    ],
    traps: [
      {
        text: 'The visual query editor only runs read-only SELECT queries: no DDL or DML. It supports only Power Query operations that can fold to SQL.',
        sources: [VISUAL_QUERY],
      },
      {
        text: 'Visualize results doesn’t support queries with ORDER BY.',
        sources: [VISUAL_QUERY],
      },
      {
        text: 'Some visual steps can’t be translated to SQL, and the editor then won’t let you save the query as a view.',
        sources: [VISUAL_QUERY],
      },
    ],
    dontConfuse: [
      {
        pairId: 'visual-vs-sql-editor',
        a: 'Visual query editor',
        b: 'SQL query editor',
        difference: [
          {
            text: 'The visual editor is no-code (Power Query diagram), read-only, and limited to foldable steps, but it can show the generated SQL and save results as a view or table. The SQL editor runs any supported T-SQL you write, including DDL and DML on a warehouse.',
            sources: [VISUAL_QUERY, QUERY_WAREHOUSE],
          },
        ],
      },
    ],
    renamed: [],
    preview: [
      {
        feature: 'Nested common table expressions',
        note: 'Standard and sequential CTEs are generally available; nested CTEs are in preview in Fabric Warehouse and the SQL analytics endpoint.',
        sources: [TSQL_SURFACE],
      },
    ],
    upcoming: [],
    glossary: [
      {
        term: 'Visual query editor',
        definition: 'A no-code query builder in the Fabric portal, based on Power Query diagram view, for warehouses, SQL analytics endpoints, and mirrored databases.',
        sources: [VISUAL_QUERY],
      },
      {
        term: 'Cross-database query',
        definition: 'A T-SQL query that joins objects from several warehouses or SQL analytics endpoints in the same workspace by using three-part names.',
        sources: [QUERY_WAREHOUSE],
      },
    ],
    needsVerification: [],
  },

  // ── Recipe Book ──────────────────────────────────────────────────────
  {
    machineId: 'recipe-book',
    overview: [
      {
        text: 'Views, functions, and stored procedures package SQL logic so it can be reused, secured, and called by pipelines. They hold business rules (a clean customer list, an ETL step) in the database instead of in every report or notebook.',
        sources: [WAREHOUSE, TSQL_SURFACE],
      },
    ],
    bullets: [
      {
        bulletId: 'P2.1',
        tools: ['warehouse', 'sql-analytics-endpoint', 'pipeline'],
        concepts: [
          {
            text: 'Fabric Data Warehouse supports T-SQL views, stored procedures, and functions. You can also create views, functions, and procedures on the SQL analytics endpoint of a lakehouse, over its Delta tables.',
            sources: [TSQL_SURFACE, WAREHOUSE],
          },
          {
            text: 'On the SQL analytics endpoint, Learn specifically lists views, inline table-valued functions, and procedures as objects you can create to encapsulate business logic.',
            sources: [WAREHOUSE],
          },
          {
            text: 'Pipelines can run stored procedures and SQL scripts, which is how Learn suggests orchestrating ETL steps. A typical one is a procedure that extends the date dimension.',
            sources: [LOAD_TABLES, DATA_FACTORY],
          },
        ],
        howTo: [
          {
            text: 'Write CREATE VIEW, CREATE PROCEDURE, or CREATE FUNCTION in the SQL query editor of the warehouse or SQL analytics endpoint. The visual query editor can also save a query as a view.',
            sources: [CREATE_VIEW, CREATE_PROC, VISUAL_QUERY],
          },
          {
            text: 'Use a view to hide joins (for example flattening a snowflake dimension) and to apply object-level permissions to a defined slice of data.',
            sources: [DIM_TABLES, ENDPOINT],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'A view, an inline table-valued function, and a procedure',
        language: 'tsql',
        illustrative: true,
        steps: [
          {
            code: "CREATE VIEW dbo.vActiveCustomer AS\nSELECT CustomerID, CustomerName, Region\nFROM dbo.DimCustomer\nWHERE IsCurrent = 1 AND IsDeleted = 0;",
            explain: 'A view that returns only current, non-deleted customer versions, so reports never see expired SCD rows or soft deletes.',
          },
          {
            code: 'CREATE FUNCTION dbo.fnSalesByRegion (@Region varchar(50))\nRETURNS TABLE\nAS RETURN\n  SELECT OrderID, Amount FROM dbo.FactSales WHERE Region = @Region;',
            explain: 'An inline table-valued function: a parameterized query that returns a table and can be used in FROM like a view.',
          },
          {
            code: 'CREATE PROCEDURE dbo.LoadDailySales\nAS\nBEGIN\n  INSERT INTO dbo.FactSales (OrderID, Region, Amount)\n  SELECT OrderID, Region, Amount FROM staging.Sales;\nEND;',
            explain: 'A stored procedure for one ETL step, which a pipeline can call on a schedule. Because it inserts data, it must live in a warehouse, not on a SQL analytics endpoint.',
          },
          {
            code: 'EXEC dbo.LoadDailySales;',
            explain: 'Run the procedure, from the SQL editor or from a pipeline’s stored procedure activity.',
          },
        ],
        sources: [CREATE_VIEW, CREATE_PROC, WAREHOUSE, TSQL_SURFACE, LOAD_TABLES],
      },
    ],
    traps: [
      {
        text: 'You can create a procedure on a SQL analytics endpoint, but it can’t modify data there. The endpoint is read-only for INSERT, UPDATE, and DELETE.',
        sources: [ENDPOINT, TSQL_SURFACE],
      },
      {
        text: 'SQL security set on the SQL analytics endpoint (including permissions on views) applies only when data is read through the endpoint, not through Spark or other paths.',
        sources: [ENDPOINT],
      },
      {
        text: 'Learn pages conflict on materialized views. The warehouse overview mentions them, but the T-SQL surface area lists them as not supported. Don’t rely on them until confirmed.',
        sources: [WAREHOUSE, TSQL_SURFACE],
      },
    ],
    dontConfuse: [
      {
        pairId: 'endpoint-vs-warehouse',
        a: 'SQL analytics endpoint',
        b: 'Warehouse',
        difference: [
          {
            text: 'Read-only vs read-write: on the SQL analytics endpoint, T-SQL can define and query objects but can’t insert, update, or delete data, and tables can’t be created there. To change lakehouse data, use Spark. The warehouse supports full DDL and DML with multi-table transactions.',
            sources: [ENDPOINT, WAREHOUSE, TSQL_SURFACE],
          },
          {
            text: 'Where logic lives: both support views, functions, and stored procedures. On the endpoint they sit over the lakehouse’s Delta tables; in the warehouse they can also load and change data.',
            sources: [TSQL_SURFACE, WAREHOUSE],
          },
          {
            text: 'What’s visible: the endpoint shows only Delta tables in the lakehouse’s Tables area (including shortcuts). Files-area data isn’t exposed.',
            sources: [ENDPOINT, LAKEHOUSE],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'View',
        definition: 'A saved SELECT query that behaves like a table, used to hide joins, apply logic, and scope permissions.',
        sources: [CREATE_VIEW],
      },
      {
        term: 'Stored procedure',
        definition: 'Saved T-SQL statements run by name (EXEC), often called from pipelines for ETL steps.',
        sources: [CREATE_PROC, LOAD_TABLES],
      },
      {
        term: 'Inline table-valued function (TVF)',
        definition: 'A function that returns a table from a single SELECT and can take parameters. Supported on the SQL analytics endpoint and the warehouse.',
        sources: [WAREHOUSE],
      },
    ],
    needsVerification: [
      {
        claim: 'Are scalar user-defined functions supported in Fabric Data Warehouse?',
        why: 'Learn confirms "functions" and specifically inline TVFs. The CREATE FUNCTION reference has no Fabric view, so scalar UDF support isn’t confirmed.',
      },
      {
        claim: 'Materialized views in Fabric Data Warehouse.',
        why: 'The warehouse overview lists them as supported, but the T-SQL surface area page lists them under unsupported commands.',
      },
    ],
  },

  // ── Kusto Tension Meter ──────────────────────────────────────────────
  {
    machineId: 'tension-meter',
    overview: [
      {
        text: 'KQL (Kusto Query Language) is the query language of eventhouses and KQL databases. It reads top to bottom: start from a table and pipe it through operators that filter, shape, and aggregate. It is built for fast exploration of large, time-based event data.',
        sources: [KQL_OPERATORS, KQL_QUERYSET],
      },
    ],
    bullets: [
      {
        bulletId: 'P3.3',
        tools: ['eventhouse'],
        concepts: [
          {
            text: 'Core operators: where (filter rows), project (choose or compute columns), extend (add computed columns, keeping all others), summarize (aggregate by groups), sort/order by, top (first N by a column), take (sample rows), distinct, and count.',
            sources: [KQL_OPERATORS, KQL_SUMMARIZE],
          },
          {
            text: 'summarize groups rows by the by expressions and computes aggregations (count(), sum(), dcount(), min(), max(), and others) for each group. Use bin() to group numeric or datetime values into ranges, for example bin(Timestamp, 1h).',
            sources: [KQL_SUMMARIZE],
          },
          {
            text: 'Operator order matters: each operator transforms the output of the previous one, so top before where gives different results from where before top.',
            sources: [KQL_OPERATORS],
          },
        ],
        howTo: [
          {
            text: 'Write KQL in a KQL queryset (or the database’s query environment) attached to a KQL database. A queryset can also query Azure Data Explorer and Azure Monitor sources, and it supports many SQL functions.',
            sources: [KQL_QUERYSET],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Filter, shape, and aggregate events',
        language: 'kql',
        illustrative: true,
        steps: [
          {
            code: 'StormEvents',
            explain: 'Start from the table. Every following line pipes this result to the next operator.',
          },
          {
            code: "| where State == 'TEXAS' and EventType == 'Flood'",
            explain: 'Keep only Texas flood events (KQL string comparison with ==).',
          },
          {
            code: '| extend Duration = EndTime - StartTime',
            explain: 'Add a calculated Duration column while keeping all existing columns.',
          },
          {
            code: '| summarize Events = count(), MaxDamage = max(DamageProperty) by bin(StartTime, 30d)',
            explain: 'Group the events into 30-day buckets and count them, also returning the largest property damage per bucket.',
          },
          {
            code: '| sort by StartTime asc',
            explain: 'Sort ascending. Without asc, KQL sort defaults to descending.',
          },
        ],
        sources: [KQL_OPERATORS, KQL_SUMMARIZE],
      },
      {
        title: 'Filter rows and choose columns (where, project)',
        language: 'kql',
        illustrative: true,
        steps: [
          {
            code: "StormEvents\n| where StartTime between (datetime(2007-08-01) .. datetime(2007-08-30))",
            explain: 'where keeps only rows whose StartTime falls in August 1\u201330, 2007; between takes an inclusive range.',
          },
          {
            code: "| where State == 'TEXAS' and EventType == 'Flood'",
            explain: 'A second where narrows further. == is case-sensitive equality, and conditions combine with and.',
          },
          {
            code: '| project StartTime, EndTime, State, EventType, DamageProperty',
            explain: 'project returns only these five columns, in this order, like a SQL SELECT list.',
          },
        ],
        sources: [KQL_WHERE, KQL_PROJECT, KQL_OPERATORS],
      },
      {
        title: 'Add a calculated column and keep everything else (extend)',
        language: 'kql',
        illustrative: true,
        steps: [
          {
            code: "StormEvents\n| where State == 'TEXAS' and EventType == 'Flood'",
            explain: 'Start from Texas flood events.',
          },
          {
            code: '| extend Duration = EndTime - StartTime',
            explain: 'extend appends a Duration column (a timespan) and keeps all existing columns.',
          },
          {
            code: '| project StartTime, Duration, DamageProperty',
            explain: 'project trims the output to the columns you want to read, including the new one.',
          },
        ],
        sources: [KQL_EXTEND, KQL_OPERATORS],
      },
      {
        title: 'Count events per hour (summarize \u2026 by bin())',
        language: 'kql',
        illustrative: true,
        steps: [
          {
            code: 'StormEvents',
            explain: 'Start from the event table.',
          },
          {
            code: '| summarize EventCount = count() by bin(StartTime, 1h)',
            explain: 'bin() rounds each StartTime down to the hour, so summarize returns one row per hour with the number of events in it.',
          },
          {
            code: '| sort by StartTime asc',
            explain: 'Sort the hourly buckets oldest first; without asc the sort would be descending.',
          },
        ],
        sources: [KQL_SUMMARIZE, KQL_BIN, KQL_SORT],
      },
      {
        title: 'Rank rows (sort by vs top)',
        language: 'kql',
        illustrative: true,
        steps: [
          {
            code: 'StormEvents\n| sort by State asc, StartTime desc',
            explain: 'sort by (same as order by) orders by several columns: state A\u2013Z, newest storm first within each state.',
          },
          {
            code: 'StormEvents\n| top 3 by InjuriesDirect',
            explain: 'top returns the first 3 rows by InjuriesDirect, descending by default. It is equivalent to sort by InjuriesDirect | take 3.',
          },
        ],
        sources: [KQL_SORT, KQL_TOP],
      },
      {
        title: 'Preview a table quickly (take)',
        language: 'kql',
        illustrative: true,
        steps: [
          {
            code: 'StormEvents\n| take 5',
            explain: 'take returns up to 5 rows, with no guarantee which ones. Use it to look at the shape of the data, not to rank (take and limit are equivalent).',
          },
        ],
        sources: [KQL_TAKE],
      },
      {
        title: 'Combine two tables (join)',
        language: 'kql',
        illustrative: true,
        steps: [
          {
            code: 'StormEvents\n| summarize PropertyDamage = sum(DamageProperty) by State',
            explain: 'Total property damage per state from the events table.',
          },
          {
            code: '| join kind=inner PopulationData on State',
            explain: 'Join each state\u2019s total to PopulationData on the State column. kind=inner keeps only matching states; without kind the default flavor is innerunique.',
          },
          {
            code: '| project State, PropertyDamagePerCapita = PropertyDamage / Population\n| sort by PropertyDamagePerCapita',
            explain: 'Compute damage per person and sort descending by it (sort is descending by default).',
          },
        ],
        sources: [KQL_JOIN, KQL_JOIN_TUTORIAL],
      },
    ],
    traps: [
      {
        text: 'A KQL join without kind= uses innerunique, which de-duplicates the left side\u2019s keys first. It is not the same as an inner join. Specify kind=inner when you want every matching row.',
        sources: [KQL_JOIN],
      },
      {
        text: 'For best join performance, put the smaller table on the left side of a KQL join.',
        sources: [KQL_JOIN],
      },
      {
        text: 'sort in KQL is descending by default. Add asc for ascending.',
        sources: [KQL_OPERATORS],
      },
      {
        text: 'Automatic hourly bins for datetime columns in summarize are no longer supported. Use an explicit bin(), such as bin(Timestamp, 1h).',
        sources: [KQL_SUMMARIZE],
      },
      {
        text: 'Aggregations in summarize ignore null values.',
        sources: [KQL_SUMMARIZE],
      },
      {
        text: 'take returns arbitrary rows for a quick preview. Use top N by a column when you need a defined ranking.',
        sources: [KQL_OPERATORS],
      },
    ],
    dontConfuse: [
      {
        pairId: 'sql-vs-kql',
        a: 'SQL (WHERE, GROUP BY, SELECT, ORDER BY)',
        b: 'KQL (where, summarize \u2026 by, project, sort by)',
        difference: [
          {
            text: 'SQL WHERE ↔ KQL | where (equality is == in KQL, not =). SQL SELECT col list ↔ | project col list. SQL GROUP BY with aggregates ↔ | summarize agg() by cols (the grouping and the aggregation are one operator). SQL ORDER BY ↔ | sort by (or order by), and SELECT TOP n … ORDER BY ↔ | top n by. KQL reads top to bottom as a pipeline, starting from the table name rather than SELECT.',
            sources: [SQL_TO_KQL],
          },
          {
            text: 'In a KQL queryset you can prefix a SQL query with a comment line containing explain to see its KQL translation.',
            sources: [SQL_TO_KQL],
          },
        ],
      },
      {
        pairId: 'project-vs-extend',
        a: 'project',
        b: 'extend',
        difference: [
          {
            text: 'project returns only the columns you list (and can compute new ones). extend keeps every existing column and appends the new calculated columns at the end.',
            sources: [KQL_OPERATORS],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Kusto Query Language (KQL)',
        definition: 'The pipe-based query language for eventhouses, KQL databases, Azure Data Explorer, and Azure Monitor.',
        sources: [KQL_OPERATORS],
      },
      {
        term: 'KQL queryset',
        definition: 'A Fabric item for writing, saving, and running KQL queries against KQL databases and other Kusto-based sources.',
        sources: [KQL_QUERYSET, TERMS],
      },
      {
        term: 'summarize',
        definition: 'The KQL operator that groups rows by key expressions and computes aggregations per group.',
        sources: [KQL_SUMMARIZE],
      },
      {
        term: 'take',
        definition: 'A KQL operator that returns up to N arbitrary rows (same as limit). Good for previews, not for ranking.',
        sources: [KQL_TAKE],
      },
      {
        term: 'top (KQL)',
        definition: 'A KQL operator returning the first N rows by an expression, descending by default; equivalent to sort by … | take N.',
        sources: [KQL_TOP],
      },
      {
        term: 'join (KQL)',
        definition: 'A KQL operator that merges rows of two tables on matching columns. Flavors include innerunique (default), inner, leftouter, rightouter, fullouter, and anti or semi joins.',
        sources: [KQL_JOIN],
      },
      {
        term: 'bin()',
        definition: 'A KQL function that rounds values down into fixed-size buckets (for example 1h or 30d), used to group time series in summarize.',
        sources: [KQL_SUMMARIZE],
      },
    ],
    needsVerification: [],
  },

  // ── DAX Scale ────────────────────────────────────────────────────────
  {
    machineId: 'dax-scale',
    pl300Adds: [
      {
        text: 'PL-300 used DAX to write measures and calculated columns. DP-600 adds writing whole DAX queries (EVALUATE) to select, filter, and aggregate data from a semantic model, and running them in DAX query view (Desktop or the web), notebooks (semantic link), or tools like SSMS and DAX Studio.',
        sources: [DAX_QUERIES, DAX_QUERY_VIEW],
      },
    ],
    overview: [
      {
        text: 'Every Power BI visual sends a DAX query to the semantic model. Writing DAX queries yourself lets you inspect data, test measures before adding them to the model, and debug slow visuals. Performance Analyzer can show the query a visual generated.',
        sources: [DAX_QUERIES],
      },
    ],
    bullets: [
      {
        bulletId: 'P3.4',
        tools: ['semantic-model', 'power-bi-desktop', 'notebook'],
        concepts: [
          {
            text: 'A DAX query needs one keyword: EVALUATE followed by a table expression. That can be a table name, a table function (SUMMARIZECOLUMNS, FILTER, TOPN, SELECTCOLUMNS, and others), or a scalar wrapped in braces, such as EVALUATE {[Total Sales]}.',
            sources: [DAX_QUERIES],
          },
          {
            text: 'Optional keywords: DEFINE (query-scoped MEASURE and VAR definitions), ORDER BY, and START AT. There can be many EVALUATE statements but only one DEFINE block, and it must come first.',
            sources: [DAX_QUERIES],
          },
          {
            text: 'Select = choose the columns (SUMMARIZECOLUMNS group-by columns or SELECTCOLUMNS). Filter = add filter arguments or wrap the table in FILTER. Aggregate = name/expression pairs such as "Orders", [Orders].',
            sources: [DAX_QUERIES],
          },
        ],
        howTo: [
          {
            text: 'In Power BI Desktop, open DAX query view from the left rail. In the service or Fabric portal, choose Write DAX queries from the semantic model’s context menu or details page.',
            sources: [DAX_QUERY_VIEW],
          },
          {
            text: 'Measures defined with DEFINE MEASURE exist only for the query. Use the CodeLens "Update model" actions or the Update model with changes button to save them into the model.',
            sources: [DAX_QUERY_VIEW, DAX_QUERIES],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Select, filter, and aggregate with SUMMARIZECOLUMNS',
        language: 'dax',
        illustrative: true,
        steps: [
          {
            code: 'DEFINE\n  MEASURE Sales[Avg Profit per Order] = DIVIDE([Total Sales Profit], [Orders])',
            explain: 'Define a query-scoped measure. It overrides any model measure with the same name for this query only.',
          },
          {
            code: "EVALUATE\nSUMMARIZECOLUMNS(\n  'Date'[Month Name], 'Date'[Month of Year],",
            explain: 'Start the query. These are the group-by columns. Include Month of Year so you can sort by it later.',
          },
          {
            code: "  FILTER(VALUES('Product'[Category]), [Category] = \"Clothing\"),",
            explain: 'Filter argument: only rows for the Clothing category.',
          },
          {
            code: '  "Orders", [Orders],\n  "Avg Profit per Order", [Avg Profit per Order]\n)',
            explain: 'Aggregations: name/expression pairs evaluated for each group.',
          },
          {
            code: "ORDER BY 'Date'[Month of Year] ASC",
            explain: 'Sort the result. DAX queries ignore the model’s Sort by column setting, so the sort column must be in the query.',
          },
        ],
        sources: [DAX_QUERIES],
      },
    ],
    traps: [
      {
        text: 'Sort by column settings in the model don’t apply to DAX query results. Include the sort column in the query and ORDER BY it.',
        sources: [DAX_QUERIES],
      },
      {
        text: 'TOPN picks its rows by its own ordering argument, not by ORDER BY. ORDER BY only sorts the rows TOPN already returned.',
        sources: [DAX_QUERIES],
      },
      {
        text: 'Query-scoped TABLE and COLUMN definitions are for internal use and can cause runtime errors. Stick to MEASURE and VAR in DEFINE.',
        sources: [DAX_QUERIES],
      },
    ],
    dontConfuse: [
      {
        pairId: 'query-measure-vs-model-measure',
        a: 'DEFINE MEASURE (query-scoped)',
        b: 'Model measure',
        difference: [
          {
            text: 'A DEFINE MEASURE lives only while the query runs and doesn’t change the model, even when it overrides a model measure of the same name. A model measure is saved in the semantic model and used by every report. DAX query view can promote query measures into the model.',
            sources: [DAX_QUERIES, DAX_QUERY_VIEW],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'DAX query',
        definition: 'A DAX statement that returns a table, built from EVALUATE plus optional DEFINE, ORDER BY, and START AT.',
        sources: [DAX_QUERIES],
      },
      {
        term: 'EVALUATE',
        definition: 'The one required DAX query keyword. It runs a table expression and returns its result.',
        sources: [DAX_QUERIES],
      },
      {
        term: 'DAX query view',
        definition: 'An editor in Power BI Desktop and on the web (Write DAX queries) for writing and running DAX queries against a semantic model.',
        sources: [DAX_QUERY_VIEW],
      },
      {
        term: 'Semantic link',
        definition: 'Fabric notebook functionality that reads semantic model data and can run DAX queries from Python.',
        sources: [DAX_QUERIES],
      },
    ],
    needsVerification: [],
  },
]
