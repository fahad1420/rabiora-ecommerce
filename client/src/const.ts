import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
export const startLogin = (options?: { connection?: "google" | "facebook" }) => {
  const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN || "rabiora.us.auth0.com";
  const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "rabiora-app-client";
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "";
  const appId = import.meta.env.VITE_APP_ID || "";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const state = encodeOAuthState({ redirectUri, nonce });

  // Priority 1: Auth0 Direct Connection
  if (auth0Domain) {
    const auth0Url = new URL(`https://${auth0Domain}/authorize`);
    auth0Url.searchParams.set("client_id", auth0ClientId);
    auth0Url.searchParams.set("response_type", "code");
    auth0Url.searchParams.set("redirect_uri", redirectUri);
    auth0Url.searchParams.set("state", state);
    auth0Url.searchParams.set("scope", "openid profile email");
    if (options?.connection) {
      auth0Url.searchParams.set("connection", options.connection === "google" ? "google-oauth2" : "facebook");
    }
    window.location.href = auth0Url.toString();
    return;
  }

  // Priority 2: Manus OAuth Portal (fallback if configured)
  if (oauthPortalUrl && appId) {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    if (options?.connection) {
      url.searchParams.set("connection", options.connection === "google" ? "google-oauth2" : "facebook");
    }
    window.location.href = url.toString();
    return;
  }
};

export const startSocialLogin = (connection: "google" | "facebook") => {
  startLogin({ connection });
};
