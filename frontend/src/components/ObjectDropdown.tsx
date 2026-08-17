import { SF_OBJECTS } from "../types";
import type { SFObject } from "../types";

interface Props {
  value: SFObject | null;
  onChange: (obj: SFObject) => void;
}

export default function ObjectDropdown({ value, onChange }: Props) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value as SFObject)}
    >
      <option value="" disabled>
        Select an object...
      </option>
      {SF_OBJECTS.map((obj) => (
        <option key={obj} value={obj}>
          {obj}
        </option>
      ))}
    </select>
  );
}