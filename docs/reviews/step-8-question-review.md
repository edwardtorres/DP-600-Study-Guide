# Step 8 question review

New questions for needs-verification items that Learn now settles (Part B). Reviewed by a separate agent that didn't write them: a blind pass, then a source pass.

| Id | Item | Bullet | Format | Difficulty |
|---|---|---|---|---|
| CM-V1 | PySpark de-duplication | P2.7 | single | 2 |
| CM-V2 | PySpark null handling | P2.7 | multi | 2 (was 3) |
| CM-V3 | PySpark de-duplication and nulls | P2.7 | yesno | 2 |
| RB-V1 | Scalar UDFs (preview) | P2.1 | single | 3 |
| RB-V2 | Scalar UDFs (preview) | P2.1 | yesno | 2 |
| DS-V1 | DDM as a Direct Lake fallback cause | S2.3 | single | 2 |
| DS-V2 | DDM with DirectLakeOnly | S2.3 | single | 3 |

## Blind pass

`compare-review.ts`: **7/7 match** (0 missing).

## Source pass

All cited pages returned 200. No blockers or majors. Three minor findings, all fixed:

1. **CM-V2, option b's explanation:** "doesn't remove rows whose customer_id is null" isn't on Learn, and Spark keeps one null-key row rather than all of them.
   - Fix: the explanation now says it keeps one row per customer_id value, so it would drop valid sales, and that removing rows with a missing key is what dropna does.
2. **CM-V2, difficulty:** the stem and both correct options closely follow the Learn unit.
   - Fix: lowered from 3 to 2.
3. **DS-V1, option d's explanation:** "Masking doesn't make refresh fail" isn't stated on Learn.
   - Fix: replaced with a sentence tied to what How Direct Lake works says (masking is a query condition; with Automatic the result is fallback).

The reviewer confirmed:
- `preview: true` on RB-V1 and RB-V2 ("Scalar UDFs are currently a preview feature in Fabric Data Warehouse").
- DS-V2 isn't ambiguous: How Direct Lake works lists DDM as a fallback condition, and DirectLakeOnly makes such a query fail.

## Re-review of a changed key (Part C)

- **WP-09:** the fact-check found the key contradicted Learn ("A stock balance measure in an inventory fact table can't be summed across other products").
  - The question was rewritten on Learn's own example (item age sampled nightly: summed across items on a shelf each night, not across nights).
  - A separate reviewer answered it blind: **1/1 match**.
  - Source pass: OK. The reviewer suggested difficulty 2 or 1; it stays at 2.
