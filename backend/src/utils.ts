import axios from "axios";

/** True when the given error is an Axios response with a 401 Unauthorized status. */
export function isUnauthorizedError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

/** Extracts a loggable payload (Salesforce error body, message, or raw value) from an unknown thrown error. */
export function extractErrorDetails(err: unknown): unknown {
  if (axios.isAxiosError(err)) return err.response?.data ?? err.message;
  if (err instanceof Error) return err.message;
  return err;
}

/** Shape of a single error Salesforce's REST API returns, e.g. [{ message, errorCode, fields }]. */
interface SalesforceErrorEntry {
  message?: string;
  errorCode?: string;
  fields?: string[];
}

export function toClientError(err: unknown): {
  status: number;
  message: string;
} {
  if (axios.isAxiosError(err) && err.response) {
    const body = err.response.data as
      | SalesforceErrorEntry[]
      | SalesforceErrorEntry
      | undefined;
    const first = Array.isArray(body) ? body[0] : body;
    const message = first?.message ?? "Salesforce rejected the request.";
    return { status: err.response.status, message };
  }
  return { status: 500, message: "Unexpected server error." };
}
