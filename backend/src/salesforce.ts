import axios from "axios";
import { SFFieldDescribe, SFTokenResponse } from "./types";
import crypto from "crypto";

const SF_API_VERSION = "v59.0";

export function generatePkcePair() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

export function buildAuthorizeUrl(
  state: string,
  codeChallenge: string,
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SF_CLIENT_ID as string,
    redirect_uri: process.env.SF_REDIRECT_URI as string,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${process.env.SF_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<SFTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: process.env.SF_CLIENT_ID as string,
    client_secret: process.env.SF_CLIENT_SECRET as string,
    redirect_uri: process.env.SF_REDIRECT_URI as string,
    code_verifier: codeVerifier,
  });

  const res = await axios.post<SFTokenResponse>(
    process.env.SF_TOKEN_URL as string,
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );
  return res.data;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<SFTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.SF_CLIENT_ID as string,
    client_secret: process.env.SF_CLIENT_SECRET as string,
  });

  const res = await axios.post<SFTokenResponse>(
    process.env.SF_TOKEN_URL as string,
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );
  return res.data;
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function sobjectsUrl(instanceUrl: string, object: string, suffix = "") {
  return `${instanceUrl}/services/data/${SF_API_VERSION}/sobjects/${object}${suffix}`;
}

function queryUrl(instanceUrl: string, soql: string) {
  return `${instanceUrl}/services/data/${SF_API_VERSION}/query/?q=${encodeURIComponent(
    soql,
  )}`;
}

const EXCLUDED_TYPES = new Set([
  "address",
  "location",
  "base64",
  "anyType",
  "reference",
]);

export async function describeObjectFields(
  instanceUrl: string,
  accessToken: string,
  object: string,
): Promise<SFFieldDescribe[]> {
  const res = await axios.get(sobjectsUrl(instanceUrl, object, "/describe/"), {
    headers: authHeaders(accessToken),
  });

  const allFields = res.data.fields as any[];

  const candidates = allFields
    .filter((f) => f.name !== "Id")
    .filter((f) => !EXCLUDED_TYPES.has(f.type))
    .filter((f) => f.createable || f.updateable)
    .map((f) => ({
      name: f.name as string,
      label: f.label as string,
      type: f.type as string,
      createable: f.createable as boolean,
      updateable: f.updateable as boolean,
      required: !f.nillable && f.createable && !f.defaultedOnCreate,
      picklistValues:
        f.type === "picklist" && Array.isArray(f.picklistValues)
          ? f.picklistValues
              .filter((p: any) => p.active)
              .map((p: any) => ({ label: p.label, value: p.value }))
          : undefined,
    }));

  candidates.sort((a, b) => {
    const score = (f: SFFieldDescribe) =>
      (f.name.toLowerCase().includes("name") ? 0 : 1) + (f.required ? 0 : 0.5);
    return score(a) - score(b);
  });

  const picked = candidates.slice(0, 8);
  return picked;
}

export async function queryRecords(
  instanceUrl: string,
  accessToken: string,
  object: string,
  fieldNames: string[],
  limit: number,
  offset: number,
) {
  const fields = ["Id", ...fieldNames].join(", ");
  const soql = `SELECT ${fields} FROM ${object} ORDER BY CreatedDate DESC LIMIT ${limit} OFFSET ${offset}`;

  const res = await axios.get(queryUrl(instanceUrl, soql), {
    headers: authHeaders(accessToken),
  });

  return {
    records: res.data.records.map((r: any) => {
      const { attributes, ...rest } = r;
      return rest;
    }),
    totalSize: res.data.totalSize,
    done: res.data.done,
  };
}

export async function createRecord(
  instanceUrl: string,
  accessToken: string,
  object: string,
  data: Record<string, any>,
) {
  const res = await axios.post(sobjectsUrl(instanceUrl, object), data, {
    headers: {
      ...authHeaders(accessToken),
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

export async function updateRecord(
  instanceUrl: string,
  accessToken: string,
  object: string,
  id: string,
  data: Record<string, any>,
) {
  await axios.patch(sobjectsUrl(instanceUrl, object, `/${id}`), data, {
    headers: {
      ...authHeaders(accessToken),
      "Content-Type": "application/json",
    },
  });
  return { success: true };
}

export async function deleteRecord(
  instanceUrl: string,
  accessToken: string,
  object: string,
  id: string,
) {
  await axios.delete(sobjectsUrl(instanceUrl, object, `/${id}`), {
    headers: authHeaders(accessToken),
  });
  return { success: true };
}
