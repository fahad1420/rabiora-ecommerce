# Rabiora E-Commerce Implementation Plan

**Purpose:** Transform the supplied Rabiora clothing storefront into a database-backed e-commerce application while preserving its visual identity and working customer interactions. This document is a plan only. Apart from the required project checklist, no supplied storefront source, catalogue record, or design asset has been modified.

## Audit summary and reusable work

The supplied project contains a static Rabiora storefront with `index.html`, `product.html`, `cart.html`, a shared stylesheet, product data in `data/product.js`, and 24 catalogue items with local image galleries. Its current customer experience already includes the Poppins typeface, announcement bar, navigation, product cards, search, All/Featured filters, a browser-stored cart and wishlist, a product-detail gallery, a responsive mobile drawer, a Featured Collection carousel, manual WhatsApp ordering, payment-method artwork, social links, and an Express product CRUD prototype.

The new full-stack workspace provides a React interface, Express server, typed API layer, relational database, managed file storage, and a role field for access control. The migration will **reuse the Rabiora visual system and catalogue as the source of truth**. It will not alter the Featured Collection carousel unless a later requirement specifically needs it.

| Reuse without redesign | Replace or extend |
|---|---|
| Poppins, Rabiora colour palette, announcement bar, social links, responsive spacing, product-card visual design, mobile navigation, product-detail visual hierarchy, featured carousel, and existing product images. | Static product JavaScript array, browser-only cart for signed-in users, public write endpoints, manual WhatsApp handoff, file-based data writes, and unprotected administration. |

## Recommended architecture

The recommended approach is to use the initialized workspace’s managed relational database and file storage rather than introduce a separate MongoDB deployment. Rabiora’s core relationships—orders containing item snapshots, product galleries, carts, wishlists, addresses, payment references, and role-gated administration—are strongly relational. Keeping the database and file storage in the supplied platform removes an additional vendor account, network configuration, and database connection secret.

MongoDB Atlas Free remains viable if MongoDB familiarity is more important than a single managed stack. However, its free cluster has fixed resource limits, no managed backups, a single free cluster per project, and constrained storage and transfer allowances, so it is less suitable as the default production data store for an order system.[2]

| Option | Trade-offs | Cost | Setup complexity |
|---|---|---:|---|
| **Recommended: managed relational database and file storage in the initialized workspace** | Best fit for products, carts, order lines, addresses, payments, and reporting. Avoids separate database hosting and keeps the application stack together. | Included with the workspace configuration. | Lower |
| MongoDB Atlas Free cluster with object storage | Flexible document model and familiar MongoDB tooling, but adds external credentials and networking. Its free tier has storage, data-transfer, backup, and operational limits.[2] | Free tier available; scaling requires a paid tier. | Medium |

The server will continue to run on Express, but its new typed procedures will become the application contract. The legacy product CRUD logic will be recreated as validated, role-protected database operations rather than attempting to preserve the source-file rewriting implementation. The public storefront will call those procedures, so product information, availability, cart validation, order placement, and administration read from the same persistent data.

## Data model and business rules

All monetary values will be stored as whole Bangladeshi taka values or integer paisa—not browser floating-point values. Order items will hold immutable product-name, unit-price, and image snapshots, so historic orders do not change when a product is later edited.

| Record | Essential fields and rules |
|---|---|
| Customer account | `id`, name, phone, optional email, password hash, role (`customer` or `admin`), created/updated timestamps. Passwords are never stored in plain text. |
| Address | Customer relation, recipient name, phone, district/area, full delivery address, optional default flag. |
| Category | Name, URL-safe slug, optional display order. |
| Product | Name, slug, category relation, price, old price, discount, fabric, colour, details, stock quantity, in-stock/featured flags, created/updated timestamps. |
| Product image | Product relation, managed-storage URL/key, alt text, display position, cover-image flag. |
| Cart and cart item | User relation or an anonymous session token, product relation, quantity, timestamps. Guest carts continue to work; a signed-in cart persists in the database and can merge safely after login. |
| Wishlist item | User/product relation with a uniqueness rule. Guests retain browser-only wishlist state until sign-in. |
| Order | Immutable order number, customer/guest data, delivery address snapshot, subtotal, delivery charge, total, payment method, payment reference, status, timestamps. |
| Order item | Product reference plus product-name, SKU, price, and image snapshots; requested quantity; line total. |
| Payment record | Method, expected amount, submitted amount, transaction ID where applicable, and a non-sensitive audit timestamp. |
| Order status history | Order relation, previous and next status, actor, timestamp, and optional admin note. |

