# Environment Template for External GitHub Handover

This project’s managed environment does not permit committing or directly creating files named `.env` or `.env.example`. When exporting this repository to GitHub or another host, copy the assignments below into a local `.env.example` file in that external repository, then create your private `.env` from it. Do not commit the private `.env` file.

```dotenv
# Runtime mode
NODE_ENV=development

# Required database and cookie security
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
JWT_SECRET=replace-with-a-long-random-secret

# Manus OAuth; required only if retaining the included Manus OAuth flow
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Your Name

# Manus Forge storage; required only if retaining server/storage.ts unchanged
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=replace-with-forge-server-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
VITE_FRONTEND_FORGE_API_KEY=replace-with-forge-frontend-key

# Optional presentation and analytics
VITE_APP_TITLE=Rabiora | Premium Pakistani Three Piece
VITE_APP_LOGO=
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```
