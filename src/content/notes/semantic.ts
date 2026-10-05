import type { MachineNotes } from '../types'

const L = 'https://learn.microsoft.com/en-us/'
const MODES = `${L}power-bi/connect-data/service-dataset-modes-understand`
const STORAGE_MODE = `${L}power-bi/transform-model/desktop-storage-mode`
const DIRECT_LAKE = `${L}fabric/fundamentals/direct-lake-overview`
const DL_HOW = `${L}fabric/fundamentals/direct-lake-how-it-works`
const DL_ANALYZE = `${L}fabric/fundamentals/direct-lake-analyze-query-processing`
const COMPOSITE = `${L}power-bi/transform-model/desktop-composite-models`
const STAR = `${L}power-bi/guidance/star-schema`
const MANY_TO_MANY = `${L}power-bi/guidance/relationships-many-to-many`
const RELATIONSHIPS = `${L}power-bi/transform-model/desktop-relationships-understand`
const CALC_GROUPS = `${L}power-bi/transform-model/calculation-groups`
const DYNAMIC_FORMAT = `${L}power-bi/create-reports/desktop-dynamic-format-strings`
const FIELD_PARAMS = `${L}power-bi/create-reports/power-bi-field-parameters`
const LARGE_MODELS = `${L}fabric/enterprise/powerbi/service-premium-large-models`
const VAR_REF = `${L}dax/var-dax`
const VAR_BP = `${L}dax/best-practices/dax-variables`
const WINDOW = `${L}dax/window-function-dax`
const OFFSET = `${L}dax/offset-function-dax`
const INFO_FUNCS = `${L}dax/information-functions-dax`
const FILTER_FUNCS = `${L}dax/filter-functions-dax`
const SUMX = `${L}dax/sumx-function-dax`
const CALCULATE = `${L}dax/calculate-function-dax`
const ISINSCOPE = `${L}dax/isinscope-function-dax`
const HASONEVALUE = `${L}dax/hasonevalue-function-dax`
const SELECTEDVALUE = `${L}dax/selectedvalue-function-dax`
const PERF_ANALYZER = `${L}power-bi/create-reports/performance-analyzer`
const OPTIMIZATION = `${L}power-bi/guidance/power-bi-optimization`
const DATA_REDUCTION = `${L}power-bi/guidance/import-modeling-data-reduction`
const BP_FILTER = `${L}dax/best-practices/dax-avoid-avoid-filter-as-filter-argument`
const BP_DIVIDE = `${L}dax/best-practices/dax-divide-function-operator`
const BP_COUNTROWS = `${L}dax/best-practices/dax-countrows`
const INCREMENTAL = `${L}power-bi/connect-data/incremental-refresh-overview`
const INCREMENTAL_CFG = `${L}power-bi/connect-data/incremental-refresh-configure`
const SEMANTIC_MODELS = `${L}fabric/data-warehouse/semantic-models`
const DAX_QUERY_VIEW = `${L}power-bi/transform-model/dax-query-view`
const DIM_OVERVIEW = `${L}fabric/data-warehouse/dimensional-modeling-overview`
const TERMS = `${L}fabric/fundamentals/fabric-terminology`

