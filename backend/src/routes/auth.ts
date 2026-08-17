import { Router } from "express";
import crypto from "crypto";
import { buildAuthorizeUrl, exchangeCodeForToken, generatePkcePair } from "../salesforce";

const router = Router();

router.get("/login", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const { verifier, challenge } = generatePkcePair();

  req.session.oauthState = state;
  req.session.pkceVerifier = verifier;

  console.log("LOGIN DEBUG:", {
    sessionID: req.sessionID,
    state,
  });

  const url = buildAuthorizeUrl(state, challenge);
  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;

  console.log("CALLBACK DEBUG:", {
    hasCode: !!code,
    incomingState: state,
    sessionState: req.session.oauthState,
    hasVerifier: !!req.session.pkceVerifier,
    sessionID: req.sessionID,
    cookieHeader: req.headers.cookie,
  });

  if (error) {
    console.error("Salesforce OAuth error:", error, error_description);
    return res.redirect(`${process.env.FRONTEND_URL}/login-error`);
  }

  if (!code || state !== req.session.oauthState || !req.session.pkceVerifier) {
    return res.status(400).send("Invalid OAuth state or missing code.");
  }

  try {
    const tokenResp = await exchangeCodeForToken(
      code as string,
      req.session.pkceVerifier
    );

    req.session.sf = {
      accessToken: tokenResp.access_token,
      refreshToken: tokenResp.refresh_token,
      instanceUrl: tokenResp.instance_url,
      userId: tokenResp.id,
    };

    res.redirect(process.env.FRONTEND_URL as string);
  } catch (err: any) {
    console.error("Token exchange failed:", err.response?.data || err.message);
    res.status(500).send("OAuth token exchange failed. Check server logs.");
  }
});

router.get("/me", (req, res) => {
  if (req.session.sf?.accessToken) {
    return res.json({ loggedIn: true });
  }
  res.json({ loggedIn: false });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

export default router;