Payment method values will be limited exactly to **bKash, Nagad, Rocket, and Cash on Delivery**. Customer-facing and admin order labels will be limited exactly to **pending, confirmed, shipped, and delivered**. Only authorized administrators may make permitted forward status transitions; customer cancellation and payment-review states are excluded unless later approved because they are outside the current exact-status requirement.

> The prior project brief requests a manual transaction ID and paid amount for mobile-wallet payments. The latest feature list requires payment selection but does not restate those fields. The proposed implementation keeps a transaction ID and paid amount for **bKash, Nagad, and Rocket**, while Cash on Delivery does not request a transaction ID. The payment is never automatically verified. Please confirm this rule before Phase 4 begins.

## WhatsApp order notification decision

An automatic order notification needs a server-side messaging provider; a `wa.me` link merely opens WhatsApp for a person and cannot guarantee that the owner is notified. Meta’s official WhatsApp Business Platform can send programmatic messages, but it requires a WhatsApp Business account, a business phone number, credentials, and adherence to message/template rules.[1] Its published pricing is per delivered message and distinguishes message categories; the provider notes that some service or user-responsive utility messages are not charged.[3]

| Approach | Trade-offs | Cost | Setup complexity |
|---|---|---:|---|
| **Official WhatsApp Business Platform Cloud API** | Meets the automatic owner-notification requirement. Requires a Meta Business/WhatsApp setup, an access token, business phone configuration, and compliant notification content. The order write remains successful even if the notification attempt fails; the failure is logged for admin retry. | Message-based; may be low for small volume, subject to Meta’s current terms.[3] | Medium |
| Click-to-WhatsApp link after checkout | No external API credentials and is simple, but depends on the customer’s device/session and **does not meet the automatic owner-notification requirement**. | No API messaging fee. | Low |

The recommended choice is the official Cloud API. After approval, its phone identifier, recipient phone number, and access token will be requested through protected project configuration; they will not be placed in the client bundle or committed to source control. If no official account is ready, we can implement a clearly identified temporary fallback link while leaving the automatic notification integration pending.

## Files and components expected to change

The migration will minimize changes outside the feature being implemented. The original archive remains an audit reference. In the initialized workspace, planned work is concentrated in the following areas.

| Area | Planned files or additions |
|---|---|
| Database | `drizzle/schema.ts`, generated migrations, `server/db.ts`, and feature-specific query helpers. |
| Server API | `server/routers.ts` plus focused routers for catalogue, auth, cart, wishlist, checkout/orders, and admin operations. |
| Storefront UI | `client/src/App.tsx`, Rabiora layout and shared components, pages for home, product detail, cart, checkout, confirmation, account, and orders. |
| Admin UI | The supplied dashboard layout, plus protected product and order-management pages and image-upload controls. |
| Styling | Global font/token configuration and Rabiora-specific component styling that ports the existing design instead of inventing a new visual direction. |
| Assets and seed data | Product images staged outside the project, uploaded to managed storage, and an idempotent seed routine derived from `data/product.js`. |
| Quality | Feature-focused Vitest suites and documented test fixtures; no real customer or payment data will be used. |

## Phased delivery sequence

Each phase will be implemented, tested, and reported separately. The effort estimates are relative development blocks, not a commitment to deploy all work at once.

