# Rabiora E-Commerce

Rabiora is a Bangladesh-focused Pakistani three-piece fashion storefront and commerce application. It includes a database-backed catalogue, customer accounts, persistent carts and wishlists, manual-payment checkout, credential-free Click-to-WhatsApp order handoff, secure customer order tracking, a role-gated administration area, and portable self-hosted product/payment image assets.

## Technology stack

The application uses **React 19**, **Vite 7**, **TypeScript**, **Tailwind CSS 4**, **Express 4**, **tRPC 11**, **Drizzle ORM**, and **MySQL/TiDB**. Customer passwords are hashed with bcrypt, customer/confirmation sessions use signed JWT cookies, and tests run with Vitest. The repository uses pnpm and includes the lockfile required for reproducible installs.

## Repository contents

| Path | Purpose |
|---|---|
| `client/` | React customer and administrator interface, route registration, styling, localization, and assets configuration. |
| `server/` | Express/tRPC server, customer sessions, carts, orders, order tracking, administration, WhatsApp handoff provider, local image serving, and local upload adapter. |
| `drizzle/schema.ts` | Authoritative MySQL/TiDB commerce schema. |
| `drizzle/*.sql` and `drizzle/meta/` | Generated database migrations and migration metadata. |
| `package.json` and `pnpm-lock.yaml` | Runtime scripts and locked dependency graph. |
| `uploads/images/` | Physical portable Rabiora assets: product galleries, payment images, branding, and the persistent location for future administrator uploads. |
| `PORTABILITY_NOTES.md` | Detailed image-migration inventory, local upload architecture, archive evidence, and independent-host dependency notes. |
| `ENVIRONMENT_TEMPLATE.md` | Non-secret variable template. Copy its assignments into `.env.example` after GitHub export, then create a private `.env`; never commit `.env`. |

## Local installation

Prerequisites are Node.js 22 or later, pnpm 10, and an accessible MySQL 8-compatible or TiDB database.

```bash
git clone <your-repository-url> rabiora-ecommerce
cd rabiora-ecommerce
pnpm install --frozen-lockfile
# After GitHub export, create .env.example from ENVIRONMENT_TEMPLATE.md,
# then copy .env.example .env
```

Set the values in `.env` for the services you retain. Do not commit `.env`, production environment files, database passwords, OAuth credentials, or JWT secrets.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `NODE_ENV` | Yes | Use `development` locally and `production` in deployment. |
| `DATABASE_URL` | Yes | MySQL/TiDB connection string consumed by Drizzle and the server. |
| `JWT_SECRET` | Yes | Long random secret used to sign customer and session-bound guest-confirmation cookies. |
| `VITE_APP_ID` | If retaining Manus OAuth | Manus OAuth application identifier. |
| `OAUTH_SERVER_URL` | If retaining Manus OAuth | Manus OAuth server base URL. |
| `VITE_OAUTH_PORTAL_URL` | If retaining Manus OAuth | Browser OAuth portal URL. |
| `OWNER_OPEN_ID` and `OWNER_NAME` | If retaining Manus owner/admin integration | Owner identity used by the included OAuth/runtime integration. |
| `UPLOADS_DIR` | Optional | Persistent local/server directory for product, payment, branding, and future administrator-uploaded images. Defaults to `./uploads/images`. |
| `VITE_APP_TITLE` and `VITE_APP_LOGO` | Optional | Application metadata used by the existing runtime. |
| `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` | Optional | Existing analytics placeholders in the client shell. |

## Database setup and migrations

1. Create an empty MySQL/TiDB database and set `DATABASE_URL`.
2. Review the checked-in schema in `drizzle/schema.ts` and migrations in `drizzle/`.
3. Apply the project migration workflow:

```bash
pnpm db:push
```

The existing script runs `drizzle-kit generate` followed by `drizzle-kit migrate`. For production changes, review generated SQL before applying it and take a database backup. Product catalogue and order data are not seeded by the application automatically; preserve the current database and do not run imports unless explicitly intended.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the Vite-backed Express development server. |
| `pnpm check` | Run the TypeScript type check. |
| `pnpm test` | Run the Vitest automated suite. |
| `pnpm build` | Create the Vite client bundle and bundled server output in `dist/`. |
| `pnpm start` | Run the built production server. |
| `pnpm db:push` | Generate and apply Drizzle migrations. |

## Deployment notes

Build with `pnpm build`, provide all production variables through the deployment platform’s secret manager, then run `pnpm start`. The server must be allowed to bind to the platform-provided port; do not hardcode a port. Configure HTTPS because production cookies are marked secure. Configure the canonical public URL and OAuth callback with the selected identity provider before enabling administrator sign-in.

The payment flow intentionally supports only **bKash**, **Nagad**, **Rocket**, and **Cash on Delivery**. Click-to-WhatsApp creates a prefilled `wa.me` handoff URL; it does not send messages or require WhatsApp Business Cloud API credentials.

Existing product galleries, payment images, and branding are physical project files under `uploads/images/` and are served at `/uploads/images/*`. The administrator upload flow accepts JPEG, PNG, and WebP files, writes them to `UPLOADS_DIR/products/<product-id>/`, and stores portable local paths. Mount `UPLOADS_DIR` as persistent writable storage in production so future administrator uploads survive restarts and redeployments.

## Manus-specific services to replace or configure on another host

| Current dependency | What the included code expects | External-host action |
|---|---|---|
| Manus OAuth/runtime | `server/_core` and `vite-plugin-manus-runtime` provide OAuth/session runtime behavior. | Retain and configure a compatible Manus OAuth environment, or replace the OAuth routes, context, and `useAuth` integration with your chosen identity provider. |
| Product/payment/admin image storage | Physical image files live in `uploads/images/`; `server/localMedia.ts` serves existing files and writes future admin uploads locally. | Commit the existing image files and mount `UPLOADS_DIR` as persistent writable storage. No Manus Forge value is needed for images. |
| Manus deployment configuration | The current managed environment injects several OAuth, owner, and database variables. | Add the needed values through the new host’s environment/secret manager. Never copy platform secrets into Git. |
| Manus analytics placeholders | `client/index.html` has optional analytics variables. | Configure an equivalent analytics service or leave the optional analytics variables empty. |

## GitHub handover checklist

Before connecting a repository to a new host, create `.env.example` from `ENVIRONMENT_TEMPLATE.md` with placeholders only and confirm that `.env` remains ignored. Commit `package.json`, `pnpm-lock.yaml`, `drizzle/schema.ts`, all `drizzle` migrations, the environment template, and this README. Run the following from a clean checkout:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

No production database records, customer credentials, payment evidence, or API secrets are included in this repository.
