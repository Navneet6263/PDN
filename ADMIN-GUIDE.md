# Store admin

Open `http://localhost:3000/admin` (or your site's `/admin`). Use the owner login configured in `.env`.

| Section | What you control |
| --- | --- |
| Products | Real product details, photos, prices, sizes, colors, package contents, publish/draft status, SEO and product-specific exchange/return/shipping/warranty information. |
| Top 10 & Search | Assign or remove positions 1–10; set catalog order, featured status, search priority and comma-separated search keywords. |
| Banners | Desktop/mobile images, text, destination link, hero/promotion placement, display order, enabled state and optional start/end dates. |
| Categories | Navigation labels, category images, subcategories/product types, order and storefront visibility. |
| Inventory | Search products, filter low/out-of-stock items, increment/decrement stock or enter an exact quantity. |
| Sales & Regions | Record existing sales, update return/replacement status, and view revenue and region totals from those records. This is not checkout/payment processing. |
| Support | Record enquiries, assign team members, set priority/status, and save internal conversation notes. Notes do not send email or WhatsApp messages. |
| Team & Roles | Create accounts, change passwords, assign roles and disable/remove accounts. |
| Store Settings | Brand/contact information, announcement, fallback hero, homepage headings and visibility, SEO metadata and default product policies. |

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

## Permissions and storage

Admin members have all controls. Inventory members can view products/categories and update stock. Support members can manage tickets and conversation notes. API endpoints enforce these permissions. Updating a team account revokes its sessions. The environment-configured owner cannot be removed through the team list.

All records persist in PostgreSQL through Prisma. Local development currently uses the persistent Prisma development database; run `npm run db:dev` in one terminal and `npm run dev` in another. A separate Node API serves `/api`, and Next.js proxies browser requests to it.

Photos use the existing storage adapter: local uploads in development, Cloudinary when `IMAGE_STORAGE=cloudinary` and its three credentials are configured. Cloudinary is not automatically connected by creating a product.

Apply migrations with `npm run db:migrate` when updating an existing installation. Sample products are loaded only by explicitly running the preview scripts. Do not use the Prisma development database as a production host.
