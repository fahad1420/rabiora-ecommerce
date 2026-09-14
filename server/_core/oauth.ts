import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "../../shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { exchangeAuth0Code } from "../auth0Service";
import { setCustomerSession, isPermanentAdmin } from "../customerSession";
import { connectMongo } from "../config/db";
import { UserModel } from "../models";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query ? req.query[key] : undefined;
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get(["/api/oauth/callback", "/oauth/callback"], async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login.
    let redirectUri = "/";
    try {
      const decoded = decodeOAuthState(state);
      redirectUri = decoded.redirectUri || "/";
      const { nonce } = decoded;
      const cookieHeader = req.get("cookie") || (typeof req.headers.cookie === "string" ? req.headers.cookie : "");
      const expectedNonce = parseCookieHeader(cookieHeader)[OAUTH_STATE_COOKIE];
      if (expectedNonce && nonce && nonce !== expectedNonce) {
        console.warn("[OAuth] Nonce mismatch on state verification");
      }
    } catch (e) {
      console.warn("[OAuth] State decode error:", e);
    }
    
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      let openId = "";
      let name = "";
      let email = "";
      let loginMethod = "auth0";

      // 1. Try Auth0 OAuth exchange
      try {
        const fullRedirectUri = `${req.protocol}://${req.get("host")}/api/oauth/callback`;
        const auth0Res = await exchangeAuth0Code(code, fullRedirectUri);
        openId = auth0Res.userInfo.sub || `auth0_${Date.now()}`;
        name = auth0Res.userInfo.name || auth0Res.userInfo.nickname || "Rabiora Customer";
        email = auth0Res.userInfo.email || "";
        loginMethod = openId.startsWith("google") ? "google" : openId.startsWith("facebook") ? "facebook" : "auth0";
      } catch (auth0Err) {
        console.warn("[OAuth] Auth0 exchange fallback, attempting SDK exchange:", (auth0Err as any)?.message);
        // Fallback to Manus / Core SDK exchange
        const tokenResponse = await sdk.exchangeCodeForToken(code, state);
        const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
        openId = userInfo.openId || `oauth_${Date.now()}`;
        name = userInfo.name || "Rabiora Customer";
        email = userInfo.email || "";
        loginMethod = userInfo.loginMethod ?? userInfo.platform ?? "oauth";
      }

      if (!openId) {
        res.status(400).json({ error: "openId missing from OAuth user info" });
        return;
      }

      // Upsert into MongoDB
      await connectMongo();
      let user = await UserModel.findOne({
        $or: [{ openId }, ...(email ? [{ email: email.toLowerCase() }] : [])],
      });

      const role = isPermanentAdmin(user?.phone, email) ? "admin" : (user?.role || "user");

      if (!user) {
        user = await UserModel.create({
          openId,
          name,
          email: email ? email.toLowerCase() : undefined,
          loginMethod,
          role,
          lastSignedIn: new Date(),
        });
      } else {
        user.openId = openId;
        if (name && !user.name) user.name = name;
        if (email && !user.email) user.email = email.toLowerCase();
        user.loginMethod = loginMethod;
        user.lastSignedIn = new Date();
        user.role = role;
        await user.save();
      }

      // Establish customer session
      const customer = {
        id: user._id.toString(),
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        phone: user.phone ?? null,
        role: user.role,
      };

      await setCustomerSession(res, customer, req);

      const sessionToken = await sdk.createSessionToken(openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.redirect(302, "/login?error=oauth_failed");
    }
  });
}

