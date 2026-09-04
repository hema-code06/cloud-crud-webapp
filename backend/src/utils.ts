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
