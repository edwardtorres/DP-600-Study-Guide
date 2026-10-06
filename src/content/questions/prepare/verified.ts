import { S } from '../sources'
import type { Question } from '../types'

/** Step 8: questions for needs-verification items that Learn now settles (PySpark cleaning, scalar UDFs). */

const cm = 'carding-machine'
const rb = 'recipe-book'

export const prepareVerifiedQuestions: Question[] = [
  {
    id: 'CM-V1',
    machineId: cm,
    bulletIds: ['P2.7'],
    format: 'single',
    difficulty: 2,
    stem: 'A notebook loads raw_sales into a Spark DataFrame. A source system retried some writes, so several rows share an order_id but have different load timestamps. You must keep exactly one row per order_id. Which PySpark call should you use?',
    sources: [S.notebookClean],
    options: [
      { id: 'a', text: 'df.dropDuplicates()', explain: 'With no column list, dropDuplicates() removes only rows that are identical in every column. These rows differ in their load timestamp, so they all stay.' },
      { id: 'b', text: 'df.dropna(subset=["order_id"])', explain: 'dropna drops rows where order_id is null. It doesn’t remove repeated order_id values.' },
      { id: 'c', text: 'df.dropDuplicates(["order_id"])', explain: 'Correct. Passing the business key de-duplicates on that column, keeping one row per order_id.' },
      { id: 'd', text: 'df.fillna({"order_id": 0})', explain: 'fillna replaces nulls with a default value. It doesn’t remove any rows.' },
    ],
    answer: 'c',
  },
  {
    id: 'CM-V2',
    machineId: cm,
    bulletIds: ['P2.7'],
    format: 'multi',
    difficulty: 2,
    stem: 'After de-duplicating a sales DataFrame in a notebook, you find nulls in two places. A missing region should appear as "Unknown" and a missing discount should count as 0, so totals don’t turn null. Rows with no customer_id can’t be joined to customer data and must be removed. Which two PySpark calls meet these requirements? Choose two.',
    sources: [S.notebookClean],
    options: [
      { id: 'a', text: 'df.fillna({"region": "Unknown", "discount": 0})', explain: 'Correct. fillna with a dictionary replaces nulls column by column with the value you give each one.' },
      { id: 'b', text: 'df.dropDuplicates(["customer_id"])', explain: 'This keeps one row per customer_id value, so it would drop valid sales. Removing rows with a missing key is what dropna does.' },
      { id: 'c', text: 'df.fillna({"customer_id": "Unknown"})', explain: 'This keeps the rows that must be removed, now with a key that matches no customer.' },
      { id: 'd', text: 'df.dropna(subset=["customer_id"])', explain: 'Correct. dropna with a subset removes only rows where customer_id is null.' },
    ],
    answers: ['a', 'd'],
  },
  {
    id: 'CM-V3',
    machineId: cm,
    bulletIds: ['P2.7'],
    format: 'yesno',
    difficulty: 2,
    stem: 'A data engineer is cleaning a lakehouse table with PySpark in a Fabric notebook. For each statement, select Yes if it is true. Otherwise, select No.',
    sources: [S.notebookClean],
    statements: [
      { id: 's1', text: 'df.dropDuplicates() with no arguments removes only rows that match in every column.', answer: true, explain: 'Yes. Without a column list it removes exact duplicate rows; pass a column list to de-duplicate on a business key.' },
      { id: 's2', text: 'df.dropDuplicates(["order_id"]) keeps every row whose order_id appears more than once.', answer: false, explain: 'No. It keeps one row per order_id.' },
      { id: 's3', text: 'Leaving a null in a numeric column can make calculations that use it return null.', answer: true, explain: 'Yes. A null in a numeric column produces null results for calculations that involve it, which is why you fill or drop nulls explicitly.' },
      { id: 's4', text: 'df.fillna(...) removes the rows that contain null values.', answer: false, explain: 'No. fillna replaces nulls with defaults. dropna is the call that removes rows.' },
    ],
  },
  {
    id: 'RB-V1',
    machineId: rb,
    bulletIds: ['P2.1'],
    format: 'single',
    difficulty: 3,
    preview: true,
    stem: 'In a Fabric warehouse, a developer creates a scalar user-defined function (preview) with WITH INLINE = AUTO. The function reads a customer’s start date from dbo.Customer and returns DATEDIFF(DAY, @MemberSince, GETUTCDATE()). Calling it to set a variable works, but using it in SELECT … FROM dbo.Customer fails. What should the developer change?',
    sources: [S.scalarUdf, S.createFunction],
    options: [
      { id: 'a', text: 'Replace GETUTCDATE() with SYSUTCDATETIME() inside the function', explain: 'Learn’s own example of a non-inlineable function uses SYSUTCDATETIME(), a nondeterministic system function, so the function still isn’t inlineable.' },
      { id: 'b', text: 'Pass the current date and time into the function as a parameter instead of calling GETUTCDATE() in its body', explain: 'Correct. A time-dependent built-in function in the body makes the UDF non-inlineable, and a non-inlineable scalar UDF can’t be used in a SELECT … FROM query on a user table. Learn’s fix is to pass the value in as a parameter.' },
      { id: 'c', text: 'Split the logic into several IF branches, each with its own RETURN statement', explain: 'Multiple RETURN statements make a data-access UDF non-inlineable, so this makes things worse.' },
      { id: 'd', text: 'Wrap the calculation in a WHILE loop that runs once', explain: 'A WHILE loop in the body also prevents scalar UDF inlining.' },
    ],
    answer: 'b',
  },
  {
    id: 'RB-V2',
    machineId: rb,
    bulletIds: ['P2.1'],
    format: 'yesno',
    difficulty: 2,
    preview: true,
    stem: 'A team is deciding whether to use scalar user-defined functions in Fabric Data Warehouse. For each statement, select Yes if it is true. Otherwise, select No.',
    sources: [S.createFunction, S.scalarUdf],
    statements: [
      { id: 's1', text: 'Scalar UDFs are currently a preview feature in Fabric Data Warehouse.', answer: true, explain: 'Yes. Learn labels scalar UDFs (and external UDFs) as preview features in Fabric Data Warehouse.' },
      { id: 's2', text: 'A scalar UDF that isn’t inlineable can be used in a SELECT … FROM query on a user table.', answer: false, explain: 'No. A non-inlineable scalar UDF can’t be part of a SELECT … FROM query on a user table, though it can run as a standalone call.' },
      { id: 's3', text: 'The is_inlineable column of sys.sql_modules shows whether a scalar UDF can be inlined.', answer: true, explain: 'Yes. is_inlineable is 1 when the definition is inlineable and 0 when it isn’t.' },
      { id: 's4', text: 'A scalar UDF whose body calls GETDATE() can be inlined.', answer: false, explain: 'No. A time-dependent built-in function such as GETDATE() prevents both inlining techniques.' },
    ],
  },
]
