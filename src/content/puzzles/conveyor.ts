import { conveyorPuzzle, type ConveyorScenario } from '../../puzzles/build'
import { DEPLOY_SOURCES } from '../../puzzles/evaluators/deployment'
import type { Puzzle } from '../../puzzles/types'

/**
 * Conveyor scenarios: users, roles, and actions in a deployment pipeline.
 * Every success/failure and binding outcome comes from the deployment evaluator.
 */

const base = (id: string, title: string, difficulty: 1 | 2 | 3) => ({
  id,
  title,
  machineIds: ['conveyor'],
  bulletIds: ['M2.3'],
  difficulty,
  sources: [DEPLOY_SOURCES.process],
  trapPairId: 'pipelines-vs-git',
})
const stages = ['Dev', 'Test', 'Prod']

const scenarios: ConveyorScenario[] = [
  {
    ...base('CN-01', 'Who can deploy notebooks', 1),
    story: 'A three-stage pipeline promotes notebooks. Each person tries one action.',
    stages,
    users: [
      { name: 'Pat', pipelineAdmin: true, roles: { Dev: 'Contributor', Test: 'Contributor', Prod: 'Viewer' } },
      { name: 'Lee', pipelineAdmin: true, roles: {} },
      { name: 'Kim', pipelineAdmin: false, roles: { Dev: 'Admin', Test: 'Admin', Prod: 'Admin' } },
    ],
    actions: [
      { action: { kind: 'deploy', user: 'Pat', from: 'Dev', to: 'Test', items: [{ name: 'Clean notebook', kind: 'notebook' }] }, prompt: 'Pat deploys a notebook from Dev to Test.' },
      { action: { kind: 'deploy', user: 'Pat', from: 'Test', to: 'Prod', items: [{ name: 'Clean notebook', kind: 'notebook' }] }, prompt: 'Pat deploys the notebook from Test to Prod.' },
      { action: { kind: 'deploy', user: 'Lee', from: 'Dev', to: 'Test', items: [{ name: 'Clean notebook', kind: 'notebook' }] }, prompt: 'Lee deploys the notebook from Dev to Test.' },
      { action: { kind: 'deploy', user: 'Kim', from: 'Dev', to: 'Test', items: [{ name: 'Clean notebook', kind: 'notebook' }] }, prompt: 'Kim deploys the notebook from Dev to Test.' },
      { action: { kind: 'delete-pipeline', user: 'Lee' }, prompt: 'Lee deletes the pipeline.' },
    ],
    bindings: [],
  },
  {
    ...base('CN-02', 'Assigning and comparing stages', 2),
    story: 'Two pipeline admins set up the stages.',
    stages,
    users: [
      { name: 'Ana', pipelineAdmin: true, roles: { Dev: 'Member', Test: 'Member', Prod: 'Admin' } },
      { name: 'Ben', pipelineAdmin: true, roles: { Dev: 'Admin', Test: 'Member', Prod: 'Contributor' } },
    ],
    actions: [
      { action: { kind: 'assign', user: 'Ana', stage: 'Prod' }, prompt: 'Ana assigns the Prod workspace to the Prod stage.' },
      { action: { kind: 'assign', user: 'Ben', stage: 'Test' }, prompt: 'Ben assigns the Test workspace to the Test stage.' },
      { action: { kind: 'compare', user: 'Ben', stages: ['Test', 'Prod'] }, prompt: 'Ben compares the Test and Prod stages.' },
      { action: { kind: 'view-history', user: 'Ana' }, prompt: 'Ana views the deployment history.' },
    ],
    bindings: [],
  },
  {
    ...base('CN-03', 'Direct Lake models and datasource rules', 3),
    story: 'Dev holds a lakehouse and three semantic models built on it. Everything is deployed to Test, where the paired lakehouse already exists. Mia owns the models.',
    stages,
    users: [
      { name: 'Mia', pipelineAdmin: true, roles: { Dev: 'Member', Test: 'Member', Prod: 'Member' }, owns: ['Sales DL-SQL model', 'Sales DL-OneLake model', 'Sales import model'] },
      { name: 'Lee', pipelineAdmin: true, roles: { Dev: 'Member', Test: 'Member', Prod: 'Member' } },
    ],
    actions: [
      { action: { kind: 'set-rule', user: 'Mia', stage: 'Test', item: 'Sales DL-SQL model' }, prompt: 'Mia sets a datasource rule on the Direct Lake on SQL model in Test.' },
      { action: { kind: 'set-rule', user: 'Lee', stage: 'Test', item: 'Sales DL-SQL model' }, prompt: 'Lee sets a datasource rule on the same model.' },
    ],
    bindings: [
      { case: { kind: 'model-to-source', storage: 'directlake-sql', datasourceRule: false }, prompt: 'Without any rule, where does the Direct Lake on SQL model in Test point?' },
      { case: { kind: 'model-to-source', storage: 'directlake-sql', datasourceRule: true }, prompt: 'With Mia’s datasource rule, where does the Direct Lake on SQL model in Test point?' },
      { case: { kind: 'model-to-source', storage: 'directlake-onelake', datasourceRule: true }, prompt: 'Mia also tries a datasource rule for the Direct Lake on OneLake model. Where does it point in Test?' },
      { case: { kind: 'model-to-source', storage: 'import', datasourceRule: false }, prompt: 'Where does the Import model in Test get its data after deployment?' },
    ],
  },
  {
    ...base('CN-04', 'Deploying reports and their models', 2),
    story: 'Rae, a Member in every stage and pipeline admin, deploys reports. The Sales model was deployed to Test last week but has never been deployed to Prod.',
    stages,
    users: [{ name: 'Rae', pipelineAdmin: true, roles: { Dev: 'Member', Test: 'Member', Prod: 'Member' } }],
    actions: [{ action: { kind: 'deploy', user: 'Rae', from: 'Dev', to: 'Test', items: [{ name: 'Sales report', kind: 'report' }] }, prompt: 'Rae deploys the Sales report from Dev to Test.' }],
    bindings: [
      { case: { kind: 'report-to-model', modelInTarget: true }, prompt: 'After deploying the Sales report to Test, which model is it connected to?' },
      { case: { kind: 'report-to-model', modelInTarget: false }, prompt: 'Rae then deploys only the report from Test to Prod, without selecting its model. What happens?' },
    ],
  },
  {
    ...base('CN-05', 'Dataflows and empty stages', 2),
    story: 'The Prod stage has no workspace yet. Quinn owns the Orders dataflow.',
    stages,
    users: [
      { name: 'Pat', pipelineAdmin: true, roles: { Dev: 'Contributor', Test: 'Contributor' } },
      { name: 'Quinn', pipelineAdmin: true, roles: { Dev: 'Contributor', Test: 'Contributor' }, owns: ['Orders dataflow'] },
      { name: 'Ray', pipelineAdmin: true, roles: { Dev: 'Viewer', Test: 'Viewer' } },
    ],
    actions: [
      { action: { kind: 'deploy', user: 'Pat', from: 'Dev', to: 'Test', items: [{ name: 'Orders dataflow', kind: 'dataflow' }] }, prompt: 'Pat deploys the Orders dataflow from Dev to Test.' },
      { action: { kind: 'deploy', user: 'Quinn', from: 'Dev', to: 'Test', items: [{ name: 'Orders dataflow', kind: 'dataflow' }] }, prompt: 'Quinn deploys the Orders dataflow from Dev to Test.' },
      { action: { kind: 'deploy', user: 'Pat', from: 'Test', to: 'Prod', items: [{ name: 'Load notebook', kind: 'notebook' }], targetEmpty: true }, prompt: 'Pat deploys a notebook from Test to the empty Prod stage.' },
      { action: { kind: 'deploy', user: 'Ray', from: 'Test', to: 'Prod', items: [{ name: 'Load notebook', kind: 'notebook' }], targetEmpty: true }, prompt: 'Ray deploys the notebook from Test to the empty Prod stage.' },
    ],
    bindings: [],
  },
  {
    ...base('CN-06', 'An admin in one stage only', 3),
    story: 'Lee administers the Dev workspace but is only a Viewer in Test. Kim is Admin in every workspace but was never added to the pipeline.',
    stages,
    users: [
      { name: 'Lee', pipelineAdmin: true, roles: { Dev: 'Admin', Test: 'Viewer', Prod: 'Viewer' } },
      { name: 'Kim', pipelineAdmin: false, roles: { Dev: 'Admin', Test: 'Admin', Prod: 'Admin' } },
    ],
    actions: [
      { action: { kind: 'assign', user: 'Lee', stage: 'Dev' }, prompt: 'Lee assigns the Dev workspace to the Dev stage.' },
      { action: { kind: 'compare', user: 'Lee', stages: ['Dev', 'Test'] }, prompt: 'Lee compares Dev with Test.' },
      { action: { kind: 'deploy', user: 'Lee', from: 'Dev', to: 'Test', items: [{ name: 'Sales lakehouse', kind: 'lakehouse' }] }, prompt: 'Lee deploys the Sales lakehouse from Dev to Test.' },
      { action: { kind: 'view-history', user: 'Kim' }, prompt: 'Kim views the pipeline’s deployment history.' },
    ],
    bindings: [{ case: { kind: 'model-to-source', storage: 'directlake-onelake', datasourceRule: false }, prompt: 'A Direct Lake on OneLake model and its lakehouse are later deployed to Test with no rules. Where does the model point?' }],
  },
]

export const conveyorPuzzles: Puzzle[] = scenarios.map(conveyorPuzzle)
