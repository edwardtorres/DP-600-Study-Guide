import { patternPuzzle, type PatternScenario } from '../../puzzles/build'
import type { Puzzle } from '../../puzzles/types'

/**
 * Pattern Draft scenarios: design a star schema from a flat source. Keys are
 * authored from Learn's dimensional modeling and relationship guidance; where
 * Learn allows more than one answer, every allowed answer is accepted.
 */

const L = 'https://learn.microsoft.com/en-us/'
const SS = `${L}power-bi/guidance/star-schema`
const DIM = `${L}fabric/data-warehouse/dimensional-modeling-dimension-tables`
const FACT = `${L}fabric/data-warehouse/dimensional-modeling-fact-tables`
const M2M = `${L}power-bi/guidance/relationships-many-to-many`
const BIDI = `${L}power-bi/guidance/relationships-bidirectional-filtering`
const ROLE = `${L}power-bi/guidance/relationships-active-inactive`

const WP = (bullets: string[] = ['P2.3']) => ({ machineIds: ['weave-planner'], bulletIds: bullets })
const WF = (bullets: string[] = ['S1.2']) => ({ machineIds: ['warp-frame'], bulletIds: bullets })

const oneToMany = (from: string, to: string, why = `${from} is a dimension with a unique key, so it’s the one side; ${to} is the fact (many side). Filters should flow from the dimension to the fact (single direction).`) => ({
  from,
  to,
  cardinality: ['one-to-many' as const],
  direction: ['single' as const],
  why,
})
const sk = (dimension: string, why = `Learn recommends a surrogate key for every dimension, even when a natural key looks usable.`) => ({ dimension, accepted: ['surrogate' as const], why })
const dateKey = { dimension: 'Date', accepted: ['smart-date' as const], why: 'Learn: the date dimension’s surrogate key should store the date in YYYYMMDD format as an int. It’s the accepted exception to keys carrying no meaning, and it’s efficient and sorts numerically.' }

