import { Router, Request } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { ALLOWED_OBJECTS } from "../types";
import {
  describeObjectFields,
  queryRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  refreshAccessToken,
} from "../salesforce";
import {
  isUnauthorizedError,
  extractErrorDetails,
  toClientError,
} from "../utils";

const router = Router();

function isAllowedObject(name: string): boolean {
  return (ALLOWED_OBJECTS as readonly string[]).includes(name);
}

/**
 * Runs a Salesforce API call using the current session's access token.
 * Salesforce access tokens expire well before the 8-hour session cookie does,
 * so if the call fails with 401 and a refresh token is available, this
 * silently exchanges it for a new access token, updates the session, and
 * retries the call once before giving up.
 */
async function withFreshToken<T>(
  req: Request,
  call: (accessToken: string) => Promise<T>,
): Promise<T> {
  const sf = req.session.sf!;
  try {
    return await call(sf.accessToken);
  } catch (err) {
    if (!isUnauthorizedError(err) || !sf.refreshToken) throw err;

    const refreshed = await refreshAccessToken(sf.refreshToken);
    sf.accessToken = refreshed.access_token;
    req.session.sf = sf;
    return await call(sf.accessToken);
  }
}

/**
 * Logs the full error server-side, then responds with Salesforce's real
 * status code and message where available (e.g. a validation failure like
 * "You must specify a country before selecting a state/province"), instead
 * of flattening every failure into an opaque 500.
 */
function respondWithError(
  res: import("express").Response,
  err: unknown,
  fallback: string,
) {
  console.error(fallback, extractErrorDetails(err));
  const { status, message } = toClientError(err);
  res.status(status).json({ error: message });
}

router.use(requireAuth);

router.get("/", (_req, res) => {
  res.json({ objects: ALLOWED_OBJECTS });
});

router.get("/:object/fields", async (req, res) => {
  const { object } = req.params;
  if (!isAllowedObject(object)) {
    return res.status(400).json({ error: "Object not allowed" });
  }
  try {
    const { instanceUrl } = req.session.sf!;
    const fields = await withFreshToken(req, (accessToken) =>
      describeObjectFields(instanceUrl, accessToken, object),
    );
    res.json({ fields });
  } catch (err) {
    respondWithError(res, err, "Failed to describe object");
  }
});

router.get("/:object/records", async (req, res) => {
  const { object } = req.params;
  if (!isAllowedObject(object)) {
    return res.status(400).json({ error: "Object not allowed" });
  }
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    const { instanceUrl } = req.session.sf!;
    const result = await withFreshToken(req, async (accessToken) => {
      const fields = await describeObjectFields(
        instanceUrl,
        accessToken,
        object,
      );
      const fieldNames = fields.map((f) => f.name);
      return queryRecords(
        instanceUrl,
        accessToken,
        object,
        fieldNames,
        limit,
        offset,
      );
    });
    res.json(result);
  } catch (err) {
    respondWithError(res, err, "Failed to fetch records");
  }
});

router.post("/:object/records", async (req, res) => {
  const { object } = req.params;
  if (!isAllowedObject(object)) {
    return res.status(400).json({ error: "Object not allowed" });
  }
  try {
    const { instanceUrl } = req.session.sf!;
    const result = await withFreshToken(req, (accessToken) =>
      createRecord(instanceUrl, accessToken, object, req.body),
    );
    res.json(result);
  } catch (err) {
    respondWithError(res, err, "Failed to create record");
  }
});

router.patch("/:object/records/:id", async (req, res) => {
  const { object, id } = req.params;
  if (!isAllowedObject(object)) {
    return res.status(400).json({ error: "Object not allowed" });
  }
  try {
    const { instanceUrl } = req.session.sf!;
    const result = await withFreshToken(req, (accessToken) =>
      updateRecord(instanceUrl, accessToken, object, id, req.body),
    );
    res.json(result);
  } catch (err) {
    respondWithError(res, err, "Failed to update record");
  }
});

router.delete("/:object/records/:id", async (req, res) => {
  const { object, id } = req.params;
  if (!isAllowedObject(object)) {
    return res.status(400).json({ error: "Object not allowed" });
  }
  try {
    const { instanceUrl } = req.session.sf!;
    const result = await withFreshToken(req, (accessToken) =>
      deleteRecord(instanceUrl, accessToken, object, id),
    );
    res.json(result);
  } catch (err) {
    respondWithError(res, err, "Failed to delete record");
  }
});

export default router;
