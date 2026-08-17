import { useState } from "react";
import type { SFField, SFRecord } from "../types";

interface Props {
  objectName: string;
  fields: SFField[];
  initialValues?: SFRecord | null;
  onCancel: () => void;
  onSubmit: (values: SFRecord) => Promise<void>;
}

function inputTypeFor(field: SFField): string {
  switch (field.type) {
    case "date":
      return "date";
    case "datetime":
      return "datetime-local";
    case "boolean":
      return "checkbox";
    case "int":
    case "double":
    case "currency":
    case "percent":
      return "number";
    case "email":
      return "email";
    case "phone":
      return "tel";
    default:
      return "text";
  }
}

export default function RecordFormModal({
  objectName,
  fields,
  initialValues,
  onCancel,
  onSubmit,
}: Props) {
  const isEdit = !!initialValues;
  const [values, setValues] = useState<SFRecord>(() => {
    const base: SFRecord = {};
    fields.forEach((f) => {
      base[f.name] = initialValues?.[f.name] ?? (f.type === "boolean" ? false : "");
    });
    return base;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(name: string, value: any) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>
          {isEdit ? `Edit ${objectName}` : `New ${objectName}`}
        </h2>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          {fields.map((field) => {
            const inputType = inputTypeFor(field);

            if (field.picklistValues && field.picklistValues.length > 0) {
              return (
                <div className="form-field" key={field.name}>
                  <label>
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>
                  <select
                    required={field.required}
                    value={values[field.name] ?? ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {field.picklistValues.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (inputType === "checkbox") {
              return (
                <div className="form-field" key={field.name}>
                  <label>
                    <input
                      type="checkbox"
                      checked={!!values[field.name]}
                      onChange={(e) => handleChange(field.name, e.target.checked)}
                    />{" "}
                    {field.label}
                  </label>
                </div>
              );
            }

            return (
              <div className="form-field" key={field.name}>
                <label>
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                <input
                  type={inputType}
                  required={field.required}
                  value={values[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              </div>
            );
          })}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}