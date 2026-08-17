export interface SFTokenResponse {
  access_token: string;
  refresh_token?: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

export interface SFSessionData {
  accessToken: string;
  refreshToken?: string;
  instanceUrl: string;
  userId?: string;
}

declare module "express-session" {
  interface SessionData {
    sf?: SFSessionData;
    oauthState?: string;
    pkceVerifier?: string;
  }
}

export interface SFFieldDescribe {
  name: string;
  label: string;
  type: string;
  createable: boolean;
  updateable: boolean;
  required: boolean;
  picklistValues?: { label: string; value: string }[];
}

export const ALLOWED_OBJECTS = [
  "Account",
  "Opportunity",
  "Lead",
  "Contact",
  "Case",
] as const;

export type AllowedObject = (typeof ALLOWED_OBJECTS)[number];