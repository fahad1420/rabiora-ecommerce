# Acceptance Notes

## 2026-08-14 validation record

- The database-backed product route `/products/premium-pakistani-three-piece-12` resolved successfully after initial loading, including gallery images, product details, related products, and localized customer-facing controls.
- A fresh browser-console review after the clean server restart reported no console output or client-side error.
- The Click-to-WhatsApp destination configured in `server/whatsapp.ts` is `8801349529274`. The code generates only a prefilled `wa.me` URL and does not call an external WhatsApp API.
- The configured owner row was verified directly in the database with `role = 'admin'`; no account was created or changed.

## Confirmed-recipient checkout acceptance

With the recipient number confirmed by the project owner, the live tRPC checkout flow created the explicitly labeled guest order `RAB-MSS7GXT9-OA0ZH` for `E2E ACCEPTANCE TEST`. It used one unit of product 12, Cash on Delivery, free Dhaka delivery, and a total of ৳1,590. The API returned a prefilled `wa.me/8801349529274` URL containing the order number, normalized customer phone, delivery details, product, quantity, payment method, and total. The URL was inspected only; no WhatsApp message was opened or sent.

The customer-facing confirmation route rendered the matching order number, Cash on Delivery method, free Dhaka delivery, and total. Cleanup then restored product 12 from the post-checkout quantity to its baseline of 10 and removed the labeled cart, order, item, payment, and status-history records. A final database query returned only the restored product row and no matching acceptance-test records; no customer account was created during the guest checkout.

## Confirmation identifier regression

The confirmation route now accepts the underscore character emitted by the default NanoID alphabet. The input validation expression changed from `^RAB-[A-Z0-9-]+$` to `^RAB-[A-Z0-9_-]+$`, with automated regression coverage for `RAB-MSS7IVDJ-E5P_P`. The exact reported confirmation URL was then reopened successfully, rendering its persisted order details rather than producing the prior validation error.

## Read-only administrator acceptance blocker

The current browser session is authenticated as an existing `user`-role account, not as the verified owner administrator row. The `/admin` route correctly presented its forbidden state and the session metadata confirmed the role mismatch. No account, role, product, image, or order record was changed. A browser session authenticated as the owner administrator is required to complete the remaining live read-only admin dashboard and image-management acceptance checks.

The database independently confirms one existing owner administrator row. The client administrator page contains protected dashboard, product, image, order, customer-detail, and forward-only fulfilment views, while all corresponding tRPC endpoints use the server-side `adminProcedure` gate. A live request to `admin.products.list` without credentials returned HTTP 403 with `FORBIDDEN`; the dedicated server-side authorization and administrator-router coverage passed. The only unverified aspect is viewing those controls in a browser session authenticated as that administrator, which cannot be completed while browser takeover opens a new tab.

## Measured production bundle refinement

Non-homepage routes now load through React lazy boundaries. The production entry JavaScript bundle decreased from 870.40 kB (232.86 kB gzip) to 699.30 kB (202.48 kB gzip), while product detail, cart, wishlist, account, checkout, order confirmation, authentication, and administration now load as separate route chunks. The build still identifies the entry chunk as exceeding Vite’s advisory 500 kB threshold, but the measured reduction is 171.10 kB before compression without a visual redesign or business-logic change.

## Accessibility spot check

The lazy-loaded product page exposes one main landmark, has no unnamed buttons, and retains the active Bangla document language. Its three gallery thumbnail images intentionally use empty alternative text because the containing buttons have localized `aria-label` values that describe the selected image; this prevents redundant announcement rather than omitting control names.

## Source-level security and test audit

The client source contains no direct references to database, JWT, or server Forge credential variables. Environment-file patterns are excluded by `.gitignore`. The server applies Zod input contracts to public and administrator router operations, rate-limits account registration and login attempts, and enforces administrator access through `adminProcedure`. The same-origin CORS policy has both unit and live preflight coverage. The complete isolated test suite covers authentication, carts, administrator CRUD validation and authorization, checkout validation, stock rejection, status transitions, and Click-to-WhatsApp failure handling without leaving test data in the production database.

## Final post-change customer-surface verification

Desktop checks covered the homepage, product detail, cart, wishlist, checkout, login, register, and account routes after route-level loading was introduced. Empty cart and wishlist states, customer authentication forms, and the developer footer links remained present. On the loaded homepage, the existing language and theme controls were toggled once and confirmed to update the document language, theme class, and their `rabiora-language` and `rabiora-theme` local-storage preferences. No customer, order, product, image, or other business record was modified during this verification.
