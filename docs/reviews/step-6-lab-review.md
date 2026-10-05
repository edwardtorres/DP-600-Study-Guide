# Step 6 lab review

A separate reviewer agent, which didn't write the labs, walked all 15 labs. It fetched every cited page (72 pages, all HTTP 200, every cited `#section` present) plus four uncited Learn pages it used to check claims:

- `fabric/fundamentals/direct-lake-web-modeling`
- `fabric/fundamentals/direct-lake-overview`
- `power-bi/transform-model/service-edit-data-models`
- `fabric/cicd/deployment-pipelines/compare-pipeline-content`

For each lab it checked:

- step order inside the lab
- dependencies between labs
- that each step matches its cited section
- whether checkpoints depend on data values
- cleanup
- trial-unavailable features and cost
- privacy
- platform labels

It confirmed the trial facts in the brief against the fabric-trial page.

**Result:** 47 findings (2 blockers, 15 major, 30 minor). I checked the evidence behind the blockers and the main major findings on Learn myself before fixing them, including:

- the exercise's fourth, inactive relationship
- "Get data or Transform data" in web modeling, and that only the model owner can use Get data
- the workspace setting "User can edit data models in the Power BI service (preview)" that writing DAX queries in the browser needs
- "Apply to existing tables" and the "up to 3 hours" delay for Eventhouse OneLake availability
- Viewing mode as the browser model editor's default
- the automatic initial Git sync when the branch or workspace is empty

After the fixes:

- `check:content` passes.
- `check:links` passes: 216 URLs return 200, and all 202 cited lab sections exist.
- `npm test` passes: 219 tests.
- All 8 e2e flows pass at both widths.

## Blockers

| # | Lab/step | Finding | Resolution |
|---|---|---|---|
| R1 | L07/s4, s6 | Only three relationships were created. The exercise's fourth (ship date, inactive) is what the USERELATIONSHIP measure needs. | s4 now creates all four relationships, with the ship-date one inactive. New checkpoint: "four relationships, and the ship-date one is inactive". Also cites web modeling's "Create a relationship" section. |
| R2 | L04/s8 (optional) | The SCD sections assume tables that the exercise's earlier sections create. | s8 now runs "Create the fact table" through "Load sample data" first, and cites those sections. |

## Major

| # | Lab/step | Finding | Resolution |
|---|---|---|---|
| R3 | L04/s8 | The checkpoint named a customer; the exercise changes a product. | It now says "the changed product has more than one row, and only one is marked current". |
| R4 | L11/s3 | Opened a warehouse before the lab creates one. | s3 now uses Mill_Warehouse, and L04 is added to L11's prerequisites. |
| R5 | L07/c1, L11/s8 | Test as role needs a saved report in the same workspace, but saving one was optional. | L07/s7 now saves **Sales Report** in DP600-Dev, and L07's cleanup keeps it. L09/s3, L10/s1, and L11/s8 use it by name. |
| R6 | L11/s8 | A browser step cited the Power BI Desktop RLS section. | Now cites `service-edit-data-models#define-row-level-security-roles-and-rules` (Manage roles in the browser) and the service's Test as role section. |
| R7 | L08/s6 | No how-to for adding an Import table in web modeling. | Rewritten: open in Editing mode, choose **Get data**, and add the view as an Import table. It notes owner-only access and possible credentials. Cites `direct-lake-web-modeling#composite-…`, `service-edit-data-models#get-data` and `#permissions`. |
| R8 | L08/s3, L10/s2 | Writing DAX queries in the browser needs a workspace setting the labs never mentioned. | L08/s3 says to turn on "User can edit data models in the Power BI service (preview)", then use **Write DAX queries** from the model's menu. L10/s2 points back to it. |
| R9 | L06/s6 | Turning on availability at database level skips existing tables unless "Apply to existing tables" is chosen. | s6 now says to turn it on for the table, or for the database with "Apply to existing tables". s7 warns that files can take up to a few hours to appear. |
| R10 | L03/s6 | No code to load the table for Data Wrangler. | Gives `df = spark.sql("SELECT * FROM raw_sales")`, and notes that Data Wrangler works with pandas and Spark DataFrames. |
| R11 | L14 | Used Mill_Warehouse without L04 as a prerequisite. | L04 added. |
| R12 | L15/s11 | Needed a lakehouse its prerequisites didn't provide. | s11 now names Mill_Lakehouse, and L02 is added to L15's prerequisites. |
| R13 | L15/s2–s4 | The sample orders are dated January–June 2026. A careless parameter range or archive period loads nothing. | s1 states the date range. s2 says to choose RangeStart/RangeEnd inside the first half of 2026. s4 says to archive at least 1 year. |
| R14 | L14/s5 | Learn doesn't confirm Export PBIDS for a Fabric warehouse source. | s5 says "if it isn't offered, report it and skip to step 6". Added to the Step 8 queue (Pattern Book `needsVerification`). |
| R15 | L13/s2 | An empty repository has no branch to connect to. | The repository is now created with a README, so a main branch exists. |
| R16 | L13/s3–s4 | The first connect-and-sync copies everything, so the separate commit step had nothing to commit. | s3 now covers connect plus the automatic initial sync (cites `#connect-to-a-workspace`). s4 is removed; s5 is the real commit. |
| R17 | L12/s6 | Learn doesn't confirm the exact lineage path for a Direct Lake on OneLake model. | Checkpoint loosened to "Arrows connect the lakehouse to Sales Model, directly or through its SQL analytics endpoint". This is lab-only, so it isn't queued. |

