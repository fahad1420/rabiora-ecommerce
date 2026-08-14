# Verified Customer Journey

The public journey begins at `/`, where the database-backed catalogue, search controls, featured collection, language selector, theme selector, wishlist counter, and cart counter are available. The product route `/products/premium-pakistani-three-piece-12` was verified to resolve its gallery, product information, stock state, related products, and cart/wishlist controls after data loading.

The `/cart` and `/wishlist` routes were verified as live destinations for their corresponding header and product actions. The `/checkout` route presents only bKash, Nagad, Rocket, and Cash on Delivery. The confirmed-recipient acceptance flow exercised an anonymous cart through checkout, saved an immutable order, returned a prefilled `wa.me` handoff URL without using WhatsApp credentials, and displayed the matching order confirmation before all test records were removed and stock restored.

Customer account routes remain available at `/login`, `/register`, and `/account`. Their invalid-input and unauthorized paths are covered by server-side tests. The administrator routes are protected separately and are documented in `ACCEPTANCE_NOTES.md`.
