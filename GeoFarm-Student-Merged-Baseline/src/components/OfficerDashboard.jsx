import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Radio,
  Bug,
  ScanLine,
  CheckCircle2,
  XCircle,
  Send,
  Clock,
  Inbox,
} from 'lucide-react';
import { Card, CardHeader } from './ui/Card.jsx';
import { RiskBadge, StatusBadge, Badge } from './ui/Badge.jsx';
import { Modal } from './ui/Modal.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import {
  useAlertQueue,
  ALERT_STATUS,
  ALERT_SOURCE,
} from '../contexts/AlertQueueContext.jsx';

/**
 * Geo-Farm — Agriculture Officer Approval Dashboard
 * SIH26131: Early detection & management of crop diseases and pest infestations
 *
 * Government officer portal implementing the audit pipeline:
 *   AI Flagged -> Officer Audited (Verified / Rejected) -> Alert Dispatched
 *
 * Consumes AlertQueueContext, which is populated by:
 *   - EdgeAIScanner.jsx  (leaf-scan disease flags)
 *   - (telemetry/pest threshold breaches can also push alerts here)
 */

const SOURCE_ICON = {
  [ALERT_SOURCE.TELEMETRY]: Radio,
  [ALERT_SOURCE.PEST_FORECAST]: Bug,
  [ALERT_SOURCE.EDGE_AI_SCAN]: ScanLine,
};

const SOURCE_LABEL_KEY = {
  [ALERT_SOURCE.TELEMETRY]: 'sourceTelemetry',
  [ALERT_SOURCE.PEST_FORECAST]: 'sourcePestForecast',
  [ALERT_SOURCE.EDGE_AI_SCAN]: 'sourceEdgeAiScan',
};

