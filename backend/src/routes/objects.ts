import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { ALLOWED_OBJECTS } from "../types";
import {
  describeObjectFields,
  queryRecords,
  createRecord,
  updateRecord,
  deleteRecord,
} from "../salesforce";

const router = Router();

function isAllowedObject(name: string): boolean {
  return (ALLOWED_OBJECTS as readonly string[]).includes(name);
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
    const { instanceUrl, accessToken } = req.session.sf!;
    const fields = await describeObjectFields(instanceUrl, accessToken, object);
    res.json({ fields });
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to describe object" });
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
    const { instanceUrl, accessToken } = req.session.sf!;
    const fields = await describeObjectFields(instanceUrl, accessToken, object);
    const fieldNames = fields.map((f) => f.name);
    const result = await queryRecords(
      instanceUrl,
      accessToken,
      object,
      fieldNames,
      limit,
      offset
    );
    res.json(result);
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

router.post("/:object/records", async (req, res) => {
  const { object } = req.params;
  if (!isAllowedObject(object)) {
    return res.status(400).json({ error: "Object not allowed" });
  }
  try {
    const { instanceUrl, accessToken } = req.session.sf!;
    const result = await createRecord(instanceUrl, accessToken, object, req.body);
    res.json(result);
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create record", details: err.response?.data });
  }
});

router.patch("/:object/records/:id", async (req, res) => {
  const { object, id } = req.params;
  if (!isAllowedObject(object)) {
    return res.status(400).json({ error: "Object not allowed" });
  }
  try {
    const { instanceUrl, accessToken } = req.session.sf!;
    const result = await updateRecord(instanceUrl, accessToken, object, id, req.body);
    res.json(result);
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to update record", details: err.response?.data });
  }
});

router.delete("/:object/records/:id", async (req, res) => {
  const { object, id } = req.params;
  if (!isAllowedObject(object)) {
    return res.status(400).json({ error: "Object not allowed" });
  }
  try {
    const { instanceUrl, accessToken } = req.session.sf!;
    const result = await deleteRecord(instanceUrl, accessToken, object, id);
    res.json(result);
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to delete record", details: err.response?.data });
  }
});

export default router;