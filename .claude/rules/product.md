---
paths:
  - "src/features/product/**"
  - "src/features/order/order-product.entity.ts"
  - "src/features/order-shipping/**"
---

# Product Model Protocol

**Scope:** How `product`, `product_variant` and `product_option` divide the catalog between them,
and which of the three a new piece of information belongs to.

This is the one place in the schema where the table layout encodes domain rules that the columns
alone do not reveal. Read it before adding a column to any `product*` entity — the answer is
usually "a different table than the obvious one".

## 1. The three layers

| Layer | Table | Answers |
|---|---|---|
| Catalog entry | `product` | What is this, in the menu or the listing? |
| Purchasable unit | `product_variant` | What exactly goes in the basket, at what price? |
| Adjustment | `product_option` | How is that unit modified at order time? |
| Composition | `product_bundle_item` | Which *other* products make this one up? |

**A variant is a different thing to sell. An option modifies the thing being sold.**

The test: *can you sell it on its own, and does it have its own price row?* A 32 cm Margherita is a
thing — own SKU, own price, own food cost. "Stuffed crust" is not a thing; it is +8 RON on whatever
it was attached to.

Two consequences follow:

- Variants are **mutually exclusive and exactly one** — every order line cites exactly one
  `variant_id`.
- Options are **optional, stackable and many** — a line may carry zero, or five.

Getting this backwards has a concrete cost. Colour as an *option* means one SKU for every colour, so
you can never know how many black ones are left. Gift wrap as a *variant* doubles the SKU count for
something that is not a product.

## 2. Variants

- **Every product carries at least one variant, even when nothing varies.** A single-variant product
  is the normal case, not a special one. The service layer creates the default variant alongside the
  product. The alternative — prices on both the product and the variant — means two places to look
  and a precedence rule to remember.
- `product_price` is keyed on `variant_id`, never on `product_id`. So is stock: `grn_item` and
  `warehouse_movement` both point at the variant, because the variant is the thing that runs out.
- **Price is per market, cost is not.** `product_price` holds `price`, `rrp` and `min_price` per
  currency, since those are quoted rather than converted. `product_variant.cost_price` is a single
  base-currency figure — the books are kept in one currency, a foreign purchase is converted once
  at the receiving day's rate and frozen, and margin settles in base on both sides via
  `order_product.exchange_rate`. Converting cost at read time would make last month's margin move
  with today's rate.
- **`track_stock` decides whether stock applies at all**, per variant. False for a restaurant dish,
  true for a shirt on a shelf. It cannot be derived from `product.type` — a dish and a
  print-on-demand shirt are both `physical` and neither is stocked. `low_stock_threshold` and
  `allow_backorder` sit beside it.
- `product.sku` is the style code; `product_variant.sku` is what is actually sold. `barcode` sits on
  the variant, because a barcode identifies one sellable unit — two sizes carry two different EANs.
- What distinguishes the siblings lives in `product_variant_attribute`, so the axes are whatever the
  catalog needs rather than a fixed size/colour pair.
- Its unique key stops at the label (`variant_id`, `attribute_label_id`), so a variant holds exactly
  one value per axis. Contrast `product_attribute`, whose key includes the value: a product may list
  three allergens under one label, a variant cannot be both `large` and `small`.
- At most one `is_default` per product, held by a partial unique index. A row-level `@Check` cannot
  see the set of rows it needs to count.

## 3. Options

An **option group** is a question asked at order time; the **options** are its answers; a
**`product_option_price`** row carries what each answer does to the price, per currency.

Cardinality is expressed *only* as `min_select` / `max_select`. There is no `is_required` flag and
no single/multiple enum, because either would have to agree with the bounds forever, and that is the
pair nobody notices drifting.

| min | max | Shape |
|---|---|---|
| 1 | 1 | Required, radio buttons — *crust, steak doneness* |
| 0 | 1 | Optional single — *add a side* |
| 0 | `null` | Optional, unlimited — *extras* |
| 2 | 2 | Exactly two — *"choose 2 sides"* |
| 1 | `null` | At least one — *"pick your toppings"* |

Deltas are **per currency**, like `product_price`. A delta carries a currency whether or not a column
says so: adding 3 to a price quoted in EUR is only correct if the 3 is EUR. One figure for every
market is silently wrong in the line total, which is the one place an error compounds.

