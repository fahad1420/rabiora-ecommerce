import axios from "axios";

export const AUTH0_DOMAIN =
  process.env.AUTH0_DOMAIN ||
  process.env.VITE_AUTH0_DOMAIN ||
  "rabiora.us.auth0.com";

export const AUTH0_CLIENT_ID =
  process.env.AUTH0_CLIENT_ID ||
  process.env.VITE_AUTH0_CLIENT_ID ||
  "";

export const AUTH0_CLIENT_SECRET =
  process.env.AUTH0_CLIENT_SECRET ||
  "";

export interface Auth0UserInfo {
  sub: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  nickname?: string;
}

export async function exchangeAuth0Code(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; idToken?: string; userInfo: Auth0UserInfo }> {
  const tokenEndpoint = `https://${AUTH0_DOMAIN}/oauth/token`;
  
  const payload: Record<string, string> = {
    grant_type: "authorization_code",
    client_id: AUTH0_CLIENT_ID,
    code,
    redirect_uri: redirectUri,
  };

  if (AUTH0_CLIENT_SECRET) {
    payload.client_secret = AUTH0_CLIENT_SECRET;
  }

  const tokenRes = await axios.post(tokenEndpoint, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  });

  const accessToken = tokenRes.data.access_token;
  const idToken = tokenRes.data.id_token;

  let userInfo: Auth0UserInfo;

  try {
    const userRes = await axios.get(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });
    userInfo = userRes.data;
  } catch {
    if (idToken) {
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        userInfo = {
          sub: decoded.sub || "auth0_user",
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture,
        };
      } else {
        throw new Error("Failed to retrieve Auth0 user profile.");
      }
    } else {
      throw new Error("Failed to retrieve Auth0 user profile.");
    }
  }

  return { accessToken, idToken, userInfo };
}

export async function triggerAuth0PasswordReset(email: string): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return false;

    await axios.post(
      `https://${AUTH0_DOMAIN}/dbconnections/change_password`,
      {
        client_id: AUTH0_CLIENT_ID || "rabiora-client",
        email: cleanEmail,
        connection: "Username-Password-Authentication",
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 8000,
      }
    );
    return true;
  } catch (error) {
    console.warn("[Auth0] Change password request notice:", (error as any)?.response?.data || (error as any)?.message);
    return false;
  }
}

