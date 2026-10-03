import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      console.warn("[OAuth] State rejected", { hasNonce: Boolean(nonce), hasStateCookie: Boolean(expectedNonce) });
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error instanceof Error ? error.message : "unknown error");
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  app.get("/api/auth/dev-login", async (req: Request, res: Response) => {
    try {
      const roleParam = typeof req.query.role === "string" ? req.query.role : "donor";
      const openId = `demo-user-${roleParam}`;
      const name =
        typeof req.query.name === "string"
          ? req.query.name
          : roleParam === "organization"
          ? "Hope Community Kitchen"
          : roleParam === "volunteer"
          ? "Alex Rivera"
          : roleParam === "admin"
          ? "FoodShare Admin"
          : "Artisan Bakery & Cafe";

      await db.upsertUser({
        openId,
        name,
        email: `${openId}@foodshare.local`,
        loginMethod: "demo",
        role: roleParam === "admin" ? "admin" : "user",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      const returnUrl = typeof req.query.returnUrl === "string" ? req.query.returnUrl : "/app";
      const safeUrl = returnUrl.replace(/[<>"']/g, "");
      res.set("Content-Type", "text/html").send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Signing in to FoodShare...</title>
</head>
<body>
  <p style="font-family: sans-serif; text-align: center; margin-top: 40px; color: #666;">Signing you in to FoodShare...</p>
  <script>
    try {
      sessionStorage.setItem("manus-cookie", "${COOKIE_NAME}=${sessionToken}");
    } catch (e) {}
    window.location.replace("${safeUrl}");
  </script>
</body>
</html>`);
    } catch (error) {
      console.error("[Auth] Dev login failed:", error);
      res.status(500).json({ error: "Dev login failed", message: error instanceof Error ? error.message : String(error) });
    }
  });
}
