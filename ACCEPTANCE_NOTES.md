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
