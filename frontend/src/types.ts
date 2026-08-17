export interface SFField {
  name: string;
  label: string;
  type: string;
  createable: boolean;
  updateable: boolean;
  required: boolean;
  picklistValues?: { label: string; value: string }[];
}

export type SFRecord = Record<string, any>;

export const SF_OBJECTS = [
  "Account",
  "Opportunity",
  "Lead",
  "Contact",
  "Case",
] as const;

export type SFObject = (typeof SF_OBJECTS)[number];