function timeAgo(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function OfficerDashboard() {
  const { t } = useLanguage();
  const { alerts, pendingAlerts, verifiedAlerts, dispatchedAlerts, verifyAlert, rejectAlert, dispatchAlert } =
    useAlertQueue();

  const [selectedAlert, setSelectedAlert] = useState(null);
  // BUGFIX (B5): previously defaulted to a hardcoded fake name
  // ('Officer R. Patil'), meaning an alert could be verified/rejected
  // without anyone actually typing their identity — breaking the audit
  // trail this workflow exists to create. Now starts empty and is
  // validated before Verify/Reject are enabled.
  const [officerName, setOfficerName] = useState('');
  const [note, setNote] = useState('');
  const [tab, setTab] = useState('pending'); // pending | verified | dispatched | all

  const visibleAlerts = useMemo(() => {
    switch (tab) {
      case 'pending':
        return pendingAlerts;
      case 'verified':
        return verifiedAlerts;
      case 'dispatched':
        return dispatchedAlerts;
      case 'all':
      default:
        return alerts;
    }
  }, [tab, pendingAlerts, verifiedAlerts, dispatchedAlerts, alerts]);

  const openAlert = (alert) => {
    setSelectedAlert(alert);
    setNote('');
  };

  const closeModal = () => setSelectedAlert(null);

  const handleVerify = () => {
    if (!selectedAlert) return;
    const trimmedName = officerName.trim();
    if (!trimmedName) return;
    verifyAlert(selectedAlert.id, trimmedName, note.trim());
    closeModal();
  };

  const handleReject = () => {
    if (!selectedAlert) return;
    const trimmedName = officerName.trim();
    if (!trimmedName) return;
    rejectAlert(selectedAlert.id, trimmedName, note.trim());
    closeModal();
  };

  const isOfficerNameValid = officerName.trim().length > 0;

  const handleDispatch = (alert) => {
    dispatchAlert(alert.id, ['whatsapp', 'sms', 'ivr']);
  };

  const statusForAlert = (alert) => {
    if (alert.status === ALERT_STATUS.FLAGGED) return 'FLAGGED';
    if (alert.status === ALERT_STATUS.VERIFIED) return 'VERIFIED';
    if (alert.status === ALERT_STATUS.REJECTED) return 'REJECTED';
    return 'DISPATCHED';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          icon={ShieldCheck}
          title={t('officerDashboard')}
          subtitle={t('officerSubtitle')}
        />

        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatTile
            icon={Inbox}
            label={t('statusPending')}
            value={pendingAlerts.length}
            color="amber"
          />
          <StatTile
            icon={CheckCircle2}
            label={t('statusVerified')}
            value={verifiedAlerts.length}
            color="blue"
          />
          <StatTile
            icon={Send}
            label={t('statusDispatched')}
            value={dispatchedAlerts.length}
            color="green"
          />
        </div>

        <div className="flex items-center gap-1 mb-4 border-b border-gray-200 pb-2">
          {[
            { key: 'pending', label: `${t('statusPending')} (${pendingAlerts.length})` },
            { key: 'verified', label: `${t('statusVerified')} (${verifiedAlerts.length})` },
            { key: 'dispatched', label: `${t('statusDispatched')} (${dispatchedAlerts.length})` },
            { key: 'all', label: `${t('statusAll')} (${alerts.length})` },
          ].map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                tab === tabItem.key
                  ? 'bg-gov-blue/10 text-gov-blue'
                  : 'text-gov-textSec hover:text-gov-navy'
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {visibleAlerts.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-gov-textSec">
            <Inbox size={28} />
            <p className="text-sm">{t('noAlertsQueue')}</p>
            <p className="text-xs text-gray-500">{t('noAlertsHint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleAlerts.map((alert) => {
              const SourceIcon = SOURCE_ICON[alert.source] ?? Radio;
              return (
                <button
                  key={alert.id}
                  onClick={() => openAlert(alert)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded bg-white hover:bg-gray-50 border border-gray-200 transition-colors text-left shadow-sm"
                >
                  <div className="w-9 h-9 rounded bg-gov-bg flex items-center justify-center shrink-0 border border-gov-border">
                    <SourceIcon size={16} className="text-gov-blue" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gov-navy truncate">{alert.title}</p>
                    <p className="text-xs text-gov-textSec truncate">
                      {SOURCE_LABEL_KEY[alert.source] ? t(SOURCE_LABEL_KEY[alert.source]) : alert.source} · {timeAgo(alert.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RiskBadge level={alert.riskLevel} size="sm" />
                    <StatusBadge status={statusForAlert(alert)} size="sm" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        open={!!selectedAlert}
        onClose={closeModal}
        title={selectedAlert?.title ?? 'Alert Detail'}
        footer={
          selectedAlert?.status === ALERT_STATUS.FLAGGED ? (
            <>
              <button
                onClick={handleReject}
                disabled={!isOfficerNameValid}
                className="px-4 py-2 rounded text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <XCircle size={14} /> {t('reject')}
              </button>
              <button
                onClick={handleVerify}
                disabled={!isOfficerNameValid}
                className="px-4 py-2 rounded text-xs font-bold text-white bg-gov-blue hover:bg-gov-navy disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} /> {t('verify')}
              </button>
            </>
          ) : selectedAlert?.status === ALERT_STATUS.VERIFIED ? (
            <button
              onClick={() => {
                handleDispatch(selectedAlert);
                closeModal();
              }}
              className="px-4 py-2 rounded text-xs font-bold text-white bg-gov-blue hover:bg-gov-navy transition-colors flex items-center gap-1.5"
            >
              <Send size={14} /> {t('dispatch')}
            </button>
          ) : null
        }
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <RiskBadge level={selectedAlert.riskLevel} />
              <StatusBadge status={statusForAlert(selectedAlert)} />
              <Badge color="slate" size="sm">
                {SOURCE_LABEL_KEY[selectedAlert.source] ? t(SOURCE_LABEL_KEY[selectedAlert.source]) : selectedAlert.source}
              </Badge>
            </div>

            <p className="text-sm text-gray-800 leading-relaxed">{selectedAlert.description}</p>

            {selectedAlert.confidence !== undefined && (
              <p className="text-xs text-gray-600">
                {t('aiConfidence')}: <strong className="text-gray-800">{Math.round(selectedAlert.confidence * 100)}%</strong>
              </p>
            )}

            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock size={12} /> {t('flaggedTimeAgo')} {timeAgo(selectedAlert.createdAt)}
            </div>

            {selectedAlert.status === ALERT_STATUS.FLAGGED && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <label className="text-xs font-bold text-gov-textSec">{t('reviewingOfficer')}</label>
                <input
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Enter your full name..."
                  className={`w-full px-3 py-2 rounded bg-white border text-sm text-gray-800 focus:outline-none transition-colors ${
                    isOfficerNameValid ? 'border-gray-300 focus:border-gov-blue' : 'border-red-400 focus:border-red-600'
                  }`}
                />
                {!isOfficerNameValid && (
                  <p className="text-[11px] text-red-600">Officer name is required before verifying or rejecting.</p>
                )}
                <label className="text-xs font-bold text-gov-textSec">{t('fieldNote')}</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder={t('fieldNotePlaceholder')}
                  className="w-full px-3 py-2 rounded bg-white border border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-gov-blue resize-none"
                />
              </div>
            )}

            {selectedAlert.officerNote && (
              <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2.5">
                <span className="font-bold text-gray-800">
                  {selectedAlert.verifiedBy}:
                </span>{' '}
                {selectedAlert.officerNote}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, color }) {
  const colorClasses = {
    amber: 'bg-orange-50 text-orange-800 border-orange-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    green: 'bg-green-50 text-green-800 border-green-200',
  };
  return (
    <div className={`rounded border p-3 ${colorClasses[color] ?? colorClasses.blue}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} />
        <span className="text-[10px] uppercase tracking-wide font-bold opacity-80">{label}</span>
      </div>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
    </div>
  );
}
