# Step 1 audit: Fabric Mill

Step 1 is built and pushed to `main` as one commit (`69695e0`), authored as the noreply address. All checks pass:

| Check | Result |
|---|---|
| Typecheck (strict) | pass |
| Lint | pass |
| Tests (`npm test`) | 31/31 pass in 5 files |
| `check:content` | pass: 3 domains, 7 sections, 41 bullets, each in exactly one of 35 machines (4 Orientation), 39 threads |
| `check:content -- --live` | the live page matches the recorded outline (41 bullets) |
| Drift test | I removed a bullet and remapped one machine by hand; the check failed with specific errors each time. Both files were restored. |
| `check:secrets` | pass (44 files) |
| Build | pass |

In the screenshots, the page has no horizontal scroll at desktop or phone width; on a phone, the map scrolls sideways inside its own box.

The study guide page shows "Skills measured as of October 19, 2026" with 3 domains, 7 sections and 41 bullets (11 / 18 / 12), so no stop was needed.

## Machines and bullet mapping

Tags: **[PL]** = PL-300 carryover, **[Win]** = Windows-only lab.

**Front Office (Orientation, no exam bullets):**

- Founding Charter: What Fabric is and its workloads
- Water Wheel: OneLake, capacities and workspaces
- Three Vats: Lakehouse vs warehouse vs eventhouse
- Mill Lease: Get a Fabric trial workspace

**Spinning Floor & Dye House (Prepare data, 18 bullets):**

| Machine | Bullets |
|---|---|
| Thread Intake [PL] | P1.1 Create a data connection · P1.3 Ingest or access data as needed |
| Bale Catalog | P1.2 Discover data by using OneLake catalog and Real-Time hub |
| Vat Selector | P1.4 Choose between different data stores |
| Shared Spool | P1.5 OneLake integration for Eventhouse and semantic models |
| Carding Machine [PL] | P2.7 Duplicates/missing/nulls · P2.8 Convert column data types · P2.9 Filter data |
| Twisting Frame [PL] | P2.5 Aggregate · P2.6 Merge or join |
| Dye Vat [PL] | P2.2 Enrich data with new columns or tables |
| Weave Planner [PL] | P2.3 Star schema for a lakehouse or warehouse · P2.4 Denormalize |
| Inspection Bench | P3.1 Visual query editor · P3.2 SQL |
| Recipe Book | P2.1 Views, functions, stored procedures |
| Kusto Tension Meter | P3.3 KQL |
| DAX Scale [PL] | P3.4 DAX (query) |

**Loom Hall (Semantic models, 12 bullets):**

| Machine | Bullets |
|---|---|
| Loom Gearbox [PL] | S1.1 Choose a storage mode |
| Warp Frame [PL] | S1.2 Star schema for a semantic model · S1.3 Relationships, bridge tables, many-to-many |
| Punch-Card Reader [PL] | S1.4 DAX variables and functions |
| Jacquard Head [PL, partial] | S1.5 Calculation groups, dynamic format strings, field parameters |
| Wide Beam | S1.6 Large semantic model storage format |
| Double Loom | S1.7 Composite models |
| Speed Governor [PL] | S2.1 Query and visual performance · S2.2 DAX performance |
| Direct Lake Shuttle | S2.3 Configure Direct Lake · S2.4 Direct Lake on OneLake vs on SQL analytics endpoint |
| Batch Winder [PL, caveat] | S2.5 Incremental refresh |

**Gatehouse & Pattern Room (Maintain, 11 bullets):**

| Machine | Bullets |
|---|---|
| Gate Keys [PL] | M1.1 Workspace-level access |
| Item Locks [PL] | M1.2 Item-level access |
| Thread Sieves [PL, partial] | M1.3 Row-, column-, object- and file-level access |
| Seal & Stamp [PL] | M1.4 Sensitivity labels · M1.5 Endorse items |
| Pattern Ledger | M2.1 Version control for a workspace |
| Draft Table [Win] | M2.2 .pbip projects |
| Conveyor | M2.3 Deployment pipelines |
| Ripple Map | M2.4 Impact analysis |
| Remote Loom Control | M2.5 XMLA endpoint |
| Pattern Book [PL, partial] [Win] | M2.6 .pbit, .pbids and shared semantic models |

## Edges (prerequisite → machine: reason)

