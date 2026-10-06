# Step 7 lab review: bridge-table steps (S1.3)

Step 7 Part A added two optional steps so S1.3 (bridge tables and many-to-many relationships) has hands-on practice:

- **L04/s9:** CTAS a bridge table `dbo.bridge_customer_product` (distinct customer and product keys from `fact.sales`) in Mill_Warehouse.
- **L07/s8:** build Bridge Model from Mill_Warehouse:
  - customer → bridge and product → bridge, both one-to-many
  - product → fact, one-to-many
  - Both directions on the product-to-bridge relationship
  - the bridge and key columns hidden
  - no direct customer → fact relationship and no many-to-many cardinality

S1.3 was removed from `LABS_PARTIAL`.

A separate reviewer agent, which didn't write the steps, fetched every cited page plus `fabric/data-warehouse/create-semantic-model` and `direct-lake-develop#create-the-model`. It worked the model through by hand on the exercise's sample orders. **Result:** 0 blockers, 2 major, 7 minor. Trial and privacy were clean.

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | Major | The model works, but a customer's value is the sales of the products that customer bought, by any customer, not the customer's own sales, because `fact.sales` already carries `customer_key`. A learner could misread it. | L07/s8 now says what the value means, explains that a real bridge is needed when the fact doesn't carry the other key (Learn's accounts-and-customers example), and hides the fact's customer key. |
| 2 | Major | `learn(P.ctas, 'syntax')` pointed at the Azure Synapse syntax section (which shows a required DISTRIBUTION option), not the Fabric one. | Now `#syntax-1`, the Fabric section. |
| 3 | Minor | T-SQL is valid for Fabric CTAS, and the referenced tables and columns exist. | No change. Added "dbo already exists". |
| 4 | Minor | No how-to for creating a model from a warehouse; the cited section only links out. | Steps added ("Open Mill_Warehouse, select New semantic model … Confirm, switch to Editing mode"), citing `create-semantic-model#create-a-new-power-bi-semantic-model-in-direct-lake-mode`. |
| 5 | Minor | The design matches Learn's guidance. Learn also says to hide key columns, and the step should say why the customer isn't related to the fact. | Hides key columns. Gives the ambiguous-path reason, citing `desktop-relationships-understand#resolve-relationship-path-ambiguity`. |
| 6 | Minor | The non-additive checkpoint is supported; it should say what's being summed. | The checkpoint now names "customer name and the sum of the sales amount". |
| 7 | Minor | "Source group" isn't stated for Direct Lake. | Trap note reworded to "one-to-many relationships between tables from one source stay regular". |
| 8 | Minor | The optional cleanup c2 cited an unrelated section and could leave Bridge Model in DP600-Dev. | c2 removed. Required cleanup c1 now says "If you did step 8, delete Bridge Model". |
| 9 | Minor | The bridge goes stale if `fact.sales` is reloaded. | L04/s9 says to drop and re-create it after a reload. |

After the fixes, `check:content` passes, and `check:links` passes: 218 URLs return 200, and all 208 cited lab sections exist.
