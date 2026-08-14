# Cross-Origin Request Policy

Rabiora uses a **same-origin-by-default** policy for its Express routes, including `/api/trpc`, OAuth callbacks, and the managed storage proxy. Requests without an `Origin` header remain available for normal browser navigation and server-to-server use. Browser requests that provide an `Origin` header are accepted only when the origin exactly matches the request host and protocol.

An additional origin may be enabled only through the comma-separated `CORS_ALLOWED_ORIGINS` environment variable. Entries must be complete origins, such as `https://admin.example.com`; wildcard origins are intentionally unsupported. For permitted origins, the server returns narrowly scoped credentials, methods, headers, and `Vary: Origin` response headers. Requests from all other origins receive HTTP 403, and no permissive `*` origin is used.
