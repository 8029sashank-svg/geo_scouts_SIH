import React, { useState } from 'react';
import { ScoutProvider, useScout } from './ScoutContext.jsx';
import { MISSION_STATUS } from './mockData.js';
import Login from './components/Login.jsx';
import VerifyInfo from './components/VerifyInfo.jsx';
import AppShell from './components/AppShell.jsx';
import Dashboard from './components/Dashboard.jsx';
import Missions from './components/Missions.jsx';
import MissionDetail from './components/MissionDetail.jsx';
import TrapScan from './components/TrapScan.jsx';
import FieldMap from './components/FieldMap.jsx';
import Reports from './components/Reports.jsx';
import ReportDetail from './components/ReportDetail.jsx';
import Profile from './components/Profile.jsx';
import Notifications from './components/Notifications.jsx';
import FieldGuide from './components/FieldGuide.jsx';
import ChatFarmers from './components/ChatFarmers.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import Certificates from './components/Certificates.jsx';
import NearbyCases from './components/NearbyCases.jsx';
import CaseDetail from './components/CaseDetail.jsx';
import FieldVisit from './components/FieldVisit.jsx';
import ClusterVisits from './components/ClusterVisits.jsx';

/**
 * Geo-Farm — Agricultural Student Portal root (Phase 1).
 *
 * State-based navigation (no react-router). Pass 1: Field Visit and Field
 * Survey used to be two separate, overlapping flows reachable from
 * different buttons (Mission Detail vs My Assignments). They are now ONE
 * flow (FieldVisit.jsx) — both "Start Field Visit" entry points call the
 * same startFieldVisit() handler below. The old FieldSurvey.jsx file is
 * no longer imported or routed to.
 */
export default function ScoutApp() {
  const [authed, setAuthed] = useState(false);
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'verify'
  const [screen, setScreen] = useState('dashboard');
  const [activeMissionId, setActiveMissionId] = useState(null);
  const [activeReportId, setActiveReportId] = useState(null);
  // Phase 2 (mock only, local to router): open case + accepted visits.
  // Badge state stays here; the shared mission status is synced via
  // ScoutContext.updateMissionStatus so My Assignments + Dashboard update.
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [acceptedCaseIds, setAcceptedCaseIds] = useState({});
  // Pass 1: which mission/case the unified Field Visit flow was started for.
  const [activeVisitId, setActiveVisitId] = useState(null);
  // Safe: ScoutApp always renders inside ScoutProvider (see ScoutAppRoot).
  const { updateMissionStatus, addNotification } = useScout();

  if (!authed) {
    if (authScreen === 'verify') {
      return <VerifyInfo onBack={() => setAuthScreen('login')} />;
    }
    return (
      <Login
        onLogin={() => {
          setAuthed(true);
          setScreen('dashboard');
        }}
        onShowVerify={() => setAuthScreen('verify')}
      />
    );
  }

  const handleNavigate = (key) => {
    setScreen(key);
  };

  const openMission = (id) => {
    setActiveMissionId(id);
    setScreen('missionDetail');
  };

  const openCase = (id) => {
    setActiveCaseId(id);
    setScreen('caseDetail');
  };

  const handleAcceptCase = (id) => {
    if (!id) return;
    setAcceptedCaseIds((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
    // Share with the rest of the app: Nearby Case IDs match Mission IDs
    // (GF-1042, GF-1038). No-op for IDs without a mission (e.g. GF-RHR-201).
    updateMissionStatus(id, MISSION_STATUS.ACCEPTED);
    addNotification({
      level: 'info',
      title: 'New assignment',
      body: `Case ${id} accepted. Find it under My Assignments.`,
    });
  };

  const openReport = (id) => {
    setActiveReportId(id);
    setScreen('reportDetail');
  };

  const startFieldVisit = (id) => {
    setActiveVisitId(id);
    setScreen('fieldVisit');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'nearby':
        return <NearbyCases onOpenCase={openCase} acceptedIds={acceptedCaseIds} />;
      case 'caseDetail':
        return (
          <CaseDetail
            caseId={activeCaseId}
            assigned={!!acceptedCaseIds[activeCaseId]}
            onBack={() => setScreen('nearby')}
            onAccept={handleAcceptCase}
          />
        );
      case 'assignments':
      case 'missions':
        return <Missions onOpenMission={openMission} onStartVisit={startFieldVisit} onOpenReport={openReport} />;
      case 'fieldVisit':
        return (
          <FieldVisit
            visitId={activeVisitId}
            onBack={() => setScreen('assignments')}
            onComplete={() => setScreen('dashboard')}
          />
        );
      case 'missionDetail':
        return (
          <MissionDetail
            missionId={activeMissionId}
            onBack={() => setScreen('nearby')}
            onStartVisit={startFieldVisit}
          />
        );
      case 'trap':
        return <TrapScan />;
      case 'map':
        return <FieldMap onOpenMission={openMission} onNavigate={handleNavigate} />;
      case 'visits':
      case 'reports':
        return <Reports onOpenReport={openReport} />;
      case 'reportDetail':
        return <ReportDetail reportId={activeReportId} onBack={() => setScreen('visits')} />;
      case 'library':
      case 'guide':
        return <FieldGuide />;
      case 'chat':
        return <ChatFarmers />;
      case 'clusters':
        return <ClusterVisits onNavigate={handleNavigate} />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'certificates':
        return <Certificates />;
      case 'notifications':
        return <Notifications />;
      case 'profile':
        return <Profile onLogout={() => setAuthed(false)} />;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={handleNavigate} onOpenMission={openMission} />;
    }
  };

  // Highlight the right nav item even on detail sub-screens.
  const navScreen =
    screen === 'missionDetail'
      ? 'nearby'
      : screen === 'caseDetail'
        ? 'nearby'
        : screen === 'fieldVisit'
          ? 'assignments'
          : screen === 'reportDetail' || screen === 'trap'
        ? 'visits'
        : screen === 'missions'
          ? 'nearby'
          : screen === 'reports'
            ? 'visits'
            : screen === 'guide'
              ? 'library'
              : screen;

  return (
    <AppShell screen={navScreen} onNavigate={handleNavigate}>
      {renderScreen()}
    </AppShell>
  );
}

export function ScoutAppRoot() {
  return (
    <ScoutProvider>
      <ScoutApp />
    </ScoutProvider>
  );
}
