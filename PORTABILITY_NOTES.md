# Rabiora Portable Image Migration

## Scope and result

Rabiora’s product, payment, and branding images are now physical project assets rather than Manus managed-storage objects. The migration contains **60 files**: **55** product-gallery images, **4** payment-method images, and **1** branding logo. The full old-to-new path inventory is retained in `data/image-migration-map.json`.

| Asset class | Project folder | Public route | Count |
|---|---|---|---:|
| Product galleries | `uploads/images/products/` | `/uploads/images/products/<file>` | 55 |
| Payment methods | `uploads/images/payment/` | `/uploads/images/payment/<file>` | 4 |
| Branding logo | `uploads/images/branding/` | `/uploads/images/branding/rabiora-logo.jpeg` | 1 |

The server exposes the folder through Express at `/uploads/images/*`. Existing `product_images` records use portable local URLs, and the mapping file preserves the original managed path alongside the new local path for traceability.

## Future administrator uploads

`server/localMedia.ts` is the storage adapter for administrator product images. It validates permitted image formats, writes uploads under `UPLOADS_DIR/products/<product-id>/`, returns a portable `/uploads/images/products/...` URL, and removes files using the same local storage root. It does not call Manus file storage or require Forge credentials.

Set `UPLOADS_DIR` to a persistent writable directory in production. If it is omitted, the default is `./uploads/images`. The image directory must be included in the deployment artifact for the existing 60 assets and mounted on durable storage for future administrator uploads.

## Export and repository verification

`/home/ubuntu/Rabiora-portable-export.zip` was generated from the project while excluding dependencies, build output, local logs, Git metadata, and private `.env` files. Its verified contents include all 55 product images, all 4 payment images, and the branding logo. The same `uploads/images/` directory is intended to be committed to the GitHub repository.

## Remaining non-image platform dependencies

| Dependency | Current use | Independent-host action |
|---|---|---|
| Manus OAuth/runtime | Existing administrator sign-in and managed runtime hooks. | Replace `server/_core/oauth.ts`, associated request context, and client auth integration with a host-independent identity provider if Manus OAuth will not be retained. |
| `DATABASE_URL` | Core catalogue, customers, carts, orders, payments, and image metadata. | Point to a managed or self-hosted MySQL/TiDB instance containing the approved Rabiora data. The image migration does not export production business records. |
| `JWT_SECRET` | Customer and guest-confirmation cookies. | Set a strong private value in the new host’s secret manager. |
| Forge platform utilities | `voiceTranscription`, `llm`, `dataApi`, `map`, `notification`, and `heartbeat` remain in the generated core runtime but are not used by Rabiora’s approved shopping, payment, order, or image features. | Remove them from the independent deployment or replace them only if a future feature needs them. Forge values are not required for product, payment, branding, or administrator-uploaded images. |

The current Click-to-WhatsApp implementation remains credential-free and is unchanged: it generates a customer-controlled `wa.me` handoff and does not use WhatsApp Business Cloud API credentials.
