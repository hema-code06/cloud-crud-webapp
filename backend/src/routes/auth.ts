import { Router } from "express";
import crypto from "crypto";
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  generatePkcePair,
} from "../salesforce";
import { extractErrorDetails } from "../utils";

const router = Router();

router.get("/login", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const { verifier, challenge } = generatePkcePair();

  req.session.oauthState = state;
  req.session.pkceVerifier = verifier;

  const url = buildAuthorizeUrl(state, challenge);
  res.redirect(url);
});

router.get("/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error("Salesforce OAuth error:", error, error_description);
    return res.redirect(`${process.env.FRONTEND_URL}/login-error`);
  }

  if (!code || state !== req.session.oauthState || !req.session.pkceVerifier) {
    return res
      .status(400)
      .send("Invalid OAuth state or missing authorization code.");
  }

  try {
    const tokenResp = await exchangeCodeForToken(
      code as string,
      req.session.pkceVerifier,
    );

    req.session.sf = {
      accessToken: tokenResp.access_token,
      refreshToken: tokenResp.refresh_token,
      instanceUrl: tokenResp.instance_url,
      userId: tokenResp.id,
    };

    res.redirect(process.env.FRONTEND_URL as string);
  } catch (err) {
    console.error("Token exchange failed:", extractErrorDetails(err));
    res.status(500).send("OAuth token exchange failed. Check server logs.");
  }
});

router.get("/me", (req, res) => {
  res.json({ loggedIn: !!req.session.sf?.accessToken });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

export default router;
