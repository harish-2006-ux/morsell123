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

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, role, phone, serviceArea, capacity, availability, transportMode } = req.body || {};
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ error: "Please enter your name or organization name (at least 2 characters)." });
      }
      const safeRole = ["donor", "organization", "volunteer"].includes(role) ? role : "donor";
      const cleanEmail = typeof email === "string" && email.includes("@") ? email.trim() : `user_${Date.now()}@foodshare.local`;
      const openId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cleanName = name.trim();

      await db.upsertUser({
        openId,
        name: cleanName,
        email: cleanEmail,
        loginMethod: "local",
        role: "user",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      if (user) {
        const numCapacity = capacity ? Number(capacity) : null;
        await db.createProfile({
          userId: user.id,
          role: safeRole as "donor" | "organization" | "volunteer",
          displayName: cleanName,
          phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
          serviceArea: typeof serviceArea === "string" && serviceArea.trim() ? serviceArea.trim() : null,
          capacity: numCapacity && !isNaN(numCapacity) && numCapacity > 0 ? numCapacity : null,
          availability: typeof availability === "string" && availability.trim() ? availability.trim() : null,
          transportMode: typeof transportMode === "string" && transportMode.trim() ? transportMode.trim() : null,
        });
      }

      const sessionToken = await sdk.createSessionToken(openId, {
        name: cleanName,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        sessionToken,
        cookieName: COOKIE_NAME,
        user,
      });
    } catch (error) {
      console.error("[Auth] Registration failed:", error);
      res.status(500).json({ error: "Registration failed", message: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, role, name: explicitName, isDemo } = req.body || {};
      const cleanInput = typeof email === "string" ? email.trim() : "";
      const roleParam = typeof role === "string" ? role : "donor";

      let user: any = null;
      if (cleanInput.length > 0) {
        user = (await db.getUserByEmail(cleanInput)) || (await db.getUserByName(cleanInput)) || (await db.getUserByOpenId(cleanInput));
      }

      let openId = "";
      let name = "";
      let finalEmail = "";

      if (user) {
        openId = user.openId;
        name = user.name || cleanInput;
        finalEmail = user.email || `${openId}@foodshare.local`;
      } else if (cleanInput.length > 0) {
        // User typed a custom name or email: use their actual name!
        name = explicitName || (cleanInput.includes("@") ? cleanInput.split("@")[0] : cleanInput);
        finalEmail = cleanInput.includes("@") ? cleanInput : `${cleanInput.toLowerCase().replace(/[^a-z0-9]/g, "")}@foodshare.local`;
        openId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      } else if (isDemo) {
        openId = `demo-user-${roleParam}`;
        name =
          roleParam === "organization"
            ? "Hope Community Kitchen"
            : roleParam === "volunteer"
            ? "Alex Rivera"
            : roleParam === "admin"
            ? "FoodShare Admin"
            : "Artisan Bakery & Cafe";
        finalEmail = `${openId}@foodshare.local`;
      } else {
        openId = `demo-user-${roleParam}`;
        name =
          roleParam === "organization"
            ? "Hope Community Kitchen"
            : roleParam === "volunteer"
            ? "Alex Rivera"
            : roleParam === "admin"
            ? "FoodShare Admin"
            : "Artisan Bakery & Cafe";
        finalEmail = `${openId}@foodshare.local`;
      }

      await db.upsertUser({
        openId,
        name,
        email: finalEmail,
        loginMethod: user?.loginMethod || "local",
        role: user?.role || (roleParam === "admin" ? "admin" : "user"),
        lastSignedIn: new Date(),
      });

      const loggedInUser = await db.getUserByOpenId(openId);
      if (loggedInUser && !user && roleParam !== "admin") {
        await db.createProfile({
          userId: loggedInUser.id,
          role: roleParam as "donor" | "organization" | "volunteer",
          displayName: name,
        });
      }

      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        sessionToken,
        cookieName: COOKIE_NAME,
        user: loggedInUser || { openId, name, role: roleParam },
      });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Login failed", message: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/auth/update-name", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const { name, phone, serviceArea, capacity, availability, transportMode } = req.body || {};
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ error: "Name must be at least 2 characters." });
      }
      const cleanName = name.trim();

      await db.updateUserName(user.id, cleanName);
      await db.updateProfileFull(user.id, {
        displayName: cleanName,
        phone: typeof phone === "string" ? phone.trim() : null,
        serviceArea: typeof serviceArea === "string" ? serviceArea.trim() : null,
        capacity: typeof capacity === "number" ? capacity : (typeof capacity === "string" && !isNaN(Number(capacity)) ? Number(capacity) : null),
        availability: typeof availability === "string" ? availability.trim() : null,
        transportMode: typeof transportMode === "string" ? transportMode.trim() : null,
      });

      // Re-issue session token with new name
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: cleanName,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, name: cleanName, sessionToken });
    } catch (error) {
      console.error("[Auth] Update details failed:", error);
      res.status(500).json({ error: "Failed to update details", message: error instanceof Error ? error.message : String(error) });
    }
  });
}