export const semanticNotes: MachineNotes[] = [
  // ── Loom Gearbox ─────────────────────────────────────────────────────
  {
    machineId: 'loom-gearbox',
    pl300Adds: [
      {
        text: 'PL-300 compared Import, DirectQuery, and Dual. DP-600 adds Direct Lake: a Fabric-only storage mode that reads Delta tables from OneLake into the VertiPaq engine without copying data. It comes in two flavors, Direct Lake on OneLake and Direct Lake on SQL analytics endpoints.',
        sources: [DIRECT_LAKE],
      },
      {
        text: 'You also need to know Fabric capacity guardrails (Parquet files, row groups, rows, model size per SKU) and how each mode is licensed. Direct Lake needs a Fabric capacity; Import and DirectQuery work with any license.',
        sources: [DIRECT_LAKE],
      },
    ],
    overview: [
      {
        text: 'A semantic model table’s storage mode decides where the data lives at query time and which engine answers. That drives performance, freshness, refresh cost, and which features you can use. Storage mode is set per table; a model that mixes modes is a composite model.',
        sources: [DIRECT_LAKE, MODES],
      },
    ],
    bullets: [
      {
        bulletId: 'S1.1',
        tools: ['semantic-model', 'power-bi-desktop', 'lakehouse', 'warehouse'],
        concepts: [
          {
            text: 'Import: data is copied, compressed, and held in memory by VertiPaq. Fast queries and full DAX and Power Query, but data is only as fresh as the last refresh, and a full refresh reloads everything.',
            sources: [MODES],
          },
          {
            text: 'DirectQuery: the model holds only metadata, and each query is translated to native queries against the source. Freshest data and no size limit, but slower and limited to M and DAX that can be translated. Calculated tables aren’t supported.',
            sources: [MODES],
          },
          {
            text: 'Dual: the table can act as Import or DirectQuery, and the engine picks per query. It is typically used for dimension tables in a composite model so relationships with DirectQuery facts stay regular.',
            sources: [MODES, STORAGE_MODE],
          },
          {
            text: 'Direct Lake: VertiPaq loads only the columns a query needs, straight from Delta tables in OneLake. Its "refresh" is framing (a metadata update that takes seconds), not a data copy. Learn says it suits large lakehouses and warehouses, and is especially useful when importing the whole volume is impractical.',
            sources: [DIRECT_LAKE, DL_HOW],
          },
        ],
        howTo: [
          {
            text: 'Pick by scenario. Self-service, agile, Power Query prep → Import. Near-real-time or huge external sources → DirectQuery. Large Fabric data already prepared as Delta → Direct Lake. Mix where needed → composite.',
            sources: [DIRECT_LAKE, MODES],
          },
          {
            text: 'For most tables you set the storage mode when you add the table. You can change a DirectQuery table to Import or Dual but not back (except in web modeling or live editing, which have version control). Direct Lake on OneLake tables can be converted to Import with semantic link labs in a notebook.',
            sources: [STORAGE_MODE],
          },
          {
            text: 'If you can’t modify the lakehouse (for example, an analyst without write permission), Learn suggests adding Import tables, because Import supports Power Query data preparation inside the model.',
            sources: [DIRECT_LAKE],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'Import and Direct Lake are both answered by VertiPaq. DirectQuery is the one that federates queries to the source.',
        sources: [DIRECT_LAKE],
      },
      {
        text: 'Scheduled refresh limits for Import are 8 per day on shared capacity and 48 per day on Premium.',
        sources: [MODES],
      },
      {
        text: 'Direct Lake doesn’t support hybrid tables or model-level partitions. Partition at the Delta table level instead.',
        sources: [DIRECT_LAKE],
      },
      {
        text: 'Default semantic models are gone: since September 5, 2025 they’re no longer created with a warehouse, lakehouse, or mirrored item, and existing ones were decoupled by November 30, 2025. Questions that assume an automatic model are outdated.',
        sources: [SEMANTIC_MODELS],
      },
    ],
    dontConfuse: [
      {
        pairId: 'storage-modes',
        a: 'Import vs DirectQuery',
        b: 'Direct Lake vs composite',
        difference: [
          {
            text: 'Import: copy into VertiPaq, refresh to update, any license. DirectQuery: no copy, native queries to the source each time, any license. Direct Lake: no copy, VertiPaq pages columns in from OneLake Delta tables and framing updates metadata, Fabric capacity required. Composite: not a separate engine but a model whose tables use different modes (Import, DirectQuery, Dual, Direct Lake).',
            sources: [DIRECT_LAKE, MODES],
          },
          {
            text: 'Refresh: Import refresh copies data (minutes to hours). Direct Lake refresh is framing (seconds, metadata only). DirectQuery needs no data refresh.',
            sources: [DIRECT_LAKE, MODES],
          },
        ],
      },
    ],
    renamed: [
      {
        oldName: 'Power BI dataset',
        newName: 'Semantic model',
        examLikely: '"Semantic model". The current study guide uses it throughout.',
        note: 'Microsoft renamed the dataset content type to semantic model in Power BI and Fabric. Older Learn pages and UI strings may still say "dataset".',
        sources: [SEMANTIC_MODELS],
      },
    ],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Semantic model',
        definition: 'The metadata layer of tables, relationships, measures, and data connections that Power BI reports query. Formerly called a dataset.',
        sources: [TERMS, SEMANTIC_MODELS],
      },
      {
        term: 'Storage mode',
        definition: 'A per-table property of a semantic model (Import, DirectQuery, Dual, Direct Lake) that decides how the table’s data is stored and queried.',
        sources: [DIRECT_LAKE, STORAGE_MODE],
      },
      {
        term: 'Import mode',
        definition: 'A storage mode that copies data into the model’s compressed in-memory VertiPaq store. Refresh is needed to update it.',
        sources: [MODES],
      },
      {
        term: 'DirectQuery',
        definition: 'A storage mode that stores no data and sends native queries to the source each time the model is queried.',
        sources: [MODES],
      },
      {
        term: 'Dual storage mode',
        definition: 'A table that can behave as Import or DirectQuery, with the engine choosing per query. It keeps relationships regular in composite models.',
        sources: [MODES, STORAGE_MODE],
      },
      {
        term: 'Direct Lake',
        definition: 'A Fabric storage mode in which VertiPaq loads Delta table columns directly from OneLake on demand, without importing or using DirectQuery.',
        sources: [DIRECT_LAKE, TERMS],
      },
      {
        term: 'VertiPaq',
        definition: 'The in-memory columnar engine that answers queries for Import and Direct Lake tables.',
        sources: [DIRECT_LAKE],
      },
    ],
    needsVerification: [],
  },

  // ── Warp Frame ───────────────────────────────────────────────────────
  {
    machineId: 'warp-frame',
    pl300Adds: [
      {
        text: 'You know star schemas and one-to-many relationships from PL-300. DP-600 goes further with many-to-many designs: bridging tables for many-to-many dimensions, many-to-many cardinality for higher-grain facts such as targets, and regular vs limited relationships, which matter in composite and Fabric models.',
        sources: [MANY_TO_MANY, RELATIONSHIPS],
      },
      {
        text: 'The semantic model’s star often sits on a star already built in the warehouse or lakehouse. Learn calls a warehouse dimensional model a recommended prerequisite for enterprise semantic models.',
        sources: [DIM_OVERVIEW],
      },
    ],
    overview: [
      {
        text: 'The semantic model’s tables and relationships decide how filters flow and whether measures add up correctly. A clean star (facts in the middle, dimensions around, one-to-many single-direction relationships) is the default. Many-to-many cases need deliberate patterns.',
        sources: [STAR, MANY_TO_MANY],
      },
    ],
    bullets: [
      {
        bulletId: 'S1.2',
        tools: ['semantic-model', 'power-bi-desktop'],
        concepts: [
          {
            text: 'Classify each model table as a fact table (events, measures to summarize) or a dimension table (attributes to filter and group by), and relate them with one-to-many relationships from dimension to fact.',
            sources: [STAR],
          },
          {
            text: 'Role-playing dimensions: one dimension (usually Date) relates to a fact several ways (order date, ship date). Only one relationship between two tables can be active; the others are inactive and used through USERELATIONSHIP in measures.',
            sources: [STAR],
          },
          {
            text: 'Prefer explicit measures (DAX) over implicit ones. MDX clients such as Analyze in Excel need explicit measures, and calculation groups require them.',
            sources: [STAR, CALC_GROUPS],
          },
        ],
        howTo: [
          {
            text: 'In model view, create relationships on matching key columns with the same data type, set cardinality (one-to-many in a star), and keep cross-filter direction single unless a pattern needs Both.',
            sources: [RELATIONSHIPS, STAR],
          },
          {
            text: 'Flatten snowflaked dimensions into single tables (or views upstream) so hierarchies can be built from one table.',
            sources: [STAR],
          },
        ],
      },
      {
        bulletId: 'S1.3',
        tools: ['semantic-model', 'power-bi-desktop'],
        concepts: [
          {
            text: 'Many-to-many dimensions (for example customers and joint bank accounts): don’t relate the dimensions directly. Add a bridging table holding the pairs, relate it with two one-to-many relationships, and set one of them to Both so filters reach the fact table.',
            sources: [MANY_TO_MANY],
          },
          {
            text: 'Higher-grain facts (for example targets by category and month): relate the date part through the Date table, and for a non-date column such as Category use a many-to-many relationship that filters in a single direction, from dimension to fact.',
            sources: [MANY_TO_MANY],
          },
          {
            text: 'Regular vs limited relationships: a relationship is regular when the engine can confirm a unique "one" side. It is limited when the cardinality is many-to-many or when it crosses source groups in a composite model.',
            sources: [RELATIONSHIPS],
          },
        ],
        howTo: [
          {
            text: 'Bridge pattern: add each entity with its ID column, add the bridging table, create the one-to-many relationships, set one to bi-directional, and hide the bridge unless it has reporting columns.',
            sources: [MANY_TO_MANY],
          },
          {
            text: 'Avoid relating two fact tables directly with many-to-many. Learn says it limits how visuals can filter and group, and it can hide data quality issues.',
            sources: [MANY_TO_MANY],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'Balances or totals reached through a bridge are non-additive. A customer’s balance across joint accounts doesn’t sum to the grand total.',
        sources: [MANY_TO_MANY],
      },
      {
        text: 'Limited relationships use inner-join semantics and no blank "unknown" row is added, so unmatched rows silently disappear. RELATED can’t be used across a limited relationship.',
        sources: [RELATIONSHIPS],
      },
      {
        text: 'Both sides of a relationship should have the same data type, and Direct Lake requires matching types. A one-side column with duplicates makes Direct Lake queries fail.',
        sources: [RELATIONSHIPS, DIRECT_LAKE],
      },
      {
        text: 'A column can’t be related to another column in the same table. Parent-child hierarchies need a different technique.',
        sources: [RELATIONSHIPS],
      },
    ],
    dontConfuse: [
      {
        pairId: 'regular-vs-limited',
        a: 'Regular relationship',
        b: 'Limited relationship',
        difference: [
          {
            text: 'Regular: a guaranteed unique "one" side, table expansion with LEFT OUTER JOIN semantics, a blank row added for missing keys, and RELATED works. Limited: many-to-many cardinality or a cross source group relationship, INNER JOIN at query time, no blank row, no RELATED, and RLS topology restrictions.',
            sources: [RELATIONSHIPS],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Bridging table',
        definition: 'A table that stores pairs of keys to resolve a many-to-many relationship between two dimensions with two one-to-many relationships.',
        sources: [MANY_TO_MANY],
      },
      {
        term: 'Regular relationship',
        definition: 'A relationship where the engine can confirm the "one" side is unique (for example one-to-many inside one source group).',
        sources: [RELATIONSHIPS],
      },
      {
        term: 'Limited relationship',
        definition: 'A relationship without a guaranteed unique "one" side (many-to-many, or cross source group). It is resolved with inner-join semantics at query time.',
        sources: [RELATIONSHIPS],
      },
      {
        term: 'Role-playing dimension',
        definition: 'One dimension that filters a fact in several roles (for example Date as order, ship, and delivery date), with one active relationship and the rest inactive.',
        sources: [STAR],
      },
      {
        term: 'Disconnected table',
        definition: 'A model table with no relationships, used to accept user input (for example from a slicer) for calculations.',
        sources: [RELATIONSHIPS],
      },
      {
        term: 'Explicit measure',
        definition: 'A measure defined with a DAX formula, as opposed to an implicit measure created by summarizing a column in a visual.',
        sources: [STAR],
      },
    ],
    needsVerification: [],
  },

  // ── Punch-Card Reader ────────────────────────────────────────────────
  {
    machineId: 'punch-card-reader',
    pl300Adds: [
      {
        text: 'PL-300 covered CALCULATE, time intelligence, and basic measures. DP-600 names more families: variables (VAR/RETURN), iterators (the X functions), table filtering, window functions (WINDOW, OFFSET, INDEX with ORDERBY and PARTITIONBY), and information functions (ISINSCOPE, HASONEVALUE, SELECTEDMEASURE, and others).',
        sources: [VAR_BP, WINDOW, INFO_FUNCS, FILTER_FUNCS],
      },
    ],
    overview: [
      {
        text: 'Most business logic in a semantic model lives in DAX measures. Writing them well, with readable variables, the right iterator, precise filters, and context-aware logic, is the core skill of the Loom Hall.',
        sources: [VAR_BP, CALCULATE],
      },
    ],
    bullets: [
      {
        bulletId: 'S1.4',
        tools: ['semantic-model', 'power-bi-desktop'],
        concepts: [
          {
            text: 'Variables: VAR names a value or table and RETURN gives the result. A variable is evaluated once, outside the filters the RETURN expression applies, which improves performance, readability, and debugging. It also replaces the old EARLIER pattern.',
            sources: [VAR_BP, VAR_REF],
          },
          {
            text: 'Iterators: functions like SUMX evaluate an expression for each row of a table and then aggregate. Use SUM when you only need a plain column total.',
            sources: [SUMX],
          },
          {
            text: 'Table filtering: CALCULATE changes filter context with Boolean filter expressions, table expressions (often FILTER), or modifier functions (ALL, REMOVEFILTERS, KEEPFILTERS, ALLSELECTED, and others).',
            sources: [CALCULATE, FILTER_FUNCS],
          },
          {
            text: 'Window functions: WINDOW returns rows in an interval around the current row (relative or absolute), OFFSET returns the row a given distance before or after, and INDEX returns a row by position. All of them take ORDERBY and PARTITIONBY. Related functions include RANK, ROWNUMBER, RUNNINGSUM, and MOVINGAVERAGE.',
            sources: [WINDOW, OFFSET, FILTER_FUNCS],
          },
          {
            text: 'Information functions inspect context and values: ISINSCOPE (is this hierarchy level being grouped?), HASONEVALUE (is the column filtered to one value?), ISFILTERED, ISBLANK, and SELECTEDMEASURE (used inside calculation groups). SELECTEDVALUE (a filter function) returns the single value or an alternate result.',
            sources: [INFO_FUNCS, ISINSCOPE, HASONEVALUE, SELECTEDVALUE],
          },
        ],
        howTo: [
          {
            text: 'Write measures in Power BI Desktop, in web modeling, or in DAX query view with DEFINE MEASURE, then add them to the model with the Update model options.',
            sources: [DAX_QUERY_VIEW],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Year-over-year growth with a variable',
        language: 'dax',
        illustrative: true,
        steps: [
          {
            code: 'Sales YoY Growth % =\nVAR SalesPriorYear =\n    CALCULATE([Sales], PARALLELPERIOD(\'Date\'[Date], -12, MONTH))',
            explain: 'Calculate last year’s sales once and store it in a variable instead of repeating the expression.',
          },
          {
            code: 'RETURN\n    DIVIDE([Sales] - SalesPriorYear, SalesPriorYear)',
            explain: 'Use the variable twice in the result. Learn reports this runs in about half the time of the version without a variable, and DIVIDE handles a zero or blank denominator.',
          },
        ],
        sources: [VAR_BP, BP_DIVIDE],
      },
      {
        title: 'Iterator over a filtered table',
        language: 'dax',
        illustrative: true,
        steps: [
          {
            code: 'Territory 5 Freight =\nSUMX(\n    FILTER(InternetSales, InternetSales[SalesTerritoryID] = 5),\n    InternetSales[Freight]\n)',
            explain: 'FILTER returns only territory 5’s rows; SUMX then sums Freight row by row over that table.',
          },
        ],
        sources: [SUMX],
      },
      {
        title: 'Running total within each fiscal year (window function)',
        language: 'dax',
        illustrative: true,
        steps: [
          {
            code: "RunningSum =\nSUMX(\n    WINDOW(\n        1, ABS, 0, REL,",
            explain: 'The window starts at the first row of the partition (1, ABS) and ends at the current row (0, REL).',
          },
          {
            code: "        ALLSELECTED('Date'[Fiscal Year], 'Date'[Month Number Of Year]),\n        PARTITIONBY('Date'[Fiscal Year])\n    ),\n    [Total Sales]\n)",
            explain: 'Rows are the selected year/month combinations, restarted for each fiscal year; SUMX adds Total Sales across the window, which gives a year-to-date running sum.',
          },
        ],
        sources: [WINDOW],
      },
      {
        title: 'Different logic at different hierarchy levels',
        language: 'dax',
        illustrative: true,
        steps: [
          {
            code: "Sales Note =\nIF(\n    ISINSCOPE('Product'[Product]),\n    \"Product level\",\n    \"Subtotal\"\n)",
            explain: 'ISINSCOPE returns TRUE only when the visual groups by Product at this level, so you can treat detail rows and subtotals differently.',
          },
        ],
        sources: [ISINSCOPE],
      },
    ],
    traps: [
      {
        text: 'A measure can’t reference variables defined outside its own expression, and you can’t reference a column of a table variable with TableName[Column] syntax.',
        sources: [VAR_REF],
      },
      {
        text: 'Variables are evaluated once, before the RETURN expression’s filters apply. Putting a VAR before a CALCULATE doesn’t make it respond to that CALCULATE’s filters.',
        sources: [VAR_BP],
      },
      {
        text: 'SUMX isn’t supported in DirectQuery mode when used in calculated columns or RLS rules.',
        sources: [SUMX],
      },
    ],
    dontConfuse: [
      {
        pairId: 'hasonevalue-vs-isinscope',
        a: 'HASONEVALUE / SELECTEDVALUE',
        b: 'ISINSCOPE',
        difference: [
          {
            text: 'HASONEVALUE is TRUE when filtering leaves exactly one distinct value (for example a slicer selection), and SELECTEDVALUE returns that value. ISINSCOPE is TRUE when the column is the level a visual is currently grouping by in a hierarchy, which is what you test to separate detail rows from subtotals.',
            sources: [HASONEVALUE, SELECTEDVALUE, ISINSCOPE],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'VAR / RETURN',
        definition: 'DAX syntax that stores the result of an expression in a named variable (VAR) and returns the final expression (RETURN).',
        sources: [VAR_REF],
      },
      {
        term: 'Iterator',
        definition: 'A DAX function (such as SUMX) that evaluates an expression for each row of a table and then aggregates the results.',
        sources: [SUMX],
      },
      {
        term: 'Window function',
        definition: 'A DAX function (WINDOW, OFFSET, INDEX) that returns rows positioned relative to the current row, using ORDERBY and PARTITIONBY.',
        sources: [WINDOW, OFFSET],
      },
      {
        term: 'Information function',
        definition: 'A DAX function that tests a value or the evaluation context, such as ISBLANK, ISFILTERED, ISINSCOPE, or HASONEVALUE.',
        sources: [INFO_FUNCS],
      },
      {
        term: 'Filter context',
        definition: 'The set of filters in effect when a measure is evaluated. CALCULATE modifies it with Boolean filters, table filters, or modifier functions.',
        sources: [CALCULATE],
      },
    ],
    needsVerification: [],
  },

  // ── Jacquard Head ────────────────────────────────────────────────────
  {
    machineId: 'jacquard-head',
    pl300Adds: [
      {
        text: 'PL-300 included creating calculation groups. DP-600 adds dynamic format strings (on measures and on calculation items) and field parameters, and expects you to know how they interact: calculation groups switch measures to the variant data type, and they force explicit measures.',
        sources: [CALC_GROUPS, DYNAMIC_FORMAT, FIELD_PARAMS],
      },
    ],
    overview: [
      {
        text: 'These three features cut down measure sprawl and let report readers choose what they see. Calculation groups apply one piece of logic (for example YTD or YoY%) to any measure. Dynamic format strings change number formats by context without turning numbers into text. Field parameters let readers swap the measures or columns in a visual.',
        sources: [CALC_GROUPS, DYNAMIC_FORMAT, FIELD_PARAMS],
      },
    ],
    bullets: [
      {
        bulletId: 'S1.5',
        tools: ['semantic-model', 'power-bi-desktop'],
        concepts: [
          {
            text: 'A calculation group is a special table whose calculation items are DAX expressions using SELECTEDMEASURE() as a placeholder for whatever measure is in the visual. Precedence controls the order when several calculation groups apply.',
            sources: [CALC_GROUPS],
          },
          {
            text: 'A dynamic format string is a DAX expression that returns a format string. The measure keeps its numeric type, unlike FORMAT(), which returns text. It can be set on a measure or on a calculation item (for example to show YOY% as a percentage).',
            sources: [DYNAMIC_FORMAT, CALC_GROUPS],
          },
          {
            text: 'A field parameter is a calculated table, defined with a DAX table constructor using NAMEOF(), listing fields (columns and/or measures) with display names and order. Put it on a slicer and in a visual’s field well so readers can switch fields.',
            sources: [FIELD_PARAMS],
          },
        ],
        howTo: [
          {
            text: 'Calculation group: Model view > Calculation group. Power BI asks to turn on Discourage implicit measures. Then add calculation items, set any dynamic format strings, and set precedence. You can also script one in TMDL view.',
            sources: [CALC_GROUPS],
          },
          {
            text: 'Dynamic format string: select the measure, choose Format > Dynamic in Measure tools, then write the DAX that returns the format string.',
            sources: [DYNAMIC_FORMAT],
          },
          {
            text: 'Field parameter: Modeling > New parameter > Fields, pick the fields, and use the generated slicer. Use column-based parameters in axis wells and measure-based ones in value wells.',
            sources: [FIELD_PARAMS],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Use a calculation item inside a measure',
        language: 'dax',
        illustrative: true,
        steps: [
          {
            code: "Orders YOY% =\nCALCULATE(\n    [Orders],\n    'Time Intelligence'[Time Calculation] = \"YOY%\"\n)",
            explain: 'Filtering the calculation group column to the YOY% item applies that item’s expression to [Orders], with no separate YoY measure needed.',
          },
        ],
        sources: [CALC_GROUPS],
      },
      {
        title: 'Define a field parameter',
        language: 'dax',
        illustrative: true,
        steps: [
          {
            code: "Parameter = {\n    (\"Customer\", NAMEOF('Customer'[Customer]), 0),\n    (\"Category\", NAMEOF('Product'[Category]), 1),\n    (\"Color\", NAMEOF('Product'[Color]), 2)\n}",
            explain: 'Each row is a display name, a field reference via NAMEOF, and a sort order. Learn says to keep exactly these three columns with unique values.',
          },
        ],
        sources: [FIELD_PARAMS],
      },
      {
        title: 'Dynamic currency format string',
        language: 'dax',
        illustrative: true,
        steps: [
          {
            code: "SELECTEDVALUE(\n    'Country/Region Currency Format Strings'[Format],\n    \"\\$#,0.00;(\\$#,0.00);\\$#,0.00\"\n)",
            explain: 'Look up the format for the selected country or region; if none is selected, fall back to US dollars. The measure stays numeric.',
          },
        ],
        sources: [DYNAMIC_FORMAT, SELECTEDVALUE],
      },
    ],
    traps: [
      {
        text: 'Adding any calculation group changes every measure in reports to the variant data type. Removing all calculation groups reverts them.',
        sources: [CALC_GROUPS],
      },
      {
        text: 'Calculation groups need Discourage implicit measures turned on, so dragging a numeric column to sum it no longer works; create explicit measures.',
        sources: [CALC_GROUPS],
      },
      {
        text: 'Field parameters can’t use implicit measures, aren’t supported by AI visuals or Q&A, can’t be drillthrough or tooltip link fields, and can’t be created on a live connection without a local model.',
        sources: [FIELD_PARAMS],
      },
      {
        text: 'Switching a measure from a dynamic format string back to a static one can’t be undone. You must re-enter the DAX expression.',
        sources: [DYNAMIC_FORMAT],
      },
      {
        text: 'In Direct Lake on SQL models, calculation groups and field parameters are among the few calculated tables allowed.',
        sources: [DIRECT_LAKE],
      },
    ],
    dontConfuse: [
      {
        pairId: 'calcgroup-vs-fieldparam',
        a: 'Calculation group',
        b: 'Field parameter',
        difference: [
          {
            text: 'A calculation group changes how measures are calculated (it applies one DAX expression to whatever measure is selected). A field parameter changes which field a visual shows (the reader swaps measures or columns) without changing any calculation.',
            sources: [CALC_GROUPS, FIELD_PARAMS],
          },
        ],
      },
      {
        pairId: 'dfs-vs-format',
        a: 'Dynamic format string',
        b: 'FORMAT() function',
        difference: [
          {
            text: 'FORMAT() returns text, which can break charts that need numbers. A dynamic format string only changes the display format, and the measure stays numeric.',
            sources: [DYNAMIC_FORMAT],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Calculation group',
        definition: 'A model table of calculation items that apply DAX logic to the measure in context through SELECTEDMEASURE(), reducing duplicate measures.',
        sources: [CALC_GROUPS],
      },
      {
        term: 'Calculation item',
        definition: 'One DAX expression inside a calculation group, such as YTD or YOY%, selectable from the group’s column.',
        sources: [CALC_GROUPS],
      },
      {
        term: 'SELECTEDMEASURE',
        definition: 'A DAX function that stands for the measure currently being evaluated, used in calculation items.',
        sources: [CALC_GROUPS, INFO_FUNCS],
      },
      {
        term: 'Dynamic format string',
        definition: 'A DAX expression that returns the format string for a measure or calculation item based on context, keeping the value numeric.',
        sources: [DYNAMIC_FORMAT],
      },
      {
        term: 'Field parameter',
        definition: 'A parameter table that lets report readers choose which measures or columns a visual uses, through a slicer.',
        sources: [FIELD_PARAMS],
      },
      {
        term: 'Discourage implicit measures',
        definition: 'A model property that stops report authors from summarizing columns directly. It is required by calculation groups.',
        sources: [CALC_GROUPS],
      },
    ],
    needsVerification: [],
  },

  // ── Wide Beam ────────────────────────────────────────────────────────
  {
    machineId: 'wide-beam',
    overview: [
      {
        text: 'Import models have a default size limit of 1 GB in the service. The large semantic model storage format lifts that limit, up to the capacity’s size or a maximum the capacity admin sets. It is required for models beyond 10 GB and recommended whenever you write to models through XMLA.',
        sources: [LARGE_MODELS],
      },
    ],
    bullets: [
      {
        bulletId: 'S1.6',
        tools: ['semantic-model', 'admin-portal', 'workspace'],
        concepts: [
          {
            text: 'Use cases: models that grow beyond the default limit as they refresh (often with incremental refresh), and models managed by XMLA-based tools, because the large format can improve XMLA write performance even for small models.',
            sources: [LARGE_MODELS],
          },
          {
            text: 'Availability: Fabric F SKUs, Premium P SKUs, Embedded A SKUs, Premium Per User, and Pro workspaces on Reserved Capacity for Pro Workspaces.',
            sources: [LARGE_MODELS],
          },
          {
            text: 'On-demand load is on by default for large models. Only the data pages a query needs are paged into memory, which speeds up reloading evicted models.',
            sources: [LARGE_MODELS],
          },
        ],
        howTo: [
          {
            text: 'Per model: in the service, open the semantic model’s Settings, expand Large semantic model storage format, turn it On, and select Apply. Then refresh to load history.',
            sources: [LARGE_MODELS],
          },
          {
            text: 'Per workspace default: in workspace settings on a Premium/Fabric capacity, set Default storage format to Large semantic model storage format. PowerShell (Set-PowerBIDataset -TargetStorageMode PremiumFiles) also works.',
            sources: [LARGE_MODELS],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'Large format raises the limit in the service only. Publishing from Power BI Desktop is still capped at 10 GB, and models grow beyond that through refresh in the service.',
        sources: [LARGE_MODELS],
      },
      {
        text: 'Semantic models in Pro workspaces don’t support XMLA write operations.',
        sources: [LARGE_MODELS],
      },
      {
        text: 'Large format is about Import model size. Direct Lake models are governed instead by capacity guardrails such as max model size on disk and max memory per SKU.',
        sources: [LARGE_MODELS, DIRECT_LAKE],
      },
    ],
    dontConfuse: [],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Large semantic model storage format',
        definition: 'A semantic model setting that allows a model to grow beyond the default 1 GB limit up to the capacity limit, and improves XMLA write performance.',
        sources: [LARGE_MODELS],
      },
      {
        term: 'On-demand load',
        definition: 'For large-format models, loading only the needed data pages into memory when queried, instead of the whole model.',
        sources: [LARGE_MODELS],
      },
    ],
    needsVerification: [],
  },

  // ── Double Loom ──────────────────────────────────────────────────────
  {
    machineId: 'double-loom',
    overview: [
      {
        text: 'A composite model mixes storage modes or sources in one model, for example DirectQuery facts with Import or Dual dimensions, or a local model that extends a published semantic model with new tables and measures. It combines in-memory speed with real-time or federated data.',
        sources: [MODES, COMPOSITE],
      },
    ],
    bullets: [
      {
        bulletId: 'S1.7',
        tools: ['semantic-model', 'power-bi-desktop'],
        concepts: [
          {
            text: 'A source group is the set of tables from one DirectQuery source, or all Import sources together. Direct Lake and Import tables count as the same source group. A composite model has more than one source group.',
            sources: [COMPOSITE],
          },
          {
            text: 'Relationships that cross source groups are always limited relationships.',
            sources: [COMPOSITE, RELATIONSHIPS],
          },
          {
            text: 'Typical design: dimensions in Import or Dual, facts in DirectQuery. Dual lets the engine generate a single efficient native query joining the fact to its filtered dimension.',
            sources: [MODES],
          },
          {
            text: 'Hybrid tables: one table with Import partitions plus one DirectQuery partition for the latest data. They are created by an incremental refresh policy with real-time DirectQuery.',
            sources: [MODES, INCREMENTAL],
          },
        ],
        howTo: [
          {
            text: 'Extend a published model: in Power BI Desktop connect live to the semantic model, then choose Make changes to this model. This converts the live connection to DirectQuery and creates a local model where you can add Import or DirectQuery tables.',
            sources: [COMPOSITE],
          },
          {
            text: 'Direct Lake: Direct Lake on OneLake tables can be combined with Import tables (in web modeling) and DirectQuery tables (with XMLA tools). Direct Lake on SQL can’t be mixed with other modes in the same model, but you can build a composite model on top of it in Desktop.',
            sources: [DIRECT_LAKE],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'Security: in a composite model, values from one source can be sent inside queries to another source (for example names from a spreadsheet inside SQL sent to a database). Power BI warns you when you create one.',
        sources: [COMPOSITE],
      },
      {
        text: 'A report built on composite model C, which includes a table from model A, can query any table in model A that isn’t protected by RLS.',
        sources: [COMPOSITE],
      },
      {
        text: 'Chaining: models built on other models form a chain. Changes upstream can affect every model below.',
        sources: [COMPOSITE],
      },
      {
        text: 'Calculated tables in a composite model use Import storage even when they reference DirectQuery tables.',
        sources: [DIRECT_LAKE],
      },
    ],
    dontConfuse: [
      {
        pairId: 'dual-vs-hybrid',
        a: 'Dual table',
        b: 'Hybrid table',
        difference: [
          {
            text: 'A Dual table is one table that can be served from cache or by DirectQuery, chosen per query (usually a dimension). A hybrid table is a partitioned table, usually a fact, with Import partitions for history and one DirectQuery partition for the newest data.',
            sources: [MODES, STORAGE_MODE],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Composite model',
        definition: 'A semantic model whose tables use different storage modes or come from more than one source group.',
        sources: [DIRECT_LAKE, COMPOSITE],
      },
      {
        term: 'Source group',
        definition: 'The tables and relationships from one DirectQuery source, or all Import (and Direct Lake) sources, in a model.',
        sources: [COMPOSITE],
      },
      {
        term: 'Hybrid table',
        definition: 'A table with Import partitions plus a DirectQuery partition for real-time data, usually created by incremental refresh.',
        sources: [MODES],
      },
      {
        term: 'Chaining',
        definition: 'Building semantic models on top of other semantic models, which creates a dependency chain.',
        sources: [COMPOSITE],
      },
    ],
    needsVerification: [],
  },

  // ── Speed Governor ───────────────────────────────────────────────────
  {
    machineId: 'speed-governor',
    pl300Adds: [
      {
        text: 'PL-300 covered Performance Analyzer, DAX query view, and removing unneeded rows and columns. DP-600 adds Fabric-scale concerns: diagnosing Direct Lake fallback to DirectQuery (Performance Analyzer shows a Direct query duration; SQL Server Profiler shows DirectQuery events), Delta table health, and DAX patterns that use the storage engine efficiently.',
        sources: [DL_ANALYZE, DIRECT_LAKE, BP_FILTER],
      },
    ],
    overview: [
      {
        text: 'Slow reports usually come from too much data in visuals, too many visuals, inefficient DAX, or (in Fabric) queries that fall back from Direct Lake. Measure first with Performance Analyzer, then fix the model, the DAX, or the report design.',
        sources: [PERF_ANALYZER, OPTIMIZATION, DL_ANALYZE],
      },
    ],
    bullets: [
      {
        bulletId: 'S2.1',
        tools: ['power-bi-desktop', 'semantic-model'],
        concepts: [
          {
            text: 'Performance Analyzer splits each visual’s load time into DAX query, Direct query (time for the source to answer), Visual display, and Other (preparing queries, waiting on other visuals). You can copy each visual’s DAX query into DAX query view.',
            sources: [PERF_ANALYZER],
          },
          {
            text: 'Report design: apply the most restrictive filters (for example Top N on large tables), limit the number of visuals per page (use drillthrough and tooltips), and test custom visuals for performance.',
            sources: [OPTIMIZATION],
          },
          {
            text: 'Model size (Import): remove unnecessary columns and rows, group and summarize, optimize column data types, disable auto date/time, and disable load for helper Power Query queries.',
            sources: [DATA_REDUCTION],
          },
        ],
        howTo: [
          {
            text: 'In Desktop: View > Performance analyzer > Start recording > Refresh visuals, then expand each visual to see the breakdown. For Direct Lake, a Direct query line means that visual’s query fell back.',
            sources: [PERF_ANALYZER, DL_ANALYZE],
          },
        ],
      },
      {
        bulletId: 'S2.2',
        tools: ['semantic-model', 'power-bi-desktop'],
        concepts: [
          {
            text: 'Pass CALCULATE filters as Boolean expressions (optionally wrapped in KEEPFILTERS) instead of FILTER over a whole table. In-memory column stores are optimized to filter columns.',
            sources: [BP_FILTER],
          },
          {
            text: 'Use DIVIDE instead of testing the denominator with IF. It handles zero or blank denominators and is better optimized.',
            sources: [BP_DIVIDE],
          },
          {
            text: 'Use COUNTROWS instead of COUNT on a column to count table rows. It is more efficient.',
            sources: [BP_COUNTROWS],
          },
          {
            text: 'Store repeated sub-expressions in variables so they’re evaluated once.',
            sources: [VAR_BP],
          },
        ],
        howTo: [
          {
            text: 'Copy a slow visual’s query from Performance Analyzer into DAX query view, rewrite the measure as a DEFINE MEASURE, compare timings, then update the model.',
            sources: [PERF_ANALYZER, DAX_QUERY_VIEW],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'Replace a table filter with a Boolean filter',
        language: 'dax',
        illustrative: true,
        steps: [
          {
            code: "Red Sales (slow) =\nCALCULATE([Sales], FILTER('Product', 'Product'[Color] = \"Red\"))",
            explain: 'FILTER iterates every Product row to build a table filter, and it replaces existing filters on Product.',
          },
          {
            code: "Red Sales =\nCALCULATE([Sales], KEEPFILTERS('Product'[Color] = \"Red\"))",
            explain: 'A Boolean filter on one column is optimized by the column store. KEEPFILTERS keeps any existing Color filter instead of overwriting it.',
          },
        ],
        sources: [BP_FILTER],
      },
      {
        title: 'Safe division and row counting',
        language: 'dax',
        illustrative: true,
        steps: [
          {
            code: 'Profit Margin = DIVIDE([Profit], [Sales])',
            explain: 'Returns BLANK when Sales is zero or blank, with no IF needed, and it is faster than testing the denominator yourself.',
          },
          {
            code: 'Sales Orders = COUNTROWS(Sales)',
            explain: 'Counts table rows directly, which is more efficient than COUNT over a column.',
          },
        ],
        sources: [BP_DIVIDE, BP_COUNTROWS],
      },
    ],
    traps: [
      {
        text: 'Boolean filter arguments can’t reference columns from multiple tables or reference a measure. Use FILTER only when you need those.',
        sources: [BP_FILTER],
      },
      {
        text: 'An unfiltered table visual over a huge model loads every row. Learn suggests a Top N filter on the visual.',
        sources: [OPTIMIZATION],
      },
      {
        text: 'In SQL Server Profiler, DirectQuery Begin/End events suggest Direct Lake fallback, but EngineEdition and OLS check queries always use DirectQuery and don’t mean fallback.',
        sources: [DL_ANALYZE],
      },
    ],
    dontConfuse: [
      {
        pairId: 'perf-categories',
        a: 'DAX query time',
        b: 'Visual display time',
        difference: [
          {
            text: 'DAX query is time spent by the semantic model producing results, which you fix with model or DAX changes. Visual display is time spent drawing the visual, which you fix with report design (fewer points, simpler visuals).',
            sources: [PERF_ANALYZER],
          },
        ],
      },
    ],
    renamed: [],
    preview: [
      {
        feature: 'Performance Analyzer: Evaluated parameters',
        note: 'A duration category for evaluating field parameters in a visual, labelled preview on Learn.',
        sources: [PERF_ANALYZER],
      },
    ],
    upcoming: [],
    glossary: [
      {
        term: 'Performance Analyzer',
        definition: 'A Power BI Desktop pane that records how long each visual takes to load, broken into DAX query, Direct query, Visual display, and Other.',
        sources: [PERF_ANALYZER],
      },
      {
        term: 'KEEPFILTERS',
        definition: 'A DAX modifier that makes a CALCULATE filter intersect existing filters on the same column instead of replacing them.',
        sources: [BP_FILTER],
      },
      {
        term: 'Auto date/time',
        definition: 'A Power BI Desktop option that creates hidden date tables for date columns. Learn recommends disabling it to reduce model size.',
        sources: [DATA_REDUCTION],
      },
    ],
    needsVerification: [],
  },

  // ── Direct Lake Shuttle ──────────────────────────────────────────────
  {
    machineId: 'direct-lake-shuttle',
    overview: [
      {
        text: 'Direct Lake lets a semantic model query huge Delta tables at Import-like speed without copying them. To configure it you need to understand framing (what "refresh" means), automatic updates, guardrails, and DirectQuery fallback, and choose between its two flavors.',
        sources: [DIRECT_LAKE, DL_HOW],
      },
    ],
    bullets: [
      {
        bulletId: 'S2.3',
        tools: ['semantic-model', 'lakehouse', 'warehouse', 'sql-analytics-endpoint'],
        concepts: [
          {
            text: 'Transcoding: columns load from OneLake only when a query first needs them, then stay resident in memory.',
            sources: [DL_HOW],
          },
          {
            text: 'Framing is the Direct Lake refresh. It reads the latest Delta log, points the model at the current Parquet files, and fixes the point in time that queries see. Data written after the last framing isn’t visible until the next one.',
            sources: [DL_HOW],
          },
          {
            text: 'Automatic updates ("Keep your Direct Lake data up to date") is on by default and reframes whenever the Delta tables change. Turn it off to hide half-finished ETL from users, then refresh manually, on a schedule, or through the REST API or TOM after the load.',
            sources: [DL_HOW],
          },
          {
            text: 'Fallback (Direct Lake on SQL only): a query switches to DirectQuery through the SQL analytics endpoint when the model uses tables with SQL RLS, OLS, or dynamic data masking, unmaterialized SQL views, or any table exceeding a guardrail, or when the model wasn’t reframed after the tables changed. One table over a guardrail prevents Direct Lake for the whole model.',
            sources: [DL_HOW],
          },
          {
            text: 'Default fallback behavior: the DirectLakeBehavior property defaults to Automatic, which falls back silently. DirectLakeOnly makes such queries fail; DirectQueryOnly forces DirectQuery, for testing.',
            sources: [DL_HOW],
          },
        ],
        howTo: [
          {
            text: 'Set Direct Lake behavior in Model view > model Properties (or with TOM/TMSL). Learn suggests Automatic in production, DirectLakeOnly in development to surface problems, and DirectQueryOnly to measure fallback cost.',
            sources: [DL_HOW],
          },
          {
            text: 'Avoid fallback: keep Delta tables within the SKU guardrails (Parquet files, row groups, rows), avoid SQL views and SQL-level security on tables the model uses, and refresh after schema changes.',
            sources: [DL_HOW, DIRECT_LAKE],
          },
          {
            text: 'Detect fallback with Performance Analyzer (a Direct query line appears) or SQL Server Profiler (DirectQuery_Begin/End events).',
            sources: [DL_ANALYZE],
          },
        ],
      },
      {
        bulletId: 'S2.4',
        tools: ['semantic-model', 'onelake', 'sql-analytics-endpoint'],
        concepts: [
          {
            text: 'Direct Lake on OneLake can use Delta tables from one or more Fabric items, never falls back to DirectQuery (it runs DirectLakeOnly), can be combined with Import tables, and is Learn’s recommended option for new models.',
            sources: [DIRECT_LAKE, DL_HOW],
          },
          {
            text: 'Direct Lake on SQL analytics endpoints uses a single Fabric source, discovers tables and views and checks permissions through the SQL analytics endpoint, can read SQL views (by falling back), and falls back when it can’t read Delta directly.',
            sources: [DIRECT_LAKE],
          },
          {
            text: 'Sources: both support lakehouses, warehouses, SQL databases, and mirrored databases. Only on OneLake supports KQL databases (with OneLake availability on) and Cosmos DB. Only on SQL supports Snowflake databases.',
            sources: [DIRECT_LAKE],
          },
        ],
        howTo: [
          {
            text: 'Choose on OneLake when you need multiple sources, Import tables in the same model, or KQL data, and don’t need SQL views. Choose on SQL when you must use SQL views or the SQL endpoint’s security, and you accept DirectQuery fallback.',
            sources: [DIRECT_LAKE],
          },
          {
            text: 'On OneLake, SQL endpoint RLS doesn’t apply: users need access to the OneLake files. Use semantic model RLS or OneLake security instead.',
            sources: [DIRECT_LAKE],
          },
        ],
      },
    ],
    examples: [],
    traps: [
      {
        text: 'Over a guardrail, Direct Lake on OneLake behaves like Import: refresh fails and the model can’t be queried until the tables are optimized. Direct Lake on SQL falls back to DirectQuery (if enabled), and the refresh succeeds with a warning.',
        sources: [DIRECT_LAKE],
      },
      {
        text: 'You can’t build a Direct Lake on OneLake table on a non-materialized SQL view. Use a lakehouse materialized view, or Import.',
        sources: [DIRECT_LAKE],
      },
      {
        text: 'The semantic model and its Direct Lake source must be in the same region. The workaround is a shortcut from a lakehouse in the model’s region.',
        sources: [DIRECT_LAKE],
      },
      {
        text: 'Direct Lake tables don’t support complex Delta column types, binary or GUID types, or NaN values, and string values are capped at 32,764 characters.',
        sources: [DIRECT_LAKE],
      },
      {
        text: 'Power BI suspends automatic updates after a non-recoverable refresh error. They resume after a successful on-demand refresh.',
        sources: [DL_HOW],
      },
    ],
    dontConfuse: [
      {
        pairId: 'dl-onelake-vs-sql',
        a: 'Direct Lake on OneLake',
        b: 'Direct Lake on SQL analytics endpoint',
        difference: [
          {
            text: 'Sources: OneLake = one or more Fabric items with Delta tables; SQL = a single item with a SQL analytics endpoint.',
            sources: [DIRECT_LAKE],
          },
          {
            text: 'Fallback: OneLake never falls back (DirectLakeOnly). SQL falls back to DirectQuery under the DirectLakeBehavior setting.',
            sources: [DL_HOW, DIRECT_LAKE],
          },
          {
            text: 'SQL views and SQL security: OneLake can’t use non-materialized views and ignores SQL endpoint RLS, OLS, and CLS. SQL can read views and respects SQL RLS by falling back.',
            sources: [DIRECT_LAKE],
          },
          {
            text: 'Mixing modes: OneLake can mix with Import (and DirectQuery via XMLA tools); SQL can’t mix storage modes in the same model.',
            sources: [DIRECT_LAKE],
          },
        ],
      },
      {
        pairId: 'dl-fallback',
        a: 'Direct Lake query (no fallback)',
        b: 'DirectQuery fallback',
        difference: [
          {
            text: 'Without fallback, VertiPaq answers from columns paged in from OneLake as of the last framing. With fallback, the query goes to the SQL analytics endpoint in DirectQuery: always the latest data but usually slower. Only Direct Lake on SQL can fall back. DirectLakeBehavior = Automatic (default, silent fallback), DirectLakeOnly (error instead), or DirectQueryOnly (always fall back).',
            sources: [DL_HOW, DIRECT_LAKE],
          },
        ],
      },
      {
        pairId: 'framing-vs-import-refresh',
        a: 'Direct Lake refresh (framing)',
        b: 'Import refresh',
        difference: [
          {
            text: 'Framing copies only metadata: it re-points the model to the newest Delta files in seconds. An Import refresh copies the data itself and can take a long time and a lot of capacity memory and CPU.',
            sources: [DIRECT_LAKE, DL_HOW],
          },
        ],
      },
    ],
    renamed: [],
    preview: [
      {
        feature: 'Calculated tables in Direct Lake on OneLake',
        note: 'Supported in preview, with limitations.',
        sources: [DIRECT_LAKE],
      },
      {
        feature: 'Calculated columns in Direct Lake on OneLake',
        note: '"User Context only" calculated columns are in preview.',
        sources: [DIRECT_LAKE],
      },
    ],
    upcoming: [],
    glossary: [
      {
        term: 'Direct Lake on OneLake',
        definition: 'The Direct Lake option that reads Delta tables from one or more Fabric items directly in OneLake and never falls back to DirectQuery.',
        sources: [DIRECT_LAKE],
      },
      {
        term: 'Direct Lake on SQL analytics endpoint',
        definition: 'The Direct Lake option that uses one item’s SQL analytics endpoint for discovery and permission checks and can fall back to DirectQuery.',
        sources: [DIRECT_LAKE],
      },
      {
        term: 'Framing',
        definition: 'The Direct Lake refresh operation that updates the model to reference the latest Delta table version, setting the point in time queries see.',
        sources: [DL_HOW],
      },
      {
        term: 'Transcoding',
        definition: 'Direct Lake’s on-demand loading of a column from OneLake into memory the first time a query needs it.',
        sources: [DL_HOW],
      },
      {
        term: 'DirectQuery fallback',
        definition: 'When a Direct Lake on SQL query can’t be served from Delta and runs as DirectQuery against the SQL analytics endpoint instead.',
        sources: [DL_HOW],
      },
      {
        term: 'DirectLakeBehavior',
        definition: 'A model property (Automatic, DirectLakeOnly, DirectQueryOnly) that controls fallback for Direct Lake on SQL models.',
        sources: [DL_HOW],
      },
      {
        term: 'Guardrails (Direct Lake)',
        definition: 'Per-SKU limits on Parquet files, row groups, and rows per table, and on model size, that determine whether a Direct Lake table can be served.',
        sources: [DIRECT_LAKE],
      },
    ],
    needsVerification: [],
  },

  // ── Batch Winder ─────────────────────────────────────────────────────
  {
    machineId: 'batch-winder',
    pl300Adds: [
      {
        text: 'Incremental refresh isn’t in the current PL-300 outline; the closest PL-300 skill is scheduled refresh. For DP-600, learn the RangeStart/RangeEnd filter, the policy settings (archive vs refresh period, detect data changes, complete days only), query folding, and real-time hybrid partitions.',
        sources: [INCREMENTAL, INCREMENTAL_CFG],
      },
    ],
    overview: [
      {
        text: 'Incremental refresh splits a large Import table into date-based partitions, so each refresh reloads only recent data while history stays untouched. Refreshes get faster, cheaper, and more reliable. Optionally a real-time DirectQuery partition adds the latest rows.',
        sources: [INCREMENTAL],
      },
    ],
    bullets: [
      {
        bulletId: 'S2.5',
        tools: ['semantic-model', 'power-bi-desktop'],
        concepts: [
          {
            text: 'Two Power Query parameters with the reserved, case-sensitive names RangeStart and RangeEnd (Date/Time type) filter the table on a date column. In the service they are overridden automatically for each partition.',
            sources: [INCREMENTAL, INCREMENTAL_CFG],
          },
          {
            text: 'Policy settings: Archive data starting before refresh date (how much history to keep, stored in year/quarter/month partitions), Incrementally refresh data starting before refresh date (the window reloaded each time), plus optional Detect data changes, Only refresh complete days, and Get the latest data in real time with DirectQuery.',
            sources: [INCREMENTAL_CFG],
          },
          {
            text: 'Query folding matters: the RangeStart/RangeEnd filter should fold to the source. Otherwise an Import-only policy may pull all rows and filter locally, and a real-time policy can’t use non-folding steps at all.',
            sources: [INCREMENTAL],
          },
          {
            text: 'Supported for Premium, PPU, Pro, and Embedded models. The real-time DirectQuery option needs Premium, PPU, or Embedded.',
            sources: [INCREMENTAL],
          },
        ],
        howTo: [
          {
            text: 'In Power BI Desktop: create RangeStart and RangeEnd parameters, filter the date column with >= RangeStart and < RangeEnd, then in Table view right-click the table in the Data pane > Incremental refresh and define the policy. Publish, then run the first refresh in the service to build the partitions.',
            sources: [INCREMENTAL_CFG],
          },
          {
            text: 'For integer date keys (yyyymmdd), convert RangeStart and RangeEnd to the same integer format inside the filter.',
            sources: [INCREMENTAL],
          },
        ],
      },
    ],
    examples: [
      {
        title: 'The RangeStart/RangeEnd filter step (Power Query M)',
        language: 'm',
        illustrative: true,
        steps: [
          {
            code: '#"Filtered Rows" = Table.SelectRows(#"Changed Type",\n    each [OrderDate] >= RangeStart and [OrderDate] < RangeEnd)',
            explain: 'Keep rows from RangeStart (inclusive) up to RangeEnd (exclusive). Having "=" on only one side means no row lands in two partitions.',
          },
          {
            code: '#"Filtered Rows" = Table.SelectRows(Data,\n    each [OrderDateKey] >= Int32.From(DateTime.ToText(RangeStart, [Format="yyyyMMdd"]))\n     and [OrderDateKey] <  Int32.From(DateTime.ToText(RangeEnd,   [Format="yyyyMMdd"])))',
            explain: 'Variant for an integer yyyymmdd key: convert the Date/Time parameters to the same integer form before comparing.',
          },
        ],
        sources: [INCREMENTAL_CFG, INCREMENTAL],
      },
    ],
    traps: [
      {
        text: 'Using ">=" and "<=" on both parameters can put a boundary row in two partitions and duplicate data.',
        sources: [INCREMENTAL_CFG],
      },
      {
        text: 'After publishing a model with incremental refresh, you can’t download it back to Power BI Desktop as a .pbix.',
        sources: [INCREMENTAL],
      },
      {
        text: 'The Detect data changes column must be different from the column used for RangeStart/RangeEnd partitioning.',
        sources: [INCREMENTAL_CFG],
      },
      {
        text: 'If several tables have policies, they must all use the same RangeStart and RangeEnd parameters, even with different periods.',
        sources: [INCREMENTAL_CFG],
      },
      {
        text: 'Direct Lake tables don’t use incremental refresh partitions. Partition the Delta tables instead.',
        sources: [DIRECT_LAKE],
      },
    ],
    dontConfuse: [
      {
        pairId: 'archive-vs-refresh-period',
        a: 'Archive (store) period',
        b: 'Incremental refresh period',
        difference: [
          {
            text: 'The archive period is how much history the table keeps (for example 5 years); those partitions aren’t reloaded. The refresh period is the recent window reloaded on every refresh (for example 3 days).',
            sources: [INCREMENTAL_CFG],
          },
        ],
      },
    ],
    renamed: [],
    preview: [],
    upcoming: [],
    glossary: [
      {
        term: 'Incremental refresh',
        definition: 'A refresh policy that partitions a table by date so only recent partitions reload on each refresh.',
        sources: [INCREMENTAL],
      },
      {
        term: 'RangeStart / RangeEnd',
        definition: 'Reserved, case-sensitive Date/Time Power Query parameters used to filter a table for incremental refresh. The service overrides them per partition.',
        sources: [INCREMENTAL, INCREMENTAL_CFG],
      },
      {
        term: 'Query folding',
        definition: 'Power Query pushing transformation steps (like the RangeStart/RangeEnd filter) down to the source as a native query.',
        sources: [INCREMENTAL],
      },
      {
        term: 'Detect data changes',
        definition: 'An incremental refresh option that only refreshes periods whose audit date/time column shows a change.',
        sources: [INCREMENTAL_CFG],
      },
    ],
    needsVerification: [],
  },
]
