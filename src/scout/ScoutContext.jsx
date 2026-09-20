import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  SCOUT_PROFILE,
  INITIAL_MISSIONS,
  INITIAL_REPORTS,
  NOTIFICATIONS,
  TRAPS,
  MISSION_STATUS,
  NEARBY_CASES,
} from './mockData.js';
import { postReport } from './api.js';

/**
 * Geo-Farm Field Operations — Scout app state
 *
 * Central mock state store for the Field Scout portal: missions, reports,
 * notifications, trap data, and a simulated offline/sync queue. Mirrors
 * the reducer-less useState + useCallback pattern already used elsewhere
 * in this codebase (see AlertQueueContext) but scoped to the field-scout
 * workflow specifically.
 */

const ScoutContext = createContext(undefined);

function nextReportSuffix(missionId) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `GF-RPT-${y}${m}${d}-${missionId.replace('GF-', '')}`;
}

// Phase 5 (mock only): +50 pts per completed field visit at submission.
// The +30 verification bonus is reserved for a future officer state.
const COMPLETION_POINTS = 50;

export function ScoutProvider({ children }) {
  const [missions, setMissions] = useState(INITIAL_MISSIONS);
  const [reports, setReports] = useState(() => INITIAL_REPORTS.map((r) => ({ ...r, synced: true })));
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [traps] = useState(TRAPS);
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState([]);

  // Phase 3A/3B (mock only): field-visit progress per assigned case.
  // Shape: { [caseId]: { status: 'Not Started' | 'Checked In' | 'In Progress' | 'Completed', checkedInAt: string|null } }
  // Declared up here on purpose — submitReport below writes to it, so it
  // must exist before submitReport is created (hook order matters).
  // It only uses its own setter, so it cannot hit a TDZ issue itself.
  const [visits, setVisits] = useState({});

  const updateVisitStatus = useCallback((caseId, status) => {
    if (!caseId) return;
    setVisits((prev) => {
      const current = prev[caseId] || { status: 'Not Started', checkedInAt: null };
      const checkedInAt =
        current.checkedInAt ||
        (status !== 'Not Started'
          ? new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
          : null);
      return { ...prev, [caseId]: { ...current, status, checkedInAt } };
    });
  }, []);

  const [farmerAvailabilities, setFarmerAvailabilities] = useState({});
  const updateFarmerAvailability = useCallback((caseId, status) => {
    setFarmerAvailabilities((prev) => ({ ...prev, [caseId]: status }));
  }, []);

  // Phase 3B (mock only): points earned by completing field visits.
  // Phase 5 drives all displays from totalPoints below — one source.
  const [extraPoints, setExtraPoints] = useState(0);

  const awardPoints = useCallback((n) => {
    if (!n) return;
    setExtraPoints((prev) => prev + n);
  }, []);

  // Phase 5 (mock only): report ids already awarded, so resubmitting the
  // same report never double-counts points.
  const [awardedReportIds, setAwardedReportIds] = useState({});

  // Phase 4 (mock only): field-evidence photos per visit, session-only.
  // Each photo: { id, name, type, size, dataUrl, description, capturedAt }.
  // DataURLs stay in memory — never uploaded anywhere. All three helpers
  // only use the visits setter declared above, so hook order stays safe.
  const addVisitPhotos = useCallback((caseId, photoObjs) => {
    if (!caseId || !photoObjs?.length) return;
    setVisits((prev) => {
      const current = prev[caseId] || { status: 'Not Started', checkedInAt: null, photos: [] };
      const merged = [...(current.photos || []), ...photoObjs].slice(0, 5);
      return { ...prev, [caseId]: { ...current, photos: merged } };
    });
  }, []);

  const updateVisitPhoto = useCallback((caseId, photoId, patch) => {
    if (!caseId || !photoId) return;
    setVisits((prev) => {
      const current = prev[caseId];
      if (!current?.photos) return prev;
      return {
        ...prev,
        [caseId]: { ...current, photos: current.photos.map((p) => (p.id === photoId ? { ...p, ...patch } : p)) },
      };
    });
  }, []);

  const removeVisitPhoto = useCallback((caseId, photoId) => {
    if (!caseId || !photoId) return;
    setVisits((prev) => {
      const current = prev[caseId];
      if (!current?.photos) return prev;
      return { ...prev, [caseId]: { ...current, photos: current.photos.filter((p) => p.id !== photoId) } };
    });
  }, []);

  const updateMissionStatus = useCallback((missionId, status) => {
    setMissions((prev) => prev.map((m) => (m.id === missionId ? { ...m, status } : m)));
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [
      { id: `N${Date.now()}`, time: 'Just now', read: false, ...notif },
      ...prev,
    ]);
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const queueForSync = useCallback((label) => {
    setSyncQueue((prev) => [...prev, { id: `S${Date.now()}-${prev.length}`, label }]);
  }, []);

  const markSynced = useCallback((reportId) => {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, synced: true } : r)));
    setSyncQueue((prev) => prev.filter((item) => !item.label.includes(reportId)));
  }, []);

  // Retry any reports still marked unsynced. Used by the "sync now"
  // button and after login/online toggle. Failures just stay queued —
  // the demo keeps working with local state either way.
  const syncNow = useCallback(() => {
    setReports((prevReports) => {
      const unsynced = prevReports.filter((r) => !r.synced);
      unsynced.forEach((r) => {
        postReport(r).then(() => markSynced(r.id)).catch(() => {});
      });
      return prevReports;
    });
  }, [markSynced]);

  const toggleOnline = useCallback(() => {
    setIsOnline((prev) => {
      const next = !prev;
      if (next) syncNow();
      return next;
    });
  }, [syncNow]);

  const submitReport = useCallback(
    (mission, reportData) => {
      const id = nextReportSuffix(mission.id);
      // Farmer names live on the Nearby Cases mock (missions only carry
      // field/location) — look up for the report record. Mock only.
      const nearbyCase = NEARBY_CASES.find((c) => c.id === mission.id);
      const report = {
        id,
        missionId: mission.id,
        scoutId: SCOUT_PROFILE.scoutId,
        scoutName: SCOUT_PROFILE.name,
        farmer: nearbyCase?.farmer || null,
        field: mission.location.split(',')[0],
        location: mission.location,
        coordinates: mission.coords,
        crop: mission.crop,
        variety: reportData.variety || null,
        growthStage: reportData.growthStage || null,
        area: reportData.area || null,
        finding: reportData.finding,
        risk: reportData.risk,
        status: 'Awaiting Officer Review',
        submittedAt: 'Just now',
        dataQuality: reportData.dataQuality,
        aiConfidence: reportData.aiConfidence ?? reportData.aiAssessment?.confidence ?? null,
        aiAssessment: reportData.aiAssessment || null,
        scoutVerification: reportData.scoutVerification || null,
        visitOutcome: reportData.visitOutcome || null,
        outcomeLabel: reportData.outcomeLabel || null,
        outcomeNote: reportData.outcomeNote || null,
        severity: reportData.severity || null,
        fieldNotes: reportData.fieldNotes || '',
        trapCount: reportData.trapCount ?? null,
        trend: reportData.trend ?? null,
        photos: reportData.photos ?? 0,
        symptoms: reportData.symptoms || [],
        condition: reportData.condition || null,
        timeline: reportData.timeline || [],
        // Set by a future Agriculture Officer portal — always null on submit.
        officerComment: null,
        synced: false,
        farmerAvailability: farmerAvailabilities[mission.id] || null,
      };
      // Evidence photos: prefer what the caller passes directly (avoids a
      // stale-closure race with the addVisitPhotos() call fired just before
      // submit). Fall back to the shared visits store for older callers.
      const visitEvidence = reportData.evidence || visits[mission.id]?.photos || [];
      if (visitEvidence.length > 0) {
        report.evidence = visitEvidence;
        report.photos = Math.max(reportData.photos ?? 0, visitEvidence.length);
      }
      setReports((prev) => [report, ...prev]);
      // Phase 3B: a submitted report completes the assignment chain —
      // mission Completed (still counted/displayed as done everywhere),
      // visit Completed. Phase 5: +50 completion points, once per report.
      updateMissionStatus(mission.id, MISSION_STATUS.COMPLETED);
      updateVisitStatus(mission.id, 'Completed');
      if (!awardedReportIds[id]) {
        setAwardedReportIds((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
        awardPoints(COMPLETION_POINTS);
      }

      if (isOnline) {
        postReport(report).then(() => markSynced(id)).catch(() => queueForSync(`Field Report ${id}`));
      } else {
        queueForSync(`Field Report ${id}`);
      }

      addNotification({
        level: 'success',
        title: 'Field report submitted',
        body: `Report ${id} submitted for case ${mission.id}. You earned +${COMPLETION_POINTS} points.`,
      });

      return report;
    },
    [isOnline, queueForSync, addNotification, updateMissionStatus, markSynced, updateVisitStatus, awardPoints, visits, awardedReportIds, farmerAvailabilities]
  );

  // Applies a status + optional officerComment to a report. Used to
  // simulate the Needs Revisit state without a real Officer Portal.
  // Mock only — in production this would come from a server push.
  const updateReportStatus = useCallback((reportId, status, officerComment) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status, officerComment: officerComment ?? r.officerComment }
          : r
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      scout: SCOUT_PROFILE,
      missions,
      updateMissionStatus,
      reports,
      submitReport,
      updateReportStatus,
      notifications,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      traps,
      isOnline,
      toggleOnline,
      syncQueue,
      syncNow,
      queueForSync,
      visits,
      updateVisitStatus,
      addVisitPhotos,
      updateVisitPhoto,
      removeVisitPhoto,
      extraPoints,
      awardPoints,
      // Phase 5 (mock only): single source of truth for student progress.
      // totalPoints feeds Dashboard, Leaderboard and Profile alike;
      // sessionCompletions counts reports awarded this session.
      totalPoints: SCOUT_PROFILE.points + extraPoints,
      sessionCompletions: Object.keys(awardedReportIds).length,
      farmerAvailabilities,
      updateFarmerAvailability,
    }),
    [
      missions,
      updateMissionStatus,
      reports,
      submitReport,
      updateReportStatus,
      notifications,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      traps,
      isOnline,
      toggleOnline,
      syncQueue,
      syncNow,
      queueForSync,
      visits,
      updateVisitStatus,
      addVisitPhotos,
      updateVisitPhoto,
      removeVisitPhoto,
      extraPoints,
      awardPoints,
      awardedReportIds,
      farmerAvailabilities,
      updateFarmerAvailability,
    ]
  );

  return <ScoutContext.Provider value={value}>{children}</ScoutContext.Provider>;
}

export function useScout() {
  const ctx = useContext(ScoutContext);
  if (!ctx) throw new Error('useScout must be used within a ScoutProvider');
  return ctx;
}

export default ScoutContext;