Deltas are **signed**. A "Side" group on a combo can offer *No side, −5.00* — the customer declines
the fries and the price drops. That is an option, not a discount: it describes what was ordered, not
a promotion.

Labels on both groups and options are `term` rows, so the Romanian menu renders from the same
records as the English one.

## 4. Worked example — Pizza Margherita

**Product** `PIZZA-MARG`, `unit = piece`, `vat_category = reduced`, no brand.

**Variants** — size is the axis, so it is a variant: different price, different dough cost.

| Variant | sku | is_default | price (RON) |
|---|---|---|---|
| Ø 25 cm | `PIZZA-MARG-25` | yes | 32.00 |
| Ø 32 cm | `PIZZA-MARG-32` | no | 45.00 |

Each links to `product_variant_attribute`: label term *Size*, values *25 cm* / *32 cm*.

**Option groups** — three questions asked at order time:

| Group | min | max | Meaning |
|---|---|---|---|
| Crust | 1 | 1 | Exactly one |
| Extra toppings | 0 | 4 | Optional, up to four |
| Side | 0 | 1 | Optional, at most one |

**Options** and their deltas:

| Group | Option | is_default | price_delta (RON) |
|---|---|---|---|
| Crust | Classic | yes | 0.00 |
| Crust | Thin | no | 0.00 |
| Crust | Stuffed | no | +8.00 |
| Extra toppings | Extra mozzarella | no | +6.00 |
| Extra toppings | Prosciutto | no | +9.00 |
| Extra toppings | Truffle oil | no | +12.00 |
| Side | Fries | no | +9.00 |
| Side | Salad | no | +11.00 |

## 5. How an order line resolves

Customer orders **one 32 cm Margherita, stuffed crust, extra mozzarella and prosciutto**. The
`order_product` row holds:

- `variant_id` → `PIZZA-MARG-32`, `product_id` → `PIZZA-MARG`
- `quantity` = 1
- **`price` = 45.00** — the variant price *alone*
- `vat_rate` = 11.00, `currency` = RON
- `options` = `[ {Stuffed crust, +8.00, RON}, {Extra mozzarella, +6.00, RON}, {Prosciutto, +9.00, RON} ]`

```
 45.00  variant price
 +8.00  stuffed crust
 +6.00  extra mozzarella
 +9.00  prosciutto
──────
 68.00  × quantity 1  = 68.00 net
                        75.48 gross (11% VAT)
```

**`price` is not the line total and is not meant to be** — the deltas are what reconcile it. Any code
that treats `price * quantity` as the line total is wrong the moment an option is chosen.

`options` is a snapshot, frozen for the same reason `DiscountSnapshot` is: raise stuffed crust to 10
RON next week and last month's receipt still reads 8.

`product_id` is stored next to `variant_id` on purpose, denormalized — every revenue report groups by
product, and the line has to keep saying what it was.

## 6. Retail, same machinery

- **T-shirt** — variants are size × colour (`S/black`, `S/white`, `M/black`…), each with its own SKU
  and, once stock exists, its own count. Options are *Gift wrap +15* (0–1) and *Custom back print
  +40* (0–1).
- **Laptop** — variants are the RAM/storage configurations. Options are *3-year warranty +499* and
  *Engraving +99*.

## 7. What belongs where

| Information | Home | Why not options |
|---|---|---|
| Allergens, calories, ingredients | `product_attribute` | Descriptive, not selectable, no price effect |
| "No onions, extra napkins" | `order_product.notes` | Free text, unbounded, no price effect |
| Happy hour, coupons, loyalty | `discount` + `product_discount` | Conditional on customer or date, applied *on top of* the resolved price |
| Size, colour, capacity | `product_variant_attribute` | Own SKU, own price, own stock |

## 8. Bundles

`product.composition` is `simple` or `bundle`. It is deliberately **not** a value on `type`:
`physical / digital / service` describes fulfilment and stays orthogonal, so a bundle of physical
goods is both `physical` and `bundle`.

A bundle is a product like any other — its own SKU, content, categories, availability and headline
price on its default variant. What it adds is components.

### 8.1. Structure, and how it mirrors options

