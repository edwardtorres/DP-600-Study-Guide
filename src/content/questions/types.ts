export type QuestionFormat = 'single' | 'multi' | 'yesno' | 'order' | 'match' | 'dropdown'
export type Difficulty = 1 | 2 | 3

export interface Choice {
  id: string
  text: string
  /** Why this option is right or wrong. */
  explain: string
}

interface QuestionBase {
  id: string
  machineId: string
  /** Outline bullets tested. Empty only for Orientation machines. */
  bulletIds: string[]
  difficulty: Difficulty
  /** Microsoft-style scenario stem. */
  stem: string
  /** learn.microsoft.com pages that confirm the key. */
  sources: string[]
  /** A "don't confuse" pair id from the notes, when the question tests one. */
  trapPairId?: string
  /** Involves a Preview feature. */
  preview?: true
  /** Usable in a PL-300 placement check (tests what DP-600 adds, in Fabric terms). */
  placement?: true
  caseStudyId?: string
}

export interface SingleQuestion extends QuestionBase {
  format: 'single'
  options: Choice[]
  answer: string
}

export interface MultiQuestion extends QuestionBase {
  format: 'multi'
  options: Choice[]
  answers: string[]
}

export interface YesNoQuestion extends QuestionBase {
  format: 'yesno'
  statements: { id: string; text: string; answer: boolean; explain: string }[]
}

export interface OrderQuestion extends QuestionBase {
  format: 'order'
  /** Listed in display (shuffled) order; explain says where the step belongs and why. */
  items: Choice[]
  answerOrder: string[]
}

export interface MatchQuestion extends QuestionBase {
  format: 'match'
  prompts: { id: string; text: string }[]
  choices: { id: string; text: string }[]
  pairs: { promptId: string; choiceId: string; explain: string }[]
}

export interface DropdownQuestion extends QuestionBase {
  format: 'dropdown'
  language: 'tsql' | 'kql' | 'dax'
  /** Code with [[slotId]] placeholders. */
  code: string
  slots: { id: string; options: Choice[]; answer: string }[]
}

export type Question = SingleQuestion | MultiQuestion | YesNoQuestion | OrderQuestion | MatchQuestion | DropdownQuestion

export interface CaseStudy {
  id: string
  /** Fictional company. */
  company: string
  title: string
  summary: string
  environment: string[]
  requirements: string[]
  constraints: string[]
}
