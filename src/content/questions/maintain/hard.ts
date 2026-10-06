import { S } from '../sources'
import type { Question } from '../types'

/** Step 7: difficulty-3 scenario questions for Maintain a data analytics solution. */

const gk = 'gate-keys'
const ss = 'seal-and-stamp'
const pl = 'pattern-ledger'
const rm = 'ripple-map'
const pb = 'pattern-book'
const dt = 'draft-table'
const rl = 'remote-loom-control'

export const maintainHardQuestions: Question[] = [
  {
    id: 'GK-H1',
    machineId: gk,
    bulletIds: ['M1.1'],
    format: 'single',
    difficulty: 3,
    trapPairId: 'member-vs-contributor',
    stem: 'Dana belongs to two security groups. Group A has the Viewer role on the Sales workspace and is a member of the semantic model’s Region RLS role. Group B has the Contributor role on the same workspace. Dana sees every region’s rows in a report built on the model. Why?',
    sources: [S.roles, S.modelRls],
    options: [
      { id: 'a', text: 'RLS roles are additive, so membership in two groups shows every region', explain: 'Roles are additive across RLS roles, but here only one RLS role is involved; the cause is Dana’s workspace role.' },
      { id: 'b', text: 'Viewers bypass RLS when they also have Build permission', explain: 'Build doesn’t change it: RLS restricts users with Viewer permissions.' },
      { id: 'c', text: 'Dana gets the highest role assigned through her groups, Contributor, and RLS only restricts Viewers', explain: 'Correct. A user in several groups gets the highest role they’re assigned, and semantic model RLS doesn’t apply to Admins, Members, or Contributors, who can edit the model.' },
      { id: 'd', text: 'Workspace roles apply at capacity level, so the Viewer assignment is ignored', explain: 'Workspace roles apply only to that workspace, not to the capacity.' },
    ],
    answer: 'c',
  },
  {
    id: 'SL-H1',
    machineId: ss,
    bulletIds: ['M1.5'],
    format: 'single',
    difficulty: 3,
    trapPairId: 'endorse-vs-label',
    stem: 'A data governance lead wants three things: the customer lakehouse marked as the organization’s authoritative customer list, the sales semantic model marked as meeting quality standards, and the executive dashboard marked the same way. The lead has write permission on all three but isn’t on any admin-specified list. Which plan is possible?',
    sources: [S.endorsement],
    options: [
      { id: 'a', text: 'The lead applies Master data to the lakehouse, certifies the model, and certifies the dashboard', explain: 'Master data and certification can only be applied by users the Fabric admin specifies, and dashboards can’t be endorsed.' },
      { id: 'b', text: 'An admin-specified user applies Master data to the lakehouse, an authorized reviewer certifies the model, and the dashboard stays unendorsed', explain: 'Correct. Only admin-specified users can apply Master data or certify, Master data applies to items that contain data, and Power BI dashboards can’t be promoted or certified.' },
      { id: 'c', text: 'The lead promotes all three items, which makes them authoritative', explain: 'Promotion only says the creator thinks the item is ready to share, and dashboards can’t be promoted.' },
      { id: 'd', text: 'An admin applies a sensitivity label to all three items to mark them as authoritative', explain: 'A sensitivity label says how sensitive data is, not how trustworthy it is.' },
    ],
    answer: 'b',
  },
  {
    id: 'SL-H2',
    machineId: ss,
    bulletIds: ['M1.5'],
    format: 'yesno',
    difficulty: 3,
    stem: 'A company organizes Fabric content into domains and wants each domain to manage its own certification. For each statement, select Yes if it is true. Otherwise, select No.',
    sources: [S.endorsement],
    statements: [
      { id: 's1', text: 'A Fabric admin can delegate certification to domain admins so each domain has its own reviewers.', answer: true, explain: 'Yes. Certification must be enabled by a Fabric admin and can be delegated to domain admins.' },
      { id: 's2', text: 'Only users the Fabric admin specifies can certify items.', answer: true, explain: 'Yes. Anyone can request certification, but only authorized reviewers specified by the Fabric admin can certify.' },
      { id: 's3', text: 'Promoting an item requires approval from a Fabric admin.', answer: false, explain: 'No. Any user with write permission on an item can promote it (Power BI dashboards can’t be endorsed).' },
    ],
  },
  {
    id: 'SL-H3',
    machineId: ss,
    bulletIds: ['M1.4'],
    format: 'single',
    difficulty: 2,
    stem: 'A semantic model carries a sensitivity label with protection from Microsoft Purview. Analysts export data from reports built on it in several ways. In which case does the label’s protection travel with the exported file?',
    sources: [S.infoProtection],
    options: [
      { id: 'a', text: 'Export to a CSV file', explain: 'CSV and TXT exports aren’t protected.' },
      { id: 'b', text: 'Sharing the data with a user in another tenant', explain: 'Label access control works only in the tenant where it was applied.' },
      { id: 'c', text: 'Export to Excel', explain: 'Correct. Protection travels with Excel, PDF, and PowerPoint exports and with .pbix downloads.' },
      { id: 'd', text: 'Copying a visual’s values to the clipboard and pasting them into a text file', explain: 'Learn lists supported export paths; plain text isn’t one of them, so protection doesn’t follow.' },
    ],
    answer: 'c',
  },
  {
    id: 'PL-H1',
    machineId: pl,
    bulletIds: ['M2.1'],
    format: 'single',
    difficulty: 3,
    trapPairId: 'commit-vs-update',
    stem: 'Git integration is enabled for the tenant. A workspace Member must connect the team workspace to a GitHub branch, and later the Contributors on the team must be able to switch the workspace to a feature branch themselves. What has to happen?',
    sources: [S.gitProcess, S.roles],
    options: [
      { id: 'a', text: 'The Member connects the workspace; Contributors can switch branches by default', explain: 'Only a workspace Admin can connect a workspace to Git, and switching branches needs an Admin setting.' },
      { id: 'b', text: 'A workspace Admin connects the workspace and turns on “Allow users with at least Contributor role to change Git branch”', explain: 'Correct. Only Admins connect or disconnect a workspace, and Members and Contributors can switch the connected branch only after an Admin enables that setting.' },
      { id: 'c', text: 'A tenant admin connects the workspace from the admin portal and gives Contributors the Member role', explain: 'Workspace connection happens in the workspace by a workspace Admin, and Member still can’t connect it.' },
      { id: 'd', text: 'The Member commits all items first, which connects the workspace to the branch', explain: 'Committing needs an existing connection; it doesn’t create one.' },
    ],
    answer: 'b',
  },
  {
    id: 'RM-H1',
    machineId: rm,
    bulletIds: ['M2.4'],
    format: 'single',
    difficulty: 3,
    trapPairId: 'lineage-vs-impact',
    stem: 'You plan to drop a column from a lakehouse table. Reports in three other workspaces may depend on it through semantic models, and their owners must be warned before the change. You have write permission on the lakehouse. What should you do?',
    sources: [S.impact, S.lineage],
    options: [
      { id: 'a', text: 'Open lineage view in the lakehouse’s workspace and email the owners of the items it shows', explain: 'Lineage view shows the items in its own workspace (plus upstream sources one level out), not downstream items in other workspaces.' },
      { id: 'b', text: 'Open impact analysis on the lakehouse, switch to All downstream items, and use Notify contacts', explain: 'Correct. Impact analysis lists downstream items across workspaces, and Notify contacts emails the contact lists of all affected workspaces.' },
      { id: 'c', text: 'Open impact analysis on each report as a Viewer', explain: 'Impact analysis needs write permission on the item, and starting from the reports misses what depends on the lakehouse.' },
      { id: 'd', text: 'Search the OneLake catalog for items with the column name', explain: 'The catalog helps discover items; it doesn’t trace dependencies or notify owners.' },
    ],
    answer: 'b',
  },
  {
    id: 'PB-H1',
    machineId: pb,
    bulletIds: ['M2.6'],
    format: 'single',
    difficulty: 2,
    stem: 'A certified shared semantic model lives in a workspace on an F32 capacity. Report authors in other workspaces have only free licenses and were granted Build permission, but they can’t build reports on the model. What would let them build reports while keeping their free licenses?',
    sources: [S.sharedModels],
    options: [
      { id: 'a', text: 'Grant them Reshare permission on the model', explain: 'Resharing doesn’t change the capacity requirement for free users.' },
      { id: 'b', text: 'Promote the model in addition to certifying it', explain: 'Endorsement helps discovery; it doesn’t change licensing or access.' },
      { id: 'c', text: 'Export the model as a .pbit for each author', explain: 'A template copies the model definition without data; it doesn’t give access to the shared model.' },
      { id: 'd', text: 'Move the model’s workspace to a Premium or an F64-or-larger capacity', explain: 'Correct. Free-license users can build reports from shared models with Build permission only when the model is on Premium or an F64-or-larger capacity.' },
    ],
    answer: 'd',
  },
  {
    id: 'DT-H1',
    machineId: dt,
    bulletIds: ['M2.2'],
    format: 'yesno',
    difficulty: 3,
    trapPairId: 'pbi-files',
    stem: 'Your team saves a report as a Power BI Desktop project (.pbip), commits it to Git, and deploys it through Fabric Git integration. For each statement, select Yes if it is true. Otherwise, select No.',
    sources: [S.pbip],
    statements: [
      { id: 's1', text: 'The generated .gitignore keeps the local data cache (cache.abf) out of source control.', answer: true, explain: 'Yes. The .gitignore excludes cache.abf and localSettings.json, so data isn’t committed.' },
      { id: 's2', text: 'Deploying through Git integration also deploys the model’s data, so no refresh is needed.', answer: false, explain: 'No. Paths other than Desktop Publish deploy metadata only, so the model must be refreshed in the service.' },
      { id: 's3', text: 'The project can’t be opened without its .pbip file.', answer: false, explain: 'No. The .pbip file is optional; you can open the report from its definition.pbir.' },
    ],
  },
  {
    id: 'RL-H1',
    machineId: rl,
    bulletIds: ['M2.5'],
    format: 'single',
    difficulty: 3,
    trapPairId: 'xmla-read-vs-readwrite',
    stem: 'An engineer wants to run a TMSL refresh from SSMS that reloads one partition of a model with an incremental refresh policy, overriding the policy for that run. The workspace is on a Fabric capacity, and the engineer can already query the model from DAX Studio. Which combination is required?',
    sources: [S.xmla, S.tmslRefresh, S.largeModels],
    options: [
      { id: 'a', text: 'The capacity’s XMLA Endpoint set to Read Write, and the engineer at least Contributor in the workspace', explain: 'Correct. Writes such as TMSL refresh need read-write XMLA (read-only is the default), and Contributors and above have Write permission on semantic models over XMLA. TMSL refresh can override an incremental refresh policy.' },
      { id: 'b', text: 'The default read-only XMLA setting, and Build permission on the model', explain: 'Read-only allows queries like the DAX Studio ones, not refresh operations.' },
      { id: 'c', text: 'The workspace moved to Pro, and the engineer made a Viewer', explain: 'Pro workspaces don’t support XMLA write operations, and Viewers don’t have Write permission.' },
      { id: 'd', text: 'XMLA set to Read Write on the workspace only, with the engineer as a Viewer', explain: 'The XMLA setting is a capacity setting that applies to all its workspaces, and a Viewer can’t write.' },
    ],
    answer: 'a',
  },
]
