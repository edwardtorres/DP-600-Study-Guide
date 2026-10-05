import type { MachineNotes } from '../types'

const L = 'https://learn.microsoft.com/en-us/'
const OVERVIEW = `${L}fabric/fundamentals/microsoft-fabric-overview`
const TERMS = `${L}fabric/fundamentals/fabric-terminology`
const ONELAKE = `${L}fabric/onelake/onelake-overview`
const LICENSES = `${L}fabric/enterprise/licenses`
const WORKSPACES = `${L}fabric/fundamentals/workspaces`
const ROLES = `${L}fabric/fundamentals/roles-workspaces`
const THROTTLING = `${L}fabric/enterprise/throttling`
const TRIAL = `${L}fabric/fundamentals/fabric-trial`
const DECISION = `${L}fabric/fundamentals/decision-guide-data-store`
const LAKEHOUSE = `${L}fabric/data-engineering/lakehouse-overview`
const WAREHOUSE = `${L}fabric/data-warehouse/data-warehousing`
const EVENTHOUSE = `${L}fabric/real-time-intelligence/eventhouse`
const MEDALLION = `${L}fabric/onelake/onelake-medallion-lakehouse-architecture`
const DESKTOP = `${L}power-bi/fundamentals/desktop-get-the-desktop`

export const orientationNotes: MachineNotes[] = [
  {
    machineId: 'founding-charter',
    overview: [
      {
        text: 'Microsoft Fabric is one analytics platform for the whole data journey: getting data in, transforming it, processing streams, analyzing it, and reporting on it. It is sold as software as a service, so there are no servers or Azure resources for you to manage.',
        sources: [OVERVIEW],
      },
      {
        text: 'Fabric is split into workloads, each aimed at a role: Data Factory (data integration), Data Engineering (Apache Spark and notebooks), Data Warehouse (T-SQL), Data Science (machine learning), Real-Time Intelligence (streaming and event data), Databases (transactional SQL and Cosmos DB), Industry Solutions, Fabric IQ, and Power BI.',
        sources: [OVERVIEW, TERMS],
      },
      {
        text: 'Every workload shares the same storage layer, OneLake, and the same compute model. A table written by one engine (for example a warehouse using T-SQL) can be read by another (for example a Spark notebook) without copying it.',
        sources: [OVERVIEW, ONELAKE],
      },
      {
        text: 'Why it matters for an analytics engineer: DP-600 assumes you can move between these workloads. You prepare data with Data Factory, Spark, or T-SQL, store it in a lakehouse, warehouse, or eventhouse, and serve it to Power BI through a semantic model. Knowing which workload owns which item is the first step.',
        sources: [OVERVIEW],
      },
      {
        text: 'Everything you create in Fabric is an item: a lakehouse, notebook, warehouse, eventhouse, report, or semantic model. Items live in workspaces, and each workload provides its own item types.',
        sources: [TERMS],
      },
    ],
    bullets: [],
    examples: [],
    traps: [
      {
        text: 'Fabric IQ is labelled Preview on Learn and is not part of the DP-600 skills outline. Know it exists, but don’t expect it to be the focus of questions.',
        sources: [OVERVIEW],
      },
      {
        text: 'You don’t need an Azure subscription or account to use Fabric. OneLake hides storage details like resource groups and regions.',
        sources: [OVERVIEW],
      },
      {
        text: 'A data pipeline (a Data Factory item that orchestrates data movement) is not the same thing as a deployment pipeline (the lifecycle tool that promotes content between stages). Learn calls this out directly.',
        sources: [TERMS],
      },
    ],
    dontConfuse: [
      {
        pairId: 'workload-vs-item',
        a: 'Workload',
        b: 'Item',
        difference: [
          {
            text: 'A workload is a group of capabilities for one kind of work, such as Data Engineering. An item is a concrete object you create inside a workspace, such as a lakehouse or notebook. A workload provides several item types.',
            sources: [TERMS],
          },
        ],
      },
    ],
    renamed: [],
    preview: [
      {
        feature: 'Fabric IQ',
        note: 'A workload for unifying business semantics (ontology, planning, Fabric Graph, data agents). Labelled "(preview)" on the Fabric overview page.',
        sources: [OVERVIEW],
      },
    ],
    upcoming: [],
    glossary: [
      {
        term: 'Microsoft Fabric',
        definition: 'A software-as-a-service analytics platform that covers ingestion, transformation, real-time processing, analytics, and reporting over shared storage (OneLake).',
        sources: [OVERVIEW],
      },
      {
        term: 'Workload',
        definition: 'A collection of Fabric capabilities aimed at one kind of work, for example Data Engineering, Data Factory, Data Warehouse, Real-Time Intelligence, or Power BI.',
        sources: [TERMS],
      },
      {
        term: 'Item',
        definition: 'An object you create in Fabric, such as a lakehouse, notebook, warehouse, eventhouse, report, or semantic model.',
        sources: [TERMS],
      },
      {
        term: 'Delta Lake',
        definition: 'The standard table format across Fabric workloads. Data ingested into Fabric is stored as Delta tables by default (Parquet files plus a transaction log).',
        sources: [TERMS, WAREHOUSE],
      },
    ],
    needsVerification: [],
  },

  {
    machineId: 'water-wheel',
    overview: [
      {
        text: 'Three platform concepts sit under every Fabric item: OneLake (where data is stored), capacities (the compute you pay for), and workspaces (where items are organized and secured).',
        sources: [ONELAKE, LICENSES],
      },
      {
        text: 'OneLake is one data lake for the whole organization. Each tenant gets exactly one, created automatically; you can’t delete it or create a second one. It is built on Azure Data Lake Storage Gen2 and stores tables in open formats (Delta Parquet or Iceberg).',
        sources: [ONELAKE],
      },
      {
        text: 'Data is organized in a hierarchy: tenant at the root, then workspaces (like folders), then items such as lakehouses, warehouses, and eventhouses. Fabric domains can group workspaces into business areas above that.',
        sources: [ONELAKE, TERMS],
      },
      {
        text: 'A capacity is a pool of compute in your tenant. Its size, measured in capacity units (CUs), sets how much compute is available. Fabric capacities are F SKUs bought through Azure and billed per second. Older Power BI Premium P SKUs also run Fabric, but Microsoft is retiring them.',
        sources: [LICENSES, TERMS],
      },
      {
        text: 'A workspace is a container for items that runs on a capacity and controls who can access its contents. Access is granted through four workspace roles: Admin, Member, Contributor, and Viewer. Every user also has a personal My workspace.',
        sources: [WORKSPACES, ROLES, LICENSES],
      },
      {
        text: 'Why it matters: storage location, compute cost, and access all depend on these three. Many DP-600 security, lifecycle, and Direct Lake questions assume you know which workspace and capacity an item sits in.',
        sources: [LICENSES],
      },
    ],
    bullets: [],
    examples: [],
    traps: [
      {
        text: 'To view Power BI content with only a free Fabric license, the workspace must be on an F64 or larger capacity and you need the Viewer role. On F SKUs smaller than F64, every viewer of Power BI content needs Pro, PPU, or an individual trial license.',
        sources: [LICENSES],
      },
      {
        text: 'A Power BI Premium Per User (PPU) workspace is not a Fabric capacity. It can’t create non-Power BI Fabric items such as lakehouses unless an F capacity is also involved.',
        sources: [LICENSES],
      },
      {
        text: 'Creating Power BI items in a workspace other than My workspace needs a Pro license, even on a capacity.',
        sources: [LICENSES],
      },
      {
        text: 'Capacity overload doesn’t throttle immediately. Fabric bursts and smooths usage: interactive operations are smoothed over 5 to 64 minutes and background operations over 24 hours. Throttling escalates in stages: delays first, then interactive rejection, then all requests are rejected.',
        sources: [THROTTLING],
      },
      {
        text: 'Throttling applies per capacity. One overloaded capacity doesn’t slow workspaces on other capacities.',
        sources: [THROTTLING],
      },
    ],
    dontConfuse: [
      {
        pairId: 'capacity-vs-workspace',
        a: 'Capacity',
        b: 'Workspace',
        difference: [
          {
            text: 'A capacity is compute (CUs) you buy and that gets throttled. A workspace is a container for items and access roles. A workspace is assigned to one capacity, and a capacity can host many workspaces.',
            sources: [LICENSES, ONELAKE],
          },
        ],
      },
    ],
    renamed: [
      {
        oldName: 'License mode',
        newName: 'Workspace type',
        examLikely:
          'Unclear. The DP-600 study guide uses neither term, so recognize both. Current Learn pages say "workspace type".',
        note: 'Learn states this is a terminology change only; functionality is the same.',
        sources: [LICENSES],
      },
    ],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'OneLake',
        definition: 'The single, tenant-wide logical data lake in Fabric, built on Azure Data Lake Storage Gen2. Every workload stores and reads its data there.',
        sources: [ONELAKE],
      },
      {
        term: 'Tenant',
        definition: 'One instance of Fabric for an organization, aligned with a Microsoft Entra tenant. It maps to the root of OneLake.',
        sources: [TERMS, OVERVIEW],
      },
      {
        term: 'Capacity',
        definition: 'A dedicated pool of compute in a tenant. Workspaces are assigned to a capacity, and the capacity size sets how much work they can run.',
        sources: [LICENSES, TERMS],
      },
      {
        term: 'Capacity unit (CU)',
        definition: 'The unit of compute in Fabric. Every operation consumes CUs from the capacity. Consumption is classed as interactive or background.',
        sources: [TERMS],
      },
      {
        term: 'F SKU',
        definition: 'A Fabric capacity size bought through Azure (F2 up to F8192), billed per second with no commitment. Learn recommends F SKUs for Fabric.',
        sources: [LICENSES],
      },
      {
        term: 'Workspace',
        definition: 'A collaboration container for items that runs on a capacity and controls access through roles (Admin, Member, Contributor, Viewer).',
        sources: [TERMS, ROLES],
      },
      {
        term: 'Domain',
        definition: 'A grouping of workspaces into a business area (such as Finance) so admins can delegate management and apply governance above the workspace level.',
        sources: [TERMS],
      },
      {
        term: 'Smoothing',
        definition: 'Fabric spreads an operation’s CU usage over future 30-second timepoints (minutes for interactive work, 24 hours for background work) so short spikes don’t cause throttling.',
        sources: [THROTTLING],
      },
      {
        term: 'Throttling',
        definition: 'What a capacity does when it has used up future CUs: first it delays interactive operations, then it rejects them, then it rejects all new requests.',
        sources: [THROTTLING],
      },
    ],
    needsVerification: [],
  },

  {
    machineId: 'three-vats',
    overview: [
      {
        text: 'Fabric has several places to store analytical data. DP-600 focuses on three: the lakehouse, the warehouse, and the eventhouse. All three keep their data in OneLake. They differ in how you write to them, how you query them, and what kind of data they suit.',
        sources: [DECISION],
      },
      {
        text: 'A lakehouse combines a data lake with SQL querying. It holds structured and unstructured data as files and Delta tables. You build it mainly with Apache Spark (notebooks), and every lakehouse gets a read-only SQL analytics endpoint for T-SQL queries.',
        sources: [LAKEHOUSE],
      },
      {
        text: 'A warehouse is a relational data warehouse developed with T-SQL. It has full DDL and DML support and multi-table ACID transactions. It suits star or snowflake schemas and curated data marts for BI.',
        sources: [WAREHOUSE],
      },
      {
        text: 'An eventhouse is built for streaming, time-based event data such as telemetry, logs, IoT readings, and time series. It can hold structured, semistructured (JSON, XML), and free-text data, and it contains one or more KQL databases that you query with KQL.',
        sources: [EVENTHOUSE, TERMS],
      },
      {
        text: 'Why it matters: the outline asks you to choose between data stores (Vat Selector) and to implement star schemas, views, and procedures in the right one. Most of these questions come down to what each store can write and query.',
        sources: [DECISION],
      },
    ],
    bullets: [],
    examples: [],
    traps: [
      {
        text: 'The SQL analytics endpoint of a lakehouse is read-only for data. T-SQL there can define and query objects, but it can’t INSERT, UPDATE, or DELETE. To change lakehouse data, use Spark, pipelines, or dataflows.',
        sources: [WAREHOUSE, LAKEHOUSE],
      },
      {
        text: 'Only Delta tables show up in the SQL analytics endpoint. Parquet or CSV files in the Files area can’t be queried there until converted to Delta.',
        sources: [LAKEHOUSE],
      },
      {
        text: 'Multi-table transactions are a warehouse feature. A lakehouse doesn’t support them.',
        sources: [LAKEHOUSE],
      },
      {
        text: 'Lakehouse and warehouse data are in OneLake in Delta format by default. For a KQL database in an eventhouse, OneLake availability is opt-in.',
        sources: [DECISION],
      },
      {
        text: 'Since September 5, 2025, creating a lakehouse no longer creates a default semantic model automatically. Older study material that mentions a "default semantic model" is out of date.',
        sources: [LAKEHOUSE],
      },
    ],
    dontConfuse: [
      {
        pairId: 'stores',
        a: 'Lakehouse vs warehouse',
        b: 'Eventhouse',
        difference: [
          {
            text: 'Write: a lakehouse is written by Spark notebooks, pipelines, Dataflow Gen2, and shortcuts. A warehouse is written by T-SQL (COPY INTO, INSERT, CREATE TABLE AS SELECT), pipelines, and dataflows. An eventhouse ingests streams from Eventstream, Kafka, SDKs, pipelines, and dataflows.',
            sources: [LAKEHOUSE, WAREHOUSE, EVENTHOUSE],
          },
          {
            text: 'Query: a lakehouse is queried with Spark (Python, Scala, SQL, R) and read-only T-SQL through its SQL analytics endpoint. A warehouse is queried with full T-SQL. An eventhouse is queried mainly with KQL (T-SQL is also listed).',
            sources: [LAKEHOUSE, WAREHOUSE, DECISION],
          },
          {
            text: 'Store: a lakehouse holds structured and unstructured data (tables plus files). A warehouse holds structured tables. An eventhouse holds time-based event data, including semistructured and free text, organized by arrival time.',
            sources: [LAKEHOUSE, EVENTHOUSE],
          },
          {
            text: 'Best for: lakehouse for data engineering, data science, and medallion architectures. Warehouse for BI reporting, dimensional modeling, and SQL-first teams. Eventhouse for streaming, high-granularity, interactive analytics over events.',
            sources: [LAKEHOUSE, DECISION],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Lakehouse',
        definition: 'A Fabric item that is a database over a data lake: files, folders, and Delta tables, used by both Spark and the SQL engine.',
        sources: [TERMS, LAKEHOUSE],
      },
      {
        term: 'Warehouse',
        definition: 'A Fabric item that works like a traditional data warehouse, with full transactional T-SQL (DDL and DML) over Delta tables in OneLake.',
        sources: [TERMS, WAREHOUSE],
      },
      {
        term: 'Eventhouse',
        definition: 'A Fabric item for storing and analyzing large volumes of real-time, time-based event data. It contains one or more KQL databases.',
        sources: [TERMS, EVENTHOUSE],
      },
      {
        term: 'KQL database',
        definition: 'A database inside an eventhouse that holds tables you query with Kusto Query Language (KQL).',
        sources: [TERMS],
      },
      {
        term: 'SQL analytics endpoint',
        definition: 'An automatically created, read-only T-SQL surface over Delta tables (for example a lakehouse’s tables). You can create views, inline table-valued functions, and procedures there, and manage permissions, but you can’t modify data.',
        sources: [TERMS, WAREHOUSE],
      },
      {
        term: 'Medallion architecture',
        definition: 'A three-layer lakehouse design: bronze (raw data, stored as it arrives), silver (enriched: errors fixed, formats standardized, duplicates removed), and gold (curated for reports).',
        sources: [MEDALLION, LAKEHOUSE],
      },
    ],
    needsVerification: [],
  },

  {
    machineId: 'mill-lease',
    overview: [
      {
        text: 'You learn Fabric fastest by using it. The Fabric trial gives you a free trial capacity for 60 days so you can build lakehouses, warehouses, notebooks, pipelines, and reports for the hands-on labs in Step 6.',
        sources: [TRIAL],
      },
      {
        text: 'The trial capacity is an F4 (4 CUs) or F64 (64 CUs). It comes with a Power BI individual trial if you don’t already have a Premium Per User license, and it allows up to 1 TB of OneLake storage.',
        sources: [TRIAL],
      },
      {
        text: 'Three ways to start one: start a trial from the Account manager, try to use a Fabric feature (this triggers a trial), or join a coworker’s trial capacity if they give you Contributor permission on it. The first two make you the capacity administrator.',
        sources: [TRIAL],
      },
      {
        text: 'To use it, create a workspace and set its workspace type to Trial. Everything in that workspace then runs on the trial capacity.',
        sources: [TRIAL],
      },
      {
        text: 'Platform note: the trial is used through the Fabric portal in a browser. Power BI Desktop, which you need for some later labs (for example .pbip projects), lists Windows 10 or later in its system requirements, so those labs need a Windows machine.',
        sources: [TRIAL, DESKTOP],
      },
    ],
    bullets: [],
    examples: [],
    traps: [
      {
        text: 'Not everything is in the trial: Copilot, Trusted Workspace Access, AI experiences such as data agents and AI functions, and Private Link are unavailable.',
        sources: [TRIAL],
      },
      {
        text: 'When the trial ends, its workspaces revert to Pro, non-Power BI items like notebooks and pipelines become inactive, and content stays in OneLake for 7 days. Reassign the workspace to a paid F or P capacity within that window to keep it.',
        sources: [TRIAL],
      },
      {
        text: 'Pick the trial region carefully. Moving a workspace with Fabric items to another region later means deleting those items first.',
        sources: [TRIAL],
      },
      {
        text: 'If you don’t see "Start trial" in the Account manager, trials may be disabled for your tenant. That is an admin setting, not a problem with your account.',
        sources: [TRIAL],
      },
    ],
    dontConfuse: [
      {
        pairId: 'fabric-trial-vs-pbi-trial',
        a: 'Fabric trial capacity',
        b: 'Power BI individual trial',
        difference: [
          {
            text: 'The Fabric trial is a capacity (F4 or F64) that workspaces run on. The Power BI individual trial is a per-user license. Starting a Fabric trial also gives you a Power BI individual trial if you don’t already have a paid Power BI license.',
            sources: [TRIAL],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Fabric trial capacity',
        definition: 'A free F4 or F64 capacity that lasts 60 days, for exploring Fabric workloads. Workspaces use it when their workspace type is set to Trial.',
        sources: [TRIAL],
      },
      {
        term: 'Capacity administrator',
        definition: 'The person who manages a capacity, including who may assign workspaces to it. Whoever starts a Fabric trial becomes its capacity administrator.',
        sources: [TRIAL],
      },
      {
        term: 'My workspace',
        definition: 'Each user’s personal workspace. By default it sits on the tenant’s shared capacity but can be assigned to another capacity.',
        sources: [LICENSES],
      },
    ],
    needsVerification: [
      {
        claim: 'The trial capacity size: "F4 or F64" (trial page) vs only "64 capacity units" (licenses page SKU table).',
        why: 'Raised by the Step 3 question reviewer. Learn pages disagree; no question depends on the trial size until Step 8 resolves it.',
      },
      {
        claim: 'The trial page lists "Real-Time Analytics" as a workload, while the Fabric overview says "Real-Time Intelligence".',
        why: 'No Learn page found that states the rename explicitly. Confirm in Step 8 before listing it as a renamed feature.',
      },
    ],
  },
]