- Founding Charter → Water Wheel: OneLake, capacities and workspaces are the platform under every workload.
- Water Wheel → Three Vats: the three stores are items in OneLake inside a workspace.
- Water Wheel → Mill Lease: a trial gives you a capacity and workspace.
- Water Wheel → Gate Keys: workspace roles apply to workspaces.
- Three Vats → Thread Intake: you ingest into a specific store.
- Three Vats → Bale Catalog: the catalog lists items by type.
- Three Vats → Vat Selector: you choose among store types you know.
- Three Vats → Loom Gearbox: storage modes depend on where the data lives.
- Thread Intake → Shared Spool: OneLake integration exposes data that has already been ingested.
- Thread Intake → Carding Machine: you clean data after bringing it in.
- Thread Intake → Inspection Bench: you query data that is already loaded.
- Thread Intake → Kusto Tension Meter: KQL runs on data ingested into an eventhouse.
- Thread Intake → Ripple Map: impact analysis traces items fed by connections, dataflows and stores.
- Thread Intake → Pattern Book: a .pbids file packages a data connection.
- Carding Machine → Twisting Frame: joins and aggregations need clean, typed, de-duplicated keys.
- Carding Machine → Dye Vat: derived columns build on cleaned columns.
- Twisting Frame → Weave Planner: building dimensions and denormalizing are merge and aggregate work.
- Vat Selector → Weave Planner: a star schema is built differently in a lakehouse than in a warehouse.
- Vat Selector → Direct Lake Shuttle: choosing between the two Direct Lake options needs lakehouse and warehouse basics.
- Inspection Bench → Recipe Book: views and stored procedures wrap SELECT queries.
- Loom Gearbox → Warp Frame: you pick a storage mode before modeling.
- Loom Gearbox → Wide Beam: large model format matters for import models.
- Loom Gearbox → Batch Winder: incremental refresh partitions import or hybrid tables.
- Loom Gearbox → Direct Lake Shuttle: Direct Lake is a storage mode.
- Loom Gearbox → Ripple Map: semantic models are the downstream items impact analysis most often flags.
- Warp Frame → Punch-Card Reader: DAX filter context flows through relationships.
- Warp Frame → Double Loom: composite models extend an existing star schema.
- Warp Frame → DAX Scale: DAX queries select from the model's tables.
- Warp Frame → Remote Loom Control: you manage a model's tables and relationships over XMLA.
- Warp Frame → Pattern Book: shared models and templates reuse a model you have built.
- Punch-Card Reader → Jacquard Head: calculation groups and format strings are written in DAX.
- Punch-Card Reader → Speed Governor: you can only tune DAX you can write.
- Gate Keys → Item Locks: item permissions sit on top of workspace roles.
- Gate Keys → Pattern Ledger: connecting a workspace to Git needs the workspace Admin role.
- Gate Keys → Remote Loom Control: XMLA write access depends on workspace permissions.
- Item Locks → Thread Sieves: row/column/object-level security narrows access that item permissions already grant.
- Item Locks → Seal & Stamp: labeling and endorsing need item permissions.
- Pattern Ledger → Draft Table: .pbip is the source-control format for Power BI items.
- Pattern Ledger → Conveyor: deployment pipelines work alongside Git integration.

The graph is acyclic, every machine is reachable from Founding Charter, and a test confirms no edge is already implied by the others.

## Tags

- **Orientation:** the 4 Front Office machines.
- **PL-300 carryover (17 machines):** each tag quotes the matching bullets from the current PL-300 study guide (as of April 20, 2026), which I read on Learn.
- **Windows labs:** Draft Table and Pattern Book. 10 machines are marked "tbd" and the rest "browser"; all of these are provisional until Step 6.

## Things I wasn't sure of

- **Incremental refresh** is tagged PL-300 because you named it, but it isn't in the current PL-300 outline. The closest PL-300 bullet is scheduled refresh, and the app shows that caveat.
- **Composite models, bridge tables and many-to-many relationships** aren't in the current PL-300 outline either. I left Double Loom untagged.
- Calculation groups, row-level security and shared models are only partial PL-300 overlaps. Those machines have caveats saying what is new.
- **Two edge reasons are from memory, not yet checked on Learn:** "Git connect needs the workspace Admin role" and "XMLA write depends on workspace permissions". They're queued for the Step 8 fact-check.
- **Shared Spool** depends only on Thread Intake. I assumed you already know import mode from PL-300.
- **The study guide page** says it includes "two versions" of the skills list, but only the October 19, 2026 one is in the page.
- **Learning path 4** (AI-ready data / Fabric IQ) is in the DP-600T00 course but has no outline bullet, so it isn't mapped to any machine.
- **Question formats:** Microsoft doesn't say which formats DP-600 itself uses. CLAUDE.md lists the types from the general exam-experience page (including case studies and Yes/No problem-solution sets) with that caveat.

## Deviations from the prompt

- **Commit trailer:** I left out the `Claude-Session:` link my tooling normally adds, because it's a private link and your rule forbids those.
- **Branch:** I renamed the default branch from `master` to `main` and pushed it.
- **Git name:** commits use the name "edwardtorres", since you only gave an email.
- **Linter:** I used oxlint, which the current Vite template ships, instead of ESLint.
- **Extra test:** I added a test that machines don't overlap on the map.
- **Visual check only:** the screenshots were taken in a test browser that couldn't load Google Fonts, so they show fallback fonts.

Step 2 starts only after approval.
