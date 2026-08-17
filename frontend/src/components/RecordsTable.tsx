import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api";
import type { SFField, SFObject, SFRecord } from "../types";
import RecordFormModal from "./RecordFormModal";

const PAGE_SIZE = 20;

export default function RecordsTable({ objectName }: { objectName: SFObject }) {
  const [fields, setFields] = useState<SFField[]>([]);
  const [records, setRecords] = useState<SFRecord[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SFRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<SFRecord | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setFields([]);
    setRecords([]);
    setOffset(0);
    setHasMore(true);
    setError(null);

    api
      .get(`/objects/${objectName}/fields`)
      .then((res) => setFields(res.data.fields))
      .catch(() => setError("Failed to load field metadata."));
  }, [objectName]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || fields.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/objects/${objectName}/records`, {
        params: { offset, limit: PAGE_SIZE },
      });
      const newRecords: SFRecord[] = res.data.records;
      setRecords((prev) => [...prev, ...newRecords]);
      setOffset((prev) => prev + newRecords.length);
      if (newRecords.length < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      setError("Failed to load records.");
    } finally {
      setLoading(false);
    }
  }, [objectName, offset, hasMore, loading, fields]);

  useEffect(() => {
    if (fields.length > 0 && records.length === 0 && hasMore) {
      loadMore();
    }
  }, [fields]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  async function handleCreate(values: SFRecord) {
    await api.post(`/objects/${objectName}/records`, values);
    setShowForm(false);
    setRecords([]);
    setOffset(0);
    setHasMore(true);
  }

  async function handleUpdate(values: SFRecord) {
    if (!editingRecord) return;
    await api.patch(`/objects/${objectName}/records/${editingRecord.Id}`, values);
    setRecords((prev) =>
      prev.map((r) => (r.Id === editingRecord.Id ? { ...r, ...values } : r))
    );
    setEditingRecord(null);
  }

  async function handleDelete(record: SFRecord) {
    if (!confirm(`Delete this ${objectName} record? This cannot be undone.`)) return;
    try {
      await api.delete(`/objects/${objectName}/records/${record.Id}`);
      setRecords((prev) => prev.filter((r) => r.Id !== record.Id));
    } catch {
      setError("Failed to delete record.");
    }
  }

  return (
    <div>
      <div className="toolbar">
        <span>{records.length} loaded</span>
        <button
          className="btn-primary"
          disabled={fields.length === 0}
          onClick={() => setShowForm(true)}
        >
          + New {objectName}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {fields.length > 0 && (
        <table>
          <thead>
            <tr>
              {fields.map((f) => (
                <th key={f.name}>{f.label}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.Id}>
                {fields.map((f) => (
                  <td key={f.name}>{String(record[f.name] ?? "")}</td>
                ))}
                <td>
                  <button
                    className="btn-secondary btn-small"
                    onClick={() => setViewingRecord(record)}
                  >
                    View
                  </button>

                  <button
                    className="btn-secondary btn-small"
                    onClick={() => setEditingRecord(record)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn-danger btn-small"
                    onClick={() => handleDelete(record)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div ref={sentinelRef} className="sentinel" />
      {loading && <div className="loading-row loading-row--active">Loading more records...</div>}
      {!hasMore && records.length > 0 && (
        <div className="loading-row">No more records.</div>
      )}
      {!loading && records.length === 0 && fields.length > 0 && (
        <div className="loading-row">No records found for {objectName}.</div>
      )}

      {showForm && (
        <RecordFormModal
          objectName={objectName}
          fields={fields}
          onCancel={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}
      {viewingRecord && (
        <RecordFormModal
          objectName={objectName}
          fields={fields}
          initialValues={viewingRecord}
          readOnly
          onCancel={() => setViewingRecord(null)}
          onSubmit={async () => { }}
        />
      )}
      {editingRecord && (
        <RecordFormModal
          objectName={objectName}
          fields={fields}
          initialValues={editingRecord}
          onCancel={() => setEditingRecord(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}