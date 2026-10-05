import { accessPuzzle, type AccessScenario } from '../../puzzles/build'
import { ACCESS_SOURCES } from '../../puzzles/evaluators/access'
import type { Puzzle } from '../../puzzles/types'

/**
 * Gatehouse Access Matrix scenarios. Each stores only users, permissions, and
 * rules; every answer comes from evaluateAccess.
 */

const GK = { machineIds: ['gate-keys'], bulletIds: ['M1.1'] }
const IL = { machineIds: ['item-locks'], bulletIds: ['M1.2'] }
const TS = { machineIds: ['thread-sieves'], bulletIds: ['M1.3'] }

const scenarios: AccessScenario[] = [
  {
    id: 'AM-01',
    title: 'Who can do what in the workspace',
    ...GK,
    difficulty: 1,
    sources: [ACCESS_SOURCES.roles],
    trapPairId: 'member-vs-contributor',
    story: 'Four people share the Finance workspace, one in each role.',
    setup: {
      users: [
        { name: 'Ana', role: 'Admin' },
        { name: 'Ben', role: 'Member' },
        { name: 'Cai', role: 'Contributor' },
        { name: 'Dee', role: 'Viewer' },
      ],
    },
    questions: [
      { q: { kind: 'action', user: 'Ben', action: 'add-admins' }, prompt: 'Can Ben add another admin to the workspace?' },
      { q: { kind: 'action', user: 'Ben', action: 'add-members' }, prompt: 'Can Ben add a new member?' },
      { q: { kind: 'action', user: 'Cai', action: 'write-notebook' }, prompt: 'Can Cai edit a notebook?' },
      { q: { kind: 'action', user: 'Cai', action: 'connect-git' }, prompt: 'Can Cai connect the workspace to a Git repository?' },
      { q: { kind: 'action', user: 'Dee', action: 'run-pipeline' }, prompt: 'Can Dee run a pipeline?' },
      { q: { kind: 'action', user: 'Dee', action: 'view-pipeline-output' }, prompt: 'Can Dee view a pipeline run’s output?' },
      { q: { kind: 'action', user: 'Ana', action: 'update-delete-workspace' }, prompt: 'Can Ana delete the workspace?' },
    ],
  },
  {
    id: 'AM-02',
    title: 'Sharing and reading as a contributor or viewer',
    machineIds: ['gate-keys', 'item-locks'],
    bulletIds: ['M1.1', 'M1.2'],
    difficulty: 2,
    sources: [ACCESS_SOURCES.roles, ACCESS_SOURCES.warehouseShare],
    trapPairId: 'access-layers',
    story: 'The Sales workspace holds a warehouse. Nobody has extra item permissions beyond their workspace role.',
    setup: {
      users: [
        { name: 'Ben', role: 'Member' },
        { name: 'Cai', role: 'Contributor' },
        { name: 'Dee', role: 'Viewer' },
      ],
    },
    questions: [
      { q: { kind: 'action', user: 'Ben', action: 'share-item' }, prompt: 'Can Ben share the warehouse and let others reshare it?' },
      { q: { kind: 'action', user: 'Cai', action: 'share-item' }, prompt: 'Can Cai share the warehouse and let others reshare it?' },
      { q: { kind: 'sql-select', user: 'Dee', table: 'Sales', columns: ['Region', 'Amount'] }, prompt: 'Can Dee query dbo.Sales with T-SQL?' },
      { q: { kind: 'spark-read', user: 'Dee' }, prompt: 'Can Dee read the warehouse files from a Spark notebook?' },
      { q: { kind: 'spark-read', user: 'Cai' }, prompt: 'Can Cai read the warehouse files from a Spark notebook?' },
    ],
  },
  {
    id: 'AM-03',
    title: 'Sharing a warehouse outside the workspace',
    ...IL,
    difficulty: 2,
    sources: [ACCESS_SOURCES.warehouseShare, ACCESS_SOURCES.granular],
    trapPairId: 'access-layers',
    story: 'None of these people have a workspace role. The warehouse owner shared it with each of them, choosing different permissions.',
    setup: {
      users: [
        { name: 'Eli', item: ['Read'] },
        { name: 'Fay', item: ['Read', 'ReadData'] },
        { name: 'Gil', item: ['Read', 'ReadAll'] },
        { name: 'Hal' },
      ],
    },
    questions: [
      { q: { kind: 'connect', user: 'Eli' }, prompt: 'Can Eli connect to the warehouse’s SQL endpoint?' },
      { q: { kind: 'sql-select', user: 'Eli', table: 'Sales', columns: ['Region'] }, prompt: 'Can Eli query dbo.Sales?' },
      { q: { kind: 'sql-select', user: 'Fay', table: 'Sales', columns: ['Region'] }, prompt: 'Can Fay query dbo.Sales?' },
      { q: { kind: 'spark-read', user: 'Fay' }, prompt: 'Can Fay read the data with Spark?' },
      { q: { kind: 'spark-read', user: 'Gil' }, prompt: 'Can Gil read the data with Spark?' },
      { q: { kind: 'connect', user: 'Hal' }, prompt: 'Can Hal connect to the warehouse?' },
    ],
  },
  {
    id: 'AM-04',
    title: 'Column-level security with GRANT',
    ...TS,
    difficulty: 2,
    sources: [ACCESS_SOURCES.cls, ACCESS_SOURCES.warehouseShare],
    trapPairId: 'cls-vs-ols-vs-ddm',
    story: 'dbo.Customers has CustomerID, Name, Email, and CreditCard. Ivy and Jon were shared the warehouse with Read only; the owner then granted Ivy some columns.',
    setup: {
      users: [
        { name: 'Ivy', item: ['Read'], grants: [{ table: 'Customers', columns: ['CustomerID', 'Name', 'Email'] }] },
        { name: 'Jon', item: ['Read'] },
      ],
      tables: [{ name: 'Customers', columns: ['CustomerID', 'Name', 'Email', 'CreditCard'] }],
    },
    facts: [{ label: 'Table', value: 'dbo.Customers (CustomerID, Name, Email, CreditCard)' }],
    questions: [
      { q: { kind: 'sql-select', user: 'Ivy', table: 'Customers', columns: ['CustomerID', 'Name'] }, prompt: 'Does SELECT CustomerID, Name FROM dbo.Customers succeed for Ivy?' },
      { q: { kind: 'sql-select', user: 'Ivy', table: 'Customers', columns: ['CustomerID', 'Name', 'Email', 'CreditCard'] }, prompt: 'Does SELECT * FROM dbo.Customers succeed for Ivy?' },
      { q: { kind: 'sql-select', user: 'Ivy', table: 'Customers', columns: ['Name', 'CreditCard'] }, prompt: 'Does SELECT Name, CreditCard succeed for Ivy?' },
      { q: { kind: 'sql-select', user: 'Jon', table: 'Customers', columns: ['Name'] }, prompt: 'Does SELECT Name FROM dbo.Customers succeed for Jon?' },
    ],
  },
  {
    id: 'AM-05',
    title: 'Warehouse RLS applies to admins too',
    ...TS,
    difficulty: 3,
    sources: [ACCESS_SOURCES.whRls],
    trapPairId: 'access-layers',
    story: 'A T-SQL security policy on dbo.Sales filters Region by a mapping table. The mapping lists the regions each person may see.',
    setup: {
      users: [
        { name: 'Ana', role: 'Admin' },
        { name: 'Ben', role: 'Viewer' },
        { name: 'Cai', role: 'Contributor' },
      ],
      warehouseRls: { table: 'Sales', column: 'Region', allow: { Ana: ['East'], Ben: ['West'], Cai: ['East', 'West'] } },
      rlsValues: ['East', 'North', 'West'],
    },
    facts: [
      { label: 'dbo.Sales regions', value: 'East, North, West' },
      { label: 'Security policy mapping', value: 'Ana → East; Ben → West; Cai → East and West' },
    ],
    questions: [
      { q: { kind: 'sql-rows', user: 'Ana' }, prompt: 'Which regions does Ana get from SELECT * FROM dbo.Sales?' },
      { q: { kind: 'sql-rows', user: 'Ben' }, prompt: 'Which regions does Ben get?' },
      { q: { kind: 'sql-rows', user: 'Cai' }, prompt: 'Which regions does Cai get?' },
    ],
  },
  {
    id: 'AM-06',
    title: 'Who sees masked emails',
    ...TS,
    difficulty: 2,
    sources: [ACCESS_SOURCES.ddm],
    trapPairId: 'cls-vs-ols-vs-ddm',
    story: 'dbo.Customers.Email has a dynamic data mask in the warehouse.',
    setup: {
      users: [
        { name: 'Ana', role: 'Admin' },
        { name: 'Cai', role: 'Contributor' },
        { name: 'Dee', role: 'Viewer' },
        { name: 'Eli', item: ['Read', 'ReadData'] },
        { name: 'Fay', item: ['Read', 'ReadData'], unmask: true },
      ],
      masked: [{ table: 'Customers', column: 'Email' }],
    },
    questions: [
      { q: { kind: 'masked', user: 'Ana', table: 'Customers', column: 'Email' }, prompt: 'Does Ana see masked emails?' },
      { q: { kind: 'masked', user: 'Cai', table: 'Customers', column: 'Email' }, prompt: 'Does Cai see masked emails?' },
      { q: { kind: 'masked', user: 'Dee', table: 'Customers', column: 'Email' }, prompt: 'Does Dee see masked emails?' },
      { q: { kind: 'masked', user: 'Eli', table: 'Customers', column: 'Email' }, prompt: 'Does Eli see masked emails?' },
      { q: { kind: 'masked', user: 'Fay', table: 'Customers', column: 'Email' }, prompt: 'Does Fay see masked emails?' },
    ],
  },
  {
    id: 'AM-07',
    title: 'Semantic model RLS by role',
    ...TS,
    difficulty: 2,
    sources: [ACCESS_SOURCES.smRls],
    trapPairId: 'access-layers',
    story: 'A semantic model has RLS roles East and West that filter Region. The data has East, North, and West.',
    setup: {
      users: [
        { name: 'Ana', role: 'Member' },
        { name: 'Dee', role: 'Viewer', modelRoles: ['East'] },
        { name: 'Gus', role: 'Viewer', modelRoles: ['East', 'West'] },
        { name: 'Cai', role: 'Contributor', modelRoles: ['West'] },
      ],
      modelRls: [
        { role: 'East', column: 'Region', values: ['East'] },
        { role: 'West', column: 'Region', values: ['West'] },
      ],
      rlsValues: ['East', 'North', 'West'],
    },
    facts: [{ label: 'RLS roles', value: 'East: [Region] = "East"; West: [Region] = "West"' }],
    questions: [
      { q: { kind: 'model-rows', user: 'Ana' }, prompt: 'Which regions does Ana see in the report?' },
      { q: { kind: 'model-rows', user: 'Dee' }, prompt: 'Which regions does Dee see?' },
      { q: { kind: 'model-rows', user: 'Gus' }, prompt: 'Which regions does Gus see?' },
      { q: { kind: 'model-rows', user: 'Cai' }, prompt: 'Which regions does Cai see?' },
    ],
  },
  {
    id: 'AM-08',
    title: 'Object-level security on a salary column',
    ...TS,
    difficulty: 2,
    sources: [ACCESS_SOURCES.smOls],
    trapPairId: 'cls-vs-ols-vs-ddm',
    story: 'In the HR semantic model, the Staff role sets the Salary column’s permission to None. The Managers role has no OLS.',
    setup: {
      users: [
        { name: 'Dee', role: 'Viewer', modelRoles: ['Staff'] },
        { name: 'Ben', role: 'Member', modelRoles: ['Staff'] },
        { name: 'Hal', role: 'Viewer', modelRoles: ['Managers'] },
      ],
      modelOls: [{ role: 'Staff', column: 'Salary' }],
    },
    questions: [
      { q: { kind: 'model-column', user: 'Dee', column: 'Salary' }, prompt: 'Can Dee see or use the Salary column?' },
      { q: { kind: 'model-column', user: 'Ben', column: 'Salary' }, prompt: 'Can Ben see or use the Salary column?' },
      { q: { kind: 'model-column', user: 'Hal', column: 'Salary' }, prompt: 'Can Hal see or use the Salary column?' },
    ],
  },
  {
    id: 'AM-09',
    title: 'A viewer with Build permission',
    machineIds: ['item-locks', 'thread-sieves'],
    bulletIds: ['M1.2', 'M1.3'],
    difficulty: 3,
    sources: [ACCESS_SOURCES.smRls, ACCESS_SOURCES.roles, ACCESS_SOURCES.warehouseShare],
    trapPairId: 'access-layers',
    story: 'Dee is a workspace Viewer who was also given Build permission on the Sales semantic model so she can use Analyze in Excel. She is in the RLS role North.',
    setup: {
      users: [{ name: 'Dee', role: 'Viewer', modelRoles: ['North'] }],
      modelRls: [
        { role: 'North', column: 'Region', values: ['North'] },
        { role: 'South', column: 'Region', values: ['South'] },
      ],
      rlsValues: ['North', 'South'],
    },
    facts: [{ label: 'Extra permission', value: 'Dee has Build on the semantic model.' }],
    questions: [
      { q: { kind: 'model-rows', user: 'Dee' }, prompt: 'Which regions does Dee see in Analyze in Excel?' },
      { q: { kind: 'spark-read', user: 'Dee' }, prompt: 'Can Dee read the lakehouse files with Spark?' },
      { q: { kind: 'action', user: 'Dee', action: 'view-pipeline-output' }, prompt: 'Can Dee view a pipeline run’s output?' },
    ],
  },
  {
    id: 'AM-10',
    title: 'One contributor, three security layers',
    machineIds: ['gate-keys', 'thread-sieves'],
    bulletIds: ['M1.1', 'M1.3'],
    difficulty: 3,
    sources: [ACCESS_SOURCES.whRls, ACCESS_SOURCES.ddm, ACCESS_SOURCES.smRls],
    trapPairId: 'access-layers',
    story: 'Cai is a Contributor. The warehouse has a security policy on dbo.Sales and a mask on dbo.Customers.Email. The semantic model on top has an RLS role North, and Cai is a member of it.',
    setup: {
      users: [{ name: 'Cai', role: 'Contributor', modelRoles: ['North'] }],
      warehouseRls: { table: 'Sales', column: 'Region', allow: { Cai: ['North'] } },
      masked: [{ table: 'Customers', column: 'Email' }],
      modelRls: [{ role: 'North', column: 'Region', values: ['North'] }],
      rlsValues: ['North', 'South'],
    },
    facts: [
      { label: 'Security policy mapping', value: 'Cai → North' },
      { label: 'Regions in the data', value: 'North, South' },
    ],
    questions: [
      { q: { kind: 'sql-rows', user: 'Cai' }, prompt: 'Which regions does Cai get from SELECT * FROM dbo.Sales in the warehouse?' },
      { q: { kind: 'masked', user: 'Cai', table: 'Customers', column: 'Email' }, prompt: 'Does Cai see masked emails in the warehouse?' },
      { q: { kind: 'model-rows', user: 'Cai' }, prompt: 'Which regions does Cai see through the semantic model?' },
      { q: { kind: 'action', user: 'Cai', action: 'run-pipeline' }, prompt: 'Can Cai run a pipeline in the workspace?' },
    ],
  },
]

export const accessPuzzles: Puzzle[] = scenarios.map(accessPuzzle)
