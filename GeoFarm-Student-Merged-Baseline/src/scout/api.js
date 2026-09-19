// Talks to the local Express MVP backend (server/server.js).
// If the backend isn't running, callers catch the rejected promise and
// fall back to the existing offline/local-only behavior.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function postReport(report) {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  });
  if (!res.ok) throw new Error('Failed to sync report');
  return res.json();
}

export async function fetchReports() {
  const res = await fetch(`${API_BASE}/reports`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function patchReportStatus(id, status) {
  const res = await fetch(`${API_BASE}/reports/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update report status');
  return res.json();
}