const scenarios: PatternScenario[] = [
  {
    id: 'PD-01',
    title: 'Retail order lines',
    ...WP(),
    difficulty: 2,
    sources: [SS, DIM, FACT],
    trapPairId: 'scd1-vs-scd2',
    story: 'A retailer’s flat export has one row per order line. Analysts want sales by day, customer, and product. When a customer moves city, past sales must stay with the old city. Email changes just replace the old address.',
    source: {
      name: 'OrdersExport',
      columns: ['OrderNumber', 'OrderLine', 'OrderDate', 'CustomerID', 'CustomerEmail', 'City', 'ProductSKU', 'Category', 'Quantity', 'UnitPrice', 'SalesAmount'],
      rows: [
        ['SO-1001', 1, '2026-09-01', 'C17', 'ana@contoso.com', 'Leeds', 'P-04', 'Tools', 2, 15, 30],
        ['SO-1001', 2, '2026-09-01', 'C17', 'ana@contoso.com', 'Leeds', 'P-09', 'Paint', 1, 22, 22],
        ['SO-1002', 1, '2026-09-02', 'C08', 'ben@contoso.com', 'York', 'P-04', 'Tools', 5, 15, 75],
        ['SO-1003', 1, '2026-09-02', 'C17', 'ana@contoso.com', 'Hull', 'P-11', 'Garden', 3, 8, 24],
        ['SO-1004', 1, '2026-09-03', 'C21', 'cai@contoso.com', 'Leeds', 'P-09', 'Paint', 2, 22, 44],
      ],
    },
    grain: { choices: ['One row per order line', 'One row per order', 'One row per customer per day'], accepted: [0], why: 'Transaction fact tables store facts at the lowest possible grain: here, the order line. You can always roll up later, but you can’t split a higher grain back down.' },
    dimensions: ['Customer', 'Product', 'Date'],
    columns: [
      { name: 'OrderNumber', accepted: ['attribute'], why: 'Order numbers describe the event and set its grain; they aren’t keys to a dimension or measures. Learn calls this a degenerate dimension.' },
      { name: 'Quantity', accepted: ['measure'], why: 'A numeric, additive value that queries sum: a measure.' },
      { name: 'UnitPrice', accepted: ['measure'], why: 'Unit price is a non-additive measure (don’t sum it), but it’s still a fact measure; it can be averaged or multiplied by quantity.' },
      { name: 'City', accepted: ['dim:Customer'], why: 'City describes the customer, so it belongs in the Customer dimension.' },
      { name: 'CustomerEmail', accepted: ['dim:Customer'], why: 'Email describes the customer.' },
      { name: 'Category', accepted: ['dim:Product'], why: 'Category describes the product; in a star schema it’s denormalized into the Product dimension.' },
      { name: 'OrderDate', accepted: ['dim:Date'], why: 'The order date relates each fact row to the Date dimension.' },
    ],
    keys: [sk('Customer', 'City needs SCD type 2, which stores several versions of a customer, so the natural key repeats. A surrogate key is required.'), sk('Product'), dateKey],
    changes: [
      { attribute: 'City', accepted: ['type2'], why: 'Past sales must keep the old city, so a change inserts a new version row (type 2).' },
      { attribute: 'CustomerEmail', accepted: ['type1'], why: 'No history is needed for email, so overwrite it (type 1), as Learn suggests for most contact details.' },
    ],
    relationships: [oneToMany('Customer', 'Sales'), oneToMany('Product', 'Sales'), oneToMany('Date', 'Sales')],
  },
  {
    id: 'PD-02',
    title: 'End-of-day inventory',
    ...WP(),
    difficulty: 2,
    sources: [SS, DIM, FACT],
    story: 'Each night a system exports the stock on hand for every product in every warehouse. Analysts track stock trends; they don’t need individual stock movements. Each product’s standard cost changes several times a week. Warehouse manager names change rarely, and old names don’t matter.',
    source: {
      name: 'StockExport',
      columns: ['SnapshotDate', 'WarehouseCode', 'WarehouseManager', 'ProductSKU', 'ProductName', 'StandardCost', 'OnHandQty'],
      rows: [
        ['2026-09-01', 'W1', 'Dara', 'P-04', 'Drill', 41.5, 120],
        ['2026-09-01', 'W2', 'Eli', 'P-04', 'Drill', 41.5, 35],
        ['2026-09-02', 'W1', 'Dara', 'P-04', 'Drill', 42.0, 112],
        ['2026-09-02', 'W1', 'Dara', 'P-09', 'Roller', 6.2, 400],
        ['2026-09-02', 'W2', 'Eli', 'P-09', 'Roller', 6.2, 90],
      ],
    },
    grain: { choices: ['One row per product per warehouse per day', 'One row per stock movement', 'One row per product'], accepted: [0], why: 'This is a periodic snapshot fact table: one row per product per warehouse at each day’s end. Its measures are semi-additive.' },
    dimensions: ['Product', 'Warehouse', 'Date'],
    columns: [
      { name: 'OnHandQty', accepted: ['measure'], why: 'Stock on hand is a measure. It’s semi-additive: Learn says a periodic snapshot measure can’t be summed across time periods, and a stock balance can’t be summed across other products.' },
      { name: 'WarehouseManager', accepted: ['dim:Warehouse'], why: 'The manager describes the warehouse.' },
      { name: 'ProductName', accepted: ['dim:Product'], why: 'The name describes the product.' },
      { name: 'StandardCost', accepted: ['measure'], why: 'A numeric attribute that changes rapidly belongs in the fact table as a measure, not in a versioned dimension.' },
      { name: 'SnapshotDate', accepted: ['dim:Date'], why: 'The snapshot date relates each row to the Date dimension.' },
    ],
    keys: [sk('Product'), sk('Warehouse'), dateKey],
    changes: [
      { attribute: 'StandardCost', accepted: ['fact'], why: 'It changes several times a week, a rapidly changing attribute. Learn: if it’s numeric, like a price, add it to the fact table as a measure.' },
      { attribute: 'WarehouseManager', accepted: ['type1'], why: 'History isn’t needed, so overwrite (type 1).' },
    ],
    relationships: [oneToMany('Product', 'Stock'), oneToMany('Warehouse', 'Stock'), oneToMany('Date', 'Stock')],
  },
  {
    id: 'PD-03',
    title: 'Support tickets and agent teams',
    ...WP(['P2.3', 'P2.4']),
    difficulty: 3,
    sources: [SS, DIM, FACT, ROLE],
    trapPairId: 'star-vs-snowflake',
    story: 'A help desk exports one row per ticket. Agents sometimes move to another team, and managers must see each ticket under the team the agent was in when it was closed. Typos in agent names are simply corrected. The source keeps the team in a separate table that you can flatten.',
    source: {
      name: 'Tickets',
      columns: ['TicketNumber', 'OpenedDate', 'ClosedDate', 'AgentID', 'AgentName', 'TeamName', 'CustomerSegment', 'HoursToResolve'],
      rows: [
        ['T-501', '2026-08-30', '2026-09-01', 'A1', 'Femi', 'Billing', 'SMB', 6],
        ['T-502', '2026-08-31', '2026-09-03', 'A2', 'Gus', 'Hardware', 'Enterprise', 30],
        ['T-503', '2026-09-01', '2026-09-01', 'A1', 'Femi', 'Billing', 'SMB', 2],
        ['T-504', '2026-09-02', '2026-09-04', 'A1', 'Femi', 'Hardware', 'Enterprise', 17],
        ['T-505', '2026-09-03', '2026-09-05', 'A3', 'Hana', 'Billing', 'SMB', 9],
      ],
    },
    grain: { choices: ['One row per ticket', 'One row per ticket per day open', 'One row per agent per day'], accepted: [0], why: 'Each ticket is one event with its own measures and dates, so the grain is one row per ticket.' },
    dimensions: ['Agent', 'Customer', 'Date'],
    columns: [
      { name: 'TicketNumber', accepted: ['attribute'], why: 'Ticket numbers describe the event; Learn lists ticket numbers as fact attributes that can form a degenerate dimension.' },
      { name: 'HoursToResolve', accepted: ['measure'], why: 'A numeric duration that queries summarize: a measure.' },
      { name: 'TeamName', accepted: ['dim:Agent'], why: 'Denormalize the team into the Agent dimension: a star schema flattens related lookup tables into one dimension table.' },
      { name: 'CustomerSegment', accepted: ['dim:Customer'], why: 'The segment describes the customer.' },
      { name: 'OpenedDate', accepted: ['dim:Date'], why: 'One role of the Date dimension (role-playing).' },
      { name: 'ClosedDate', accepted: ['dim:Date'], why: 'A second role of the same Date dimension; one relationship is active and the other inactive (or use a second date table).' },
    ],
    keys: [sk('Agent', 'Team changes need SCD type 2, which creates several rows per agent, so the agent ID repeats. A surrogate key is required.'), sk('Customer'), dateKey],
    changes: [
      { attribute: 'TeamName', accepted: ['type2'], why: 'Tickets must stay with the team at the time, so a team change inserts a new version of the agent (type 2).' },
      { attribute: 'AgentName', accepted: ['type1'], why: 'Correcting errors is a type 1 change: overwrite the row.' },
    ],
    relationships: [oneToMany('Agent', 'Tickets'), oneToMany('Customer', 'Tickets'), oneToMany('Date', 'Tickets', 'Date is the one side for each role; the relationships filter from Date to Tickets (single). Only one of the two can be active.')],
  },
  {
    id: 'PD-04',
    title: 'Class attendance without measures',
    ...WP(),
    difficulty: 2,
    sources: [SS, DIM, FACT],
    story: 'A college records which students attended which class sessions. The only question is “how many attended?”. Students change programme, and attendance must be reported by the programme at the time. Misspelled names are corrected.',
    source: {
      name: 'Attendance',
      columns: ['SessionDate', 'StudentID', 'StudentName', 'Programme', 'CourseCode', 'CourseTitle'],
      rows: [
        ['2026-09-07', 'S01', 'Ivo', 'Physics', 'PH101', 'Mechanics'],
        ['2026-09-07', 'S02', 'Jo', 'Maths', 'PH101', 'Mechanics'],
        ['2026-09-08', 'S01', 'Ivo', 'Physics', 'MA110', 'Calculus'],
        ['2026-09-14', 'S02', 'Jo', 'Physics', 'PH101', 'Mechanics'],
        ['2026-09-14', 'S03', 'Kai', 'Maths', 'MA110', 'Calculus'],
      ],
    },
    grain: { choices: ['One row per student per class session attended', 'One row per course per day', 'One row per student'], accepted: [0], why: 'Each attendance is one event. The table has no measure columns, so it’s a factless fact table: count its rows.' },
    dimensions: ['Student', 'Course', 'Date'],
    columns: [
      { name: 'StudentName', accepted: ['dim:Student'], why: 'Describes the student.' },
      { name: 'Programme', accepted: ['dim:Student'], why: 'Describes the student (and is versioned, see below).' },
      { name: 'CourseTitle', accepted: ['dim:Course'], why: 'Describes the course.' },
      { name: 'SessionDate', accepted: ['dim:Date'], why: 'Relates each attendance to the Date dimension.' },
    ],
    keys: [sk('Student', 'Programme history needs type 2 versions, so a surrogate key is required.'), sk('Course'), dateKey],
    changes: [
      { attribute: 'Programme', accepted: ['type2'], why: 'Reports must use the programme at the time, so each change creates a new version (type 2).' },
      { attribute: 'StudentName', accepted: ['type1'], why: 'Corrections overwrite (type 1).' },
    ],
    relationships: [oneToMany('Student', 'Attendance'), oneToMany('Course', 'Attendance'), oneToMany('Date', 'Attendance')],
  },
  {
    id: 'PD-05',
    title: 'Targets at a higher grain',
    ...WF(['S1.2', 'S1.3']),
    difficulty: 3,
    sources: [SS, M2M, DIM],
    story: 'The model has a Sales fact at product-and-day grain. Planning adds yearly targets per product category. TargetYear holds the first date of each year. When a product moves category, reports should show all of its history under the new category.',
    source: {
      name: 'Targets',
      columns: ['Category', 'TargetYear', 'TargetQuantity'],
      rows: [
        ['Tools', '2025-01-01', 1200],
        ['Paint', '2025-01-01', 800],
        ['Tools', '2026-01-01', 1500],
        ['Paint', '2026-01-01', 900],
        ['Garden', '2026-01-01', 400],
      ],
    },
    grain: { choices: ['One row per category per year', 'One row per product per day', 'One row per product per year'], accepted: [0], why: 'The targets are set per category per year, which is a higher grain than the Product and Date dimensions.' },
    dimensions: ['Product', 'Date'],
    columns: [
      { name: 'TargetQuantity', accepted: ['measure'], why: 'The numeric target is the measure.' },
      { name: 'Category', accepted: ['dim:Product'], why: 'Category is an attribute of the Product dimension; the target relates to it at the category level.' },
      { name: 'TargetYear', accepted: ['dim:Date'], why: 'TargetYear holds dates, so it relates to the Date dimension.' },
    ],
    keys: [sk('Product')],
    changes: [{ attribute: 'Category (of a product)', accepted: ['type1'], why: 'Showing all history under the new category is exactly what a type 1 overwrite does: it’s as if the product always had that category.' }],
    relationships: [
      { from: 'Date', to: 'Targets', cardinality: ['one-to-many'], direction: ['single'], why: 'TargetYear values are dates, so Date (unique dates) to Targets is one-to-many, filtering from Date.' },
      { from: 'Product', to: 'Targets', cardinality: ['many-to-many'], direction: ['single'], why: 'Category repeats in both Product and Targets, so there’s no one side: Learn uses a many-to-many relationship that filters in a single direction, from the dimension to the fact.' },
      oneToMany('Product', 'Sales'),
    ],
  },
  {
    id: 'PD-06',
    title: 'Joint bank accounts',
    ...WF(['S1.3']),
    difficulty: 3,
    sources: [SS, M2M, BIDI],
    story: 'A bank records account transactions. An account can have several customers (joint accounts), and a customer can have several accounts. Reports must show balances by customer. A bridging table AccountCustomer links accounts and customers. Customer name changes are corrections; the old spelling isn’t kept.',
    source: {
      name: 'TransactionsExport',
      columns: ['TransactionID', 'TxnDate', 'AccountNumber', 'AccountType', 'CustomerName', 'Amount'],
      rows: [
        ['X-1', '2026-09-01', '01', 'Joint', 'Ana', 100],
        ['X-1', '2026-09-01', '01', 'Joint', 'Ben', 100],
        ['X-2', '2026-09-02', '02', 'Single', 'Ben', -40],
        ['X-3', '2026-09-03', '01', 'Joint', 'Ana', 25],
        ['X-3', '2026-09-03', '01', 'Joint', 'Ben', 25],
      ],
    },
    grain: { choices: ['One row per transaction', 'One row per transaction per account holder', 'One row per account per day'], accepted: [0], why: 'The export repeats a joint account’s transaction once per holder, but in Learn’s design the Transaction fact relates to Account, and customers are reached through the bridging table, so each transaction is stored once.' },
    dimensions: ['Account', 'Customer', 'Date'],
    columns: [
      { name: 'TransactionID', accepted: ['attribute'], why: 'Identifies the event: a fact attribute (degenerate dimension).' },
      { name: 'Amount', accepted: ['measure'], why: 'The numeric amount is the measure.' },
      { name: 'AccountType', accepted: ['dim:Account'], why: 'Describes the account.' },
      { name: 'CustomerName', accepted: ['dim:Customer'], why: 'Describes the customer, reached through the bridging table.' },
    ],
    keys: [sk('Account'), sk('Customer')],
    changes: [{ attribute: 'CustomerName', accepted: ['type1'], why: 'A name correction doesn’t need history: overwrite (type 1).' }],
    relationships: [
      oneToMany('Account', 'Transactions'),
      { from: 'Customer', to: 'AccountCustomer', cardinality: ['one-to-many'], direction: ['single'], why: 'Customer is unique; the bridge holds one row per account holder. Filters flow from Customer to the bridge.' },
      { from: 'Account', to: 'AccountCustomer', cardinality: ['one-to-many'], direction: ['both'], why: 'For a customer filter to reach Transactions, it must travel from the bridge up to Account. Learn: this relationship’s filter direction must be set to Both.' },
    ],
  },
  {
    id: 'PD-07',
    title: 'Shipments with three dates',
    ...WF(),
    difficulty: 2,
    sources: [SS, DIM, FACT, ROLE],
    story: 'A logistics team analyzes shipments by order date, ship date, and delivery date, and by carrier. Carrier phone numbers change, and only the current number matters.',
    source: {
      name: 'Shipments',
      columns: ['ShipmentID', 'OrderDate', 'ShipDate', 'DeliveryDate', 'CarrierName', 'CarrierPhone', 'WeightKg', 'FreightCost'],
      rows: [
        ['SH-01', '2026-09-01', '2026-09-02', '2026-09-05', 'Swift', '555-0101', 12, 30],
        ['SH-02', '2026-09-01', '2026-09-03', '2026-09-04', 'Atlas', '555-0199', 4, 11],
        ['SH-03', '2026-09-02', '2026-09-02', '2026-09-06', 'Swift', '555-0101', 30, 64],
        ['SH-04', '2026-09-03', '2026-09-05', '2026-09-07', 'Atlas', '555-0123', 8, 19],
        ['SH-05', '2026-09-04', '2026-09-04', '2026-09-05', 'Swift', '555-0101', 2, 7],
      ],
    },
    grain: { choices: ['One row per shipment', 'One row per carrier per day', 'One row per shipment per date type'], accepted: [0], why: 'Each shipment is one event with its measures and three date roles.' },
    dimensions: ['Carrier', 'Date'],
    columns: [
      { name: 'ShipmentID', accepted: ['attribute'], why: 'Identifies the shipment (like a tracking number): a fact attribute.' },
      { name: 'WeightKg', accepted: ['measure'], why: 'Numeric and additive: a measure.' },
      { name: 'FreightCost', accepted: ['measure'], why: 'Numeric and additive: a measure.' },
      { name: 'CarrierPhone', accepted: ['dim:Carrier'], why: 'Describes the carrier.' },
      { name: 'DeliveryDate', accepted: ['dim:Date'], why: 'One of three roles of the single Date dimension (a role-playing dimension).' },
    ],
    keys: [sk('Carrier'), dateKey],
    changes: [{ attribute: 'CarrierPhone', accepted: ['type1'], why: 'Only the current number matters: overwrite (type 1).' }],
    relationships: [oneToMany('Carrier', 'Shipments'), oneToMany('Date', 'Shipments', 'Date is the one side of each of its three relationships; they filter from Date to Shipments. One is active; the other two are inactive and used with USERELATIONSHIP (or use separate date tables).')],
  },
  {
    id: 'PD-08',
    title: 'Web sessions and slicers “with data”',
    ...WF(),
    difficulty: 2,
    sources: [SS, DIM, FACT, BIDI],
    story: 'A product team analyzes web sessions by date, device, and visitor plan. Visitors upgrade from Free to Paid, and sessions must count under the plan at the time. A designer asks for the Device slicer to show only devices with sessions for the selected plan.',
    source: {
      name: 'Sessions',
      columns: ['SessionID', 'SessionDate', 'VisitorID', 'Plan', 'DeviceType', 'Browser', 'PageViews', 'DurationSec'],
      rows: [
        ['W-1', '2026-09-01', 'V1', 'Free', 'Phone', 'Edge', 4, 95],
        ['W-2', '2026-09-01', 'V2', 'Paid', 'Desktop', 'Edge', 12, 600],
        ['W-3', '2026-09-02', 'V1', 'Paid', 'Phone', 'Safari', 7, 210],
        ['W-4', '2026-09-03', 'V3', 'Free', 'Tablet', 'Chrome', 2, 40],
        ['W-5', '2026-09-03', 'V2', 'Paid', 'Desktop', 'Firefox', 9, 330],
      ],
    },
    grain: { choices: ['One row per session', 'One row per page view', 'One row per visitor per day'], accepted: [0], why: 'The source and the questions are at session level; PageViews is already a count per session.' },
    dimensions: ['Visitor', 'Device', 'Date'],
    columns: [
      { name: 'SessionID', accepted: ['attribute'], why: 'Identifies the event: a fact attribute.' },
      { name: 'PageViews', accepted: ['measure'], why: 'A numeric count summarized across sessions: a measure.' },
      { name: 'DurationSec', accepted: ['measure'], why: 'A numeric duration: a measure.' },
      { name: 'Plan', accepted: ['dim:Visitor'], why: 'Describes the visitor (versioned, see below).' },
      { name: 'Browser', accepted: ['dim:Device'], why: 'Describes the device used.' },
    ],
    keys: [sk('Visitor', 'Plan changes need type 2 versions, so a surrogate key is required.'), sk('Device'), dateKey],
    changes: [{ attribute: 'Plan', accepted: ['type2'], why: 'Sessions must count under the plan at the time: insert a new version (type 2).' }],
    relationships: [
      oneToMany('Visitor', 'Sessions'),
      oneToMany('Device', 'Sessions', 'Keep Device to Sessions one-to-many and single. Learn doesn’t recommend bi-directional relationships for slicers “with data”, because they cost performance; filter the slicer with a measure instead.'),
      oneToMany('Date', 'Sessions'),
    ],
  },
]

export const patternPuzzles: Puzzle[] = scenarios.map(patternPuzzle)