| Phase | Scope | Reuses existing work | Relative effort | Completion evidence |
|---|---|---|---|---|
| **1. Foundation and catalogue migration** | Create normalized schema, secure server conventions, product/category/image data access, managed asset upload, and idempotent import of all 24 records. | Authoritative `data/product.js` data and existing product images. | Large | Migration verification, imported-product count, protected admin data operations, and seed tests. |
| **2. Public catalogue and product details** | Port the existing Rabiora page structure, database-driven grid, search, All/Featured tabs, image gallery, related products, stock, and responsive states. | Current visual design, product cards, carousel, and detail layout. | Large | Desktop/mobile visual review, search/filter tests, gallery and related-product tests. |
| **3. Customer accounts and access control** | Customer register/login/logout/profile, password hashing, session/JWT security, admin authorization, guest session support, and rate limits. | Existing workspace security infrastructure where compatible. | Medium–large | Auth and authorization unit tests, protected-route checks, password-security review. |
| **4. Cart and wishlist persistence** | Guest-local continuity, database carts for signed-in users, cart merge, wishlist persistence, stock validation, and preserved cart interface. | Current cart/wishlist interactions and UI. | Medium | Cart quantity, deletion, merge, stock-limit, and guest/customer tests. |
| **5. Checkout, manual payment details, and order creation** | Bangladesh-focused checkout, delivery data, exact payment methods, immutable order snapshots, exact order statuses, confirmation page, and customer order history. | Existing payment visual assets and checkout-to-order intent. | Large | Valid/invalid checkout tests, snapshot verification, confirmation page, and customer history tests. |
| **6. WhatsApp notification integration** | Official provider integration or approved temporary fallback, secure configuration, retry-safe logging, and notification failure handling. | Existing business WhatsApp number only after reconfirmation. | Medium | Provider mock tests plus safe failure-path test; no real notification is sent without permission. |
| **7. Admin panel** | Protected product CRUD, image upload, featured/stock toggles, order list/detail, customer details, and permitted status updates. | Supplied dashboard layout for internal management. | Large | Role-gate tests, CRUD tests, order status-transition tests, and image-upload verification. |
| **8. Final quality and release readiness** | Full regression pass, accessibility, responsive verification, performance/image review, error logging, production environment review, and deployment checklist. | All completed phases. | Medium | Automated test run, browser verification, security checklist, and release checklist. |

## Key risks and mitigations

| Risk | Mitigation |
|---|---|
| Existing static markup and database-driven React components drift visually. | Port the current layout and CSS tokens first; compare desktop and mobile at each public-page phase; leave the featured carousel untouched. |
| An order is created but an external WhatsApp API call fails. | Create the order atomically before notification, record the delivery attempt separately, show the customer confirmation, and expose a controlled admin retry action later if needed. |
| Client-side price, delivery charge, stock, or payment value is manipulated. | Recalculate all totals and stock checks server-side; accept only allowed payment methods; do not trust submitted amounts. |
| A product image upload produces an orphaned asset or invalid record. | Upload through managed storage, validate file type/size, and write the database image record only after successful storage response. |
| Tests accidentally alter catalogue or payment-like records. | Use isolated test fixtures, non-production database records, and mocked WhatsApp requests. |
| External WhatsApp credentials are not yet available. | Build and test the provider boundary with mocks; defer real notification activation until the owner supplies credentials through protected configuration. |

## Approval required before implementation

No Rabiora feature implementation will begin until approval is explicit. Please confirm the following scope choices:

1. **Database:** approve the managed relational database and file storage already available in the initialized workspace, rather than a separate MongoDB Atlas account.
2. **Payments:** approve manual transaction ID and paid-amount fields for bKash, Nagad, and Rocket only; Cash on Delivery will not request them. No online payment gateway will be added.
3. **WhatsApp:** approve the official WhatsApp Business Platform route for automatic owner notifications, with secure credentials supplied later; or explicitly approve the non-automatic Click-to-WhatsApp fallback.
4. **First build step:** approve **Phase 1 — Foundation and catalogue migration**. This phase will not redesign the storefront or change the Featured Collection carousel.

## References

[1]: https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform "Meta for Developers — WhatsApp Business Platform overview"
[2]: https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/ "MongoDB Atlas — Free Cluster Limits"
[3]: https://whatsappbusiness.com/products/platform-pricing/ "WhatsApp Business Platform Pricing"