| Bundle | Option equivalent | Difference |
|---|---|---|
| `product_bundle_group` | `product_option_group` | — |
| `product_bundle_item` | `product_option` | The answer is a **variant**, not a `term` |
| `product_bundle_item_price` | `product_option_price` | — |

That single difference is the whole reason they are separate tables rather than one with a nullable
column: an option's answer is a label with a delta and nothing behind it, while a bundle item's
answer is a real sellable thing that consumes stock, carries its own VAT class and can be refunded
on its own. The behaviour at checkout diverges completely.

`product_bundle_item.group_id` is **nullable**:

- **`NULL`** — always included, never presented as a question. Modeling it as a group of one would
  force a term label for a prompt nobody is shown.
- **set** — one candidate within that group's choice.

`product_id` names the bundle either way, so a component is reachable without a group.

### 8.2. Worked example — "Burger Menu"

Bundle price **55.00 RON**.

| group | item | quantity | delta |
|---|---|---|---|
| *(none — always included)* | Cheeseburger | 1 | — |
| Choose a side (1–1) | Fries | 1 | +0.00 |
| Choose a side | Sweet potato fries | 1 | +5.00 |
| Choose a side | Salad | 1 | +3.00 |
| Choose a drink (1–1) | Cola 0.5 | 1 | +0.00 |
| Choose a drink | Beer 0.5 | 1 | +6.00 |
| Choose a drink | Water | 1 | +0.00 |

Menu with sweet potato fries and a beer: `55.00 + 5.00 + 6.00 = 66.00` net. Same arithmetic as
options — base price plus deltas.

A **fixed kit** (gift set) is the same tables with every item at `group_id = NULL` and no groups.

### 8.3. Why the order line explodes

Those 66.00 contain food at 11% and beer at 21%. A single `order_product.vat_rate` cannot represent
that, and getting it wrong is a tax error rather than a display bug. So a bundle becomes **one
header line plus one child line per component**, linked by `order_product.parent_id`:

- **Header** — the bundle variant, quantity, `price = 0`.
- **Children** — each component's apportioned share of the bundle price, at its *own* `vat_rate`.

Apportionment is pro-rata by the components' **standalone** prices. With standalone prices of
38 / 18 / 14 (total 70) against a charged 66.00:

| Component | Share | Apportioned | Rate | VAT |
|---|---|---|---|---|
| Cheeseburger | 38/70 | 35.83 | 11% | 3.94 |
| Sweet potato fries | 18/70 | 16.97 | 11% | 1.87 |
| Beer 0.5 | 14/70 | 13.20 | 21% | 2.77 |
| | | **66.00** | | **8.58** |

Gross 74.58.

The header carries zero money so that `SUM(price)` over an order stays correct with no
special-casing. Exploding also makes stock deplete on the right variants and lets a single
component be refunded.

⚠️ **Rounding must reconcile.** Pro-rata drifts a cent; the service assigns the remainder to the
largest share so the parts sum to the charged total exactly.

### 8.4. Excluded on purpose

- **Multi-buy** ("3 for 2", "6-pack") is a promotion, not a composition — use `discount`.
- **Nested bundles** are forbidden. A bundle item pointing at another bundle's variant creates a
  cycle no constraint can detect; the service must reject it.
- **Bundle-level stock** does not exist. Availability is the `min` over the components, and a
  bundle's own variants carry `track_stock = false`. That flag is also what keeps the bundle header
  out of shipment allocation (§10, invariant 9) — nothing was ever received against the bundle's
  variant, so there are no lots to pick from.
- **`vat_category` on a bundle product** is unused — the components carry their own.

## 9. Availability — two different questions

Do not merge these; they answer different things and only one drives status.