## Minor

| # | Lab/step | Resolution |
|---|---|---|
| R18 | L01/s5–s6 | Also cites the exercise's "licensing mode … (Trial, Premium, or Fabric)" text. The wording now says "a license mode or workspace type that uses your trial capacity (Trial)". |
| R19 | L01/s2–s3 | s2 says the Account manager shows days remaining, so use the day you started. s3 points to the Trial tab of the capacities page. |
| R20 | L02/s5, s8 | "Save & run" instead of "publish". s8 warns that running the dataflow again appends duplicate rows. |
| R21 | L02/s7 | Uses the exercise's destination folder and file name, so it doesn't overwrite the step 2 upload. |
| R22 | L02/c1–c2 | c1 now cites `onelake-shortcuts#how-do-shortcuts-handle-deletions`. c2 reworded to "if you set a schedule, remove it". |
| R23 | L02/s11 | SQL database added to the choices, matching scenario 4. |
| R24 | L02/c2, L13/s9 | The Copy pipeline is named Copy_Sales and L13 uses that name. The dataflow and any second pipeline may be deleted. |
| R25 | L06/s9 | Dropped the exercise citation that creates an eventstream. |
| R26 | L06/s1 | Dropped the Learn page that creates an empty eventhouse. |
| R27 | L07/s3 | Checkpoint adds the "tables still syncing, wait and retry" tip. |
| R28 | L06/s8, L07/c1, L03/c1 | Say to stop the Spark session; cite the exercise's "Stop session" cleanup. |
| R29 | L08/s1 | The view includes the product key, so s7 can relate it. |
| R30 | L08/s4, labs 7–11 | s4 names Sales Model SQL and says the setting applies only to Direct Lake on SQL. L07's "before" note says models open in Viewing mode; switch to Editing mode. L08/s4, L08/s6, and L11/s8 repeat it. |
| R31 | L08/s6, L06/s8, L13/s2 | Privacy warnings added for the server name, the OneLake path ids, and the repository URL/token. |
| R32 | L08/c1 | Cites the composite web-modeling section and the exercise's model settings. |
| R33 | L09/s3 | Checkpoint: "The legend lists the six calculation items". |
| R34 | L09/s4 | Browser how-to with an example expression, a note that labels may differ from the Desktop ribbon, and Learn's variant-measure warning (cites `calculation-groups#model-measures-change-to-variant-data-type`). |
| R35 | L09/s6 | Adds the exercise's "Complete the Date table" section. |
| R36 | L10/s5 | Cites `#use-performance-analyzer`. |
| R37 | L11 | Kept the `browser` platform: the only Windows step (s9) is optional, which the validator allows for browser labs. The "before" note now says so. |
| R38 | L11/s9 | OLS goes on a new role, with a warning that a `createOrReplace` script replaces a whole role, including its filter. |
| R39 | L11/c2 | Cites the browser "Define row-level security roles" section (where roles are deleted). |
| R40 | L12/s3, s7 | s3: don't send a certification request. s7: look at the All downstream items tab. |
| R41 | L13/s10 | Renames the Copy activity rather than editing the description; cites `compare-pipeline-content#compare-stages`. |
| R42 | L13/s11 | Neither deployed item supports rules, so the optional step is now read-only. |
| R43 | L14/s2 | Explains the TMDL definition/tables layout. The checkpoint accepts either format. |
| R44 | L15 | Large storage format moved before publish (workspace default) and cites `service-premium-large-models#set-default-storage-format`. |
| R45 | L15/s2 | States that Learn expects a Date/Time column and that this lab converts it in Power Query; report it if the slider stays disabled. |
| R46 | L15/s10 | Warns that Learn lists P and F SKUs and needs the "Semantic models can export data to OneLake" tenant setting; report it if the option is missing. |
| R47 | L03/s2 | Removed the WHERE vs HAVING trap callout: no step in the lab uses HAVING. |

## Checks with no finding

- No cleanup deletes something a later lab needs.
- No lab needs Copilot, data agents, AI functions, Trusted Workspace Access, or a paid Azure resource.
- Admin-only steps are warned (trial size, certification, labels, Git tenant switches). The two unwarned ones are now warned (R8, R46).
- These steps were confirmed against Learn:
  - L07/s3: the Direct Lake type dialog when creating from the SQL endpoint.
  - L08/s2–s4: Direct Lake on SQL with a view, TABLETRAITS, and DirectLakeBehavior.
  - L11/s4–s5: masking and RLS for Admin and dbo.
  - L13/s2: the fine-grained token.
  - L13/s7: two stages, fixed at creation.
  - L15/s7–s8: the workspace URL and SSMS connection.
