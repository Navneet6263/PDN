# Store admin

Open `http://localhost:3000/admin` (or your site's `/admin`). Use the owner login configured in `.env`.

| Section | What you control |
| --- | --- |
| Overview | Today's and 30-day sales (with change against the previous 30 days), average order value, COD/online mix, orders waiting to be packed/shipped/paid/refunded, a 14-day revenue chart, best sellers, top regions, low stock and the latest orders. |
| Orders | Every website order, with tabs per status, search (order number, name, email, phone, tracking), CSV export and an order drawer: next-step buttons, courier/tracking details, payment attempts, refunds, a printable packing slip and internal notes. |
| Products | Real product details, photos, prices, sizes, colors, package contents, publish/draft status, SEO and product-specific exchange/return/shipping/warranty information. |
| Top 10 & Search | Assign or remove positions 1–10; set catalog order, featured status, search priority and comma-separated search keywords. |
| Banners | Desktop/mobile images, text, destination link, hero/promotion placement, display order, enabled state and optional start/end dates. |
| Categories | Navigation labels, category images, subcategories/product types, order and storefront visibility. |
| Inventory | Search products, filter low/out-of-stock items, increment/decrement stock or enter an exact quantity. |
| Sales & Regions | Record sales from other channels (shop counter, Instagram, WhatsApp), update return/replacement status, and view totals from those records. Website orders are in Orders and Overview. |
| Support | Record enquiries, assign team members, set priority/status, and save internal conversation notes. Notes do not send email or WhatsApp messages. |
| Team & Roles | Create accounts, change passwords, assign roles and disable/remove accounts. |
| Store Settings | Brand/contact information, announcement, fallback hero, homepage headings and visibility, SEO metadata, default product policies, and **Payments & delivery**: delivery fee, free-delivery amount, cash on delivery on/off, COD fee and the largest COD order. |

## Placement rules

- Each Top 10 position belongs to at most one product. Clear an occupied position before assigning another product. Drafts, out-of-stock products and products in hidden categories do not appear in the Top 10. Enable the section in Store Settings.
- Lower catalog order appears first. Featured products win ties.
- Higher search priority appears first **among matching products**. Keywords make alternate search terms discoverable. Explicit customer price sorting overrides this promotion order. These controls affect your website search, not Google ranking.
- Hero banners rotate every five seconds when multiple are active, with previous/next, slide dots and pause/play controls. Rotation pauses during hover, keyboard focus, hidden tabs and reduced-motion preferences. Promotion banners appear before the catalog. Lower banner position appears first. Start/end times use the admin browser's local timezone and are stored in UTC.
- A disabled, future or expired banner is hidden. If no hero banner qualifies, the Store Settings hero is used.
- Category slugs stay stable after creation. Hide a category to hide its products and links; move its products elsewhere before deleting it.
- Product-specific policy text overrides the corresponding store default. Empty product fields inherit defaults.

## Festival banners and selected collections

In **Banners → Add new / Edit**, write the festival title and description, add desktop/mobile images, and set visibility and start/end times. Under **What opens when someone clicks this banner?**, choose:

- **A product, category or custom link**: pick a product in Quick product link or enter a store path in Button destination.
- **A selected festival / occasion collection**: search and tick up to 100 products. Selected styles are shown in order; use the up arrow to move a style earlier or Remove to deselect it. Save, then use Open saved collection to preview.

The whole hero banner and promotion banner open the configured destination. Collection pages show only selected, published products in visible categories. A shopper's saved style quiz does not override your festival selection. Customers can narrow it using department, type, budget, multiple sizes/colours and availability. Mobile filters have a fixed Sort / Filters bar while browsing products, a scrollable panel, a result count and Apply / Clear actions. Closing without applying keeps the existing selection.

Disabled, future and expired collection banners do not expose a public collection page. Existing direct links still work as before. Collection titles, descriptions and images also supply page metadata; active collections appear in the sitemap. The family hero is configured with nine existing celebration sample styles as an editable example.

## Style Studio preferences

The homepage shows a compact style banner. Clicking it or My style opens the three-step quiz; it never opens automatically. Results appear in a closable dialog instead of filling the homepage. It asks for department, occasion, style preference and per-product budget. Office visitors can include Saturday in their Monday–Friday plan. Other moods produce three outfit ideas. Customers can skip the quiz, reopen it through **My style**, remix suggestions or clear preferences. Preferences stay in browser localStorage; they are not sent to an account or marketing service.

Only published, in-stock products in the selected department and budget are considered. Product types provide automatic mood matching; wedding/bridal styles are excluded from casual-office suggestions. If a selection has too few matches, the planner labels repeated styles; no match produces an honest empty state. Suggestions are individual products with their actual package contents, not a promise of a complete outfit. Office suggestions assume a relaxed/smart-casual dress code.

The catalog follows a saved style preference unless the visitor follows an explicit category/search link or selects **Show all styles**. This does not alter product data or the store's default merchandising order for other visitors.

For precise matching, use **Top 10 & Search → select product → Style Studio recommendations**. Occasion checkboxes override automatic matching; leaving all unchecked restores automatic matching. Style checkboxes boost matching preferences. These are stored with existing keywords as `mood:office`, `mood:college`, `mood:everyday`, `mood:festive` and `style:ethnic`, `style:minimal`, `style:bold`.

## Orders

Order lifecycle: **Awaiting payment → Confirmed → Packed → Shipped → Out for delivery → Delivered**. Shipped, out-for-delivery and delivered orders can be marked **Returned**; orders up to Packed can be **Cancelled**. Other jumps are refused.

- Stock is reduced when the order is placed (inside one database transaction, so two customers cannot buy the last piece). Cancelling or returning puts it back, once.
- Cash on delivery orders are confirmed immediately. Marking one **Delivered** records the cash as paid.
- Online orders wait in **Awaiting payment** until the gateway confirms. Unpaid ones are cancelled after 30 minutes and their stock released. A customer can retry payment from their order page in that time.
- A paid order that is cancelled or returned shows **Refund due**. Issue the refund in your gateway dashboard (or by UPI/bank for COD), then use **Record refund**.
- Customers can cancel their own order until it is packed. They see status and shipping updates, never internal notes.
- Order prices, names, photos and addresses are copied into the order, so later product edits or deletions do not change past orders.

## Permissions and storage

Admin members have all controls. Inventory members can view products/categories, update stock, and see and fulfil orders (pack, ship, deliver, return) but cannot cancel orders or change payments. Support members can manage tickets and conversation notes, and can look up orders and add notes to them. API endpoints enforce these permissions. Updating a team account revokes its sessions. The environment-configured owner cannot be removed through the team list.

All records persist in PostgreSQL through Prisma. Local development currently uses the persistent Prisma development database; run `npm run db:dev` in one terminal and `npm run dev` in another. A separate Node API serves `/api`, and Next.js proxies browser requests to it.

Photos use the existing storage adapter: local uploads in development, Cloudinary when `IMAGE_STORAGE=cloudinary` and its three credentials are configured. Cloudinary is not automatically connected by creating a product.

Apply migrations with `npm run db:migrate` when updating an existing installation. Sample products are loaded only by explicitly running the preview scripts. Do not use the Prisma development database as a production host.