- **`product.available_from` / `available_until` / `discontinued_at`** — absolute, describe the
  product's life in the catalog: when it first appears and when it is withdrawn. These alone drive
  `sale_status`, which a cron recomputes (see the entity's own JSDoc).
- **`product_availability`** — recurring windows *within* that life: a lunch menu on weekdays
  12:00–15:00, a happy hour every evening. Leaves `sale_status` untouched — an out-of-hours product
  is still `available`, just not right now. **No row at all means unrestricted**, so the common case
  costs nothing.

`day_of_week` is 0 = Sunday, matching JavaScript's `getDay()` rather than ISO-8601's 1 = Monday.
`starts_at` / `ends_at` are `time`, read in the venue's timezone.

## 10. Invariants the database cannot hold

These need the service layer. None of them can be pushed into a constraint.

1. **Every product has at least one variant**, and exactly one is `is_default`. The partial unique
   index enforces *at most* one; nothing enforces *at least* one.
2. **A chosen option must belong to a group of the product being ordered.** Nothing stops a line
   citing a pizza crust on a bottle of wine — `options` is jsonb, and even a join table could not
   express the cross-table check.
3. **`min_select` / `max_select` compliance at checkout.** The bounds are stored; only the service
   can count what was submitted.
4. **The line total.** `price` plus the sum of the option deltas, then quantity, then discounts,
   then VAT — in that order, since discounts apply to prices excluding VAT.
5. **`product_bundle_item.product_id` must equal `group.product_id`** when `group_id` is set. Both
   columns exist so an ungrouped component still names its bundle, and nothing checks that a
   grouped one agrees.
6. **No nested bundles**, and **no bundle without components** once `composition = bundle`.
7. **Bundle apportionment reconciles to the charged total**, remainder to the largest share (§8.3).
8. **Shipment allocation must not exceed what was ordered.** The sum of
   `order_shipping_product.quantity` across every shipment of one `order_product` has to stay
   within that line's `quantity`. Nothing stops shipping 15 of an ordered 14 — and with stock
   tracking on, the surplus consumes real lots.
9. **A bundle is shipped by its children, never its header.** `order_shipping_product` points at
   `order_product`, and for a bundle the header line carries no variant worth picking — the
   component lines hold the real, stockable variants. Allocating the header would leave the stock
   movement with nothing to consume.

`order_product.variant_id` and `product_id` used to belong on this list. They no longer do: the
`variant` relation is a composite foreign key over both columns against
`product_variant (id, product_id)`, so the database rejects the mismatch. Worth copying for
`product_bundle_item` if (5) ever bites.

## 11. Stock lives elsewhere

`warehouse` and `grn` are their own features and own every stock table — `warehouse`, `grn`,
`grn_item`, `warehouse_movement`. Nothing about quantity belongs in `product`; the catalog's only
part in it is `product_variant.track_stock` (§2).

The entities exist; none of the behaviour does. FIFO allocation, the weighted-average cost
recompute on receipt, cancellation reversals and reconciliation are all still unwritten, and the
full design is in the README TODO. Two things settled here because they touch the catalog:

- **Stock leaves on shipment, not on order confirmation.** `order_shipping` carries the
  `warehouse_id`, so one order can ship from two warehouses, and a lot cannot be picked before the
  warehouse holding it is known. The movement's source is an `order_shipping_product`;
  `order_product` carries no lot reference at all, because one line routinely spans several lots.
- **A damaged return must not go back into its lot.** A customer return normally re-enters the lot
  it was picked from, at the cost it left with — the movement records its source, so the lot is
  known. Damaged goods are the exception: returning them to stock means they get picked and sold
  again. They belong in a write-off, or in a quarantine location. Nothing detects this
  automatically; the return has to ask.

## 12. Deferred, with the decision already made

- **Named menus** — `product_availability` says *when*, but nothing groups windows into a
  customer-facing "lunch menu", and two products sharing a schedule repeat it row for row.
- **Order-level currency and totals.** `order_product` and `order_shipping` each carry their own
  `currency` and `exchange_rate`, and nothing asserts they agree — an order with a RON line and a
  EUR line is representable today. `invoice` has `base_currency`; `order` has nothing equivalent.
  A stored order total is worth considering at the same time, since the bundle work made a line
  total non-trivial (`price`, plus option deltas, plus children) and every listing recomputes it.
- **Recipes / bill of materials** — a prepared item consumes ingredients, so depleting stock needs a
  `product_component` layer. Ingredients would be variants with `track_stock = true` that the dish
  consumes; the dish itself stays untracked. Only worth building once the `grn` behaviour exists.
- **Full-text search** — `ProductQuery.filterByTerm` will ILIKE across `product_content.label` and
  `description`, which no btree can serve. The GIN expression index belongs in a hand-written
  migration and **must not** be added to the entity; see `1786240000000-search-indexes.ts`.
