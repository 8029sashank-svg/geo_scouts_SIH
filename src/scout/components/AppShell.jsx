import React from 'react';
import {
  Home,
  ClipboardList,
  BookOpen,
  Bell,
  User,
  Sprout,
  Wifi,
  WifiOff,
  Plus,
  Languages,
  MapPin,
  ClipboardCheck,
} from 'lucide-react';
import { useScout } from '../ScoutContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

// Phase 1 — Agricultural Student Portal navigation.
// Legacy screen keys (missions, reports, guide, survey, trap) are still
// supported by ScoutApp.jsx router; the sidebar now exposes student terms.
// Primary student navigation — focused on field work.
// Removed from primary nav (routes/files still exist): Farm Map, Chat with Farmers,
// Cluster Visits, Leaderboard, Certificates.
const DESKTOP_NAV = [
  { key: 'dashboard', label: 'Dashboard', labelKey: 'navDashboard', icon: Home },
  { key: 'nearby', label: 'Nearby Cases', labelKey: 'navNearby', icon: MapPin },
  { key: 'assignments', label: 'My Assignments', labelKey: 'navAssignments', icon: ClipboardList },
  { key: 'visits', label: 'Field Visits', labelKey: 'navVisits', icon: ClipboardCheck },
  { key: 'library', label: 'Knowledge Library', labelKey: 'navLibrary', icon: BookOpen },
  { key: 'notifications', label: 'Notifications', labelKey: 'navNotifications', icon: Bell },
  { key: 'profile', label: 'My Profile', labelKey: 'navMyProfile', icon: User },
];

const MOBILE_NAV = [
  { key: 'dashboard', label: 'Home', labelKey: 'navHome', icon: Home },
  { key: 'nearby', label: 'Cases', labelKey: 'navCases', icon: MapPin },
  { key: 'visits', label: 'Visit', labelKey: 'navVisitTab', icon: Plus, primary: true },
  { key: 'assignments', label: 'Tasks', labelKey: 'navAssignments', icon: ClipboardList },
  { key: 'profile', label: 'Profile', labelKey: 'navMyProfile', icon: User },
];

export default function AppShell({ screen, onNavigate, children }) {
  const { scout, isOnline, toggleOnline, notifications } = useScout();
  const { t, language, toggleLanguage, isMarathi } = useLanguage();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gov-bg flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-gov-border sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-gov-border flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gov-blue flex items-center justify-center shrink-0">
            <Sprout size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gov-navy leading-tight">Geo-Farm</p>
            <p className="text-[11px] text-gov-textSec leading-tight">Student Portal</p>
          </div>
        </div>

        <p className="px-5 pt-4 pb-1 text-[10px] font-bold tracking-widest text-gov-textSec uppercase">Agricultural Student</p>
        <nav className="flex-1 overflow-y-auto px-2.5 py-1 space-y-0.5">
          {DESKTOP_NAV.map((item) => {
            const active = screen === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                  active ? 'bg-gov-blue/10 text-gov-blue font-bold' : 'text-gov-text hover:bg-gov-bg'
                }`}
              >
                <item.icon size={17} className="shrink-0" />
                <span className={`truncate ${isMarathi ? 'font-devanagari' : ''}`}>{item.labelKey ? t(item.labelKey) : item.label}</span>
                {item.key === 'notifications' && unread > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] h-[18px] flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-gov-border">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={toggleOnline}
              className={`flex-1 flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-md ${
                isOnline ? 'text-green-700 bg-green-50' : 'text-orange-700 bg-orange-50'
              }`}
            >
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              {isOnline ? 'Online' : 'Offline'}
            </button>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md text-gov-textSec bg-gov-bg hover:text-gov-blue"
              title="Toggle language"
            >
              <Languages size={13} /> {language === 'en' ? 'मराठी' : 'EN'}
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gov-navy text-white flex items-center justify-center text-xs font-bold shrink-0">
              {scout.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gov-navy truncate">{scout.name}</p>
              <p className="text-[11px] text-gov-textSec truncate">Agricultural Student</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gov-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gov-blue flex items-center justify-center">
              <Sprout size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gov-navy">Geo-Farm</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLanguage} className="text-[11px] font-bold text-gov-textSec flex items-center gap-1">
              <Languages size={13} /> {language === 'en' ? 'मर' : 'EN'}
            </button>
            <button onClick={toggleOnline} className={`text-[11px] font-bold flex items-center gap-1 ${isOnline ? 'text-green-700' : 'text-orange-600'}`}>
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            </button>
            <button onClick={() => onNavigate('notifications')} className="relative text-gov-navy">
              <Bell size={19} />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
          </div>
        </div>

        <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 pb-24 lg:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gov-border flex items-stretch px-1">
          {MOBILE_NAV.map((item) => {
            const active = screen === item.key;
            if (item.primary) {
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className="flex-1 flex flex-col items-center justify-center py-1.5"
                >
                  <span className="w-11 h-11 -mt-4 rounded-full bg-gov-blue text-white flex items-center justify-center shadow-md">
                    <item.icon size={22} />
                  </span>
                  <span className="text-[10px] font-bold text-gov-blue mt-0.5">{item.labelKey ? t(item.labelKey) : item.label}</span>
                </button>
              );
            }
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 ${
                  active ? 'text-gov-blue' : 'text-gov-textSec'
                }`}
              >
                <item.icon size={19} />
                <span className="text-[10px] font-semibold">{item.labelKey ? t(item.labelKey) : item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
