import React from 'react';
import {
  ArrowLeft, MapPin, Camera, Bot, GraduationCap, ScanLine, BarChart3, Cloud, Landmark, ClipboardList, RefreshCw,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { useScout } from '../ScoutContext.jsx';
import { RiskChip, MissionStatusChip } from './Chips.jsx';

const ICONS = {
  pin: MapPin,
  camera: Camera,
  ai: Bot,
  grad: GraduationCap,
  trap: ScanLine,
  chart: BarChart3,
  cloud: Cloud,
  gov: Landmark,
};

const VERIFY_LABELS = { consistent: 'Looks consistent', incorrect: 'Looks incorrect', unsure: 'Not sure' };

const EVIDENCE_CATEGORY_LABELS = {
  field: 'Whole field / crop view',
  plant: 'Affected plant / crop',
  symptom: 'Close-up of suspected symptom',
  damage: 'Damage / pest / fruit evidence',
  trap: 'Trap / sample evidence',
};

export default function ReportDetail({ reportId, onBack, onStartRevisit }) {
  const { reports } = useScout();
  const report = reports.find((r) => r.id === reportId);

  if (!report) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gov-textSec"><ArrowLeft size={16} /> Back</button>
        <p className="text-sm text-gov-textSec">Report not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gov-textSec hover:text-gov-navy">
        <ArrowLeft size={16} /> Back to reports
      </button>

      <div>
        <p className="text-xs font-bold text-gov-textSec">{report.id}</p>
        <h1 className="text-xl font-bold text-gov-navy mt-0.5">{report.finding}</h1>
        <p className="text-sm text-gov-textSec mt-0.5">{report.field} • {report.crop}</p>
        <div className="flex items-center gap-2 mt-2">
          <RiskChip level={report.risk} size="sm" />
          <MissionStatusChip status={report.status} size="sm" />
          {report.synced === false ? (
            <span className="text-[11px] font-semibold text-orange-600">Waiting to sync</span>
          ) : (
            <span className="text-[11px] font-semibold text-green-700">Synced</span>
          )}
        </div>
      </div>

      {report.status === 'Needs Revisit' && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Needs Revisit — Officer Feedback</p>
          {report.officerComment ? (
            <p className="text-sm text-red-800 mb-3">{report.officerComment}</p>
          ) : (
            <p className="text-sm text-red-700 mb-3">The Agriculture Officer has requested a revisit. Check for a specific comment below.</p>
          )}
          {onStartRevisit && (
            <button
              onClick={() => onStartRevisit(report.missionId || reportId)}
              className="flex items-center gap-2 text-sm font-bold text-red-700 border border-red-300 bg-white rounded-lg px-4 py-2 hover:bg-red-50 transition-colors"
            >
              <RefreshCw size={14} /> Start Revisit
            </button>
          )}
        </Card>
      )}

      <Card>
        <CardHeader title="Summary" />
        <dl className="space-y-2 text-sm">
          <Row label="Submitted" value={report.submittedAt} />
          {report.farmer && <Row label="Farmer" value={report.farmer} />}
          <Row label="AI confidence" value={report.aiConfidence ? `${report.aiConfidence}%` : '—'} />
          {report.symptoms && report.symptoms.length > 0 && (
            <Row label="Symptoms" value={report.symptoms.join(', ')} />
          )}
          {report.condition && <Row label="Crop condition" value={report.condition} />}
          {report.trapCount != null && <Row label="Trap count" value={report.trapCount} />}
          {report.trend && <Row label="Pest trend" value={report.trend} />}
          <Row label="Photos" value={report.photos} />
          <Row label="Data quality" value={`${report.dataQuality}%`} />
        </dl>
      </Card>

      {report.severity && (report.severity.affectedArea || report.severity.spread) && (
        <Card>
          <CardHeader title="Severity & Spread" />
          <dl className="space-y-2 text-sm">
            {report.severity.affectedArea && <Row label="Affected area" value={report.severity.affectedArea} />}
            {report.severity.spread && <Row label="Spread" value={report.severity.spread} />}
          </dl>
        </Card>
      )}

      {report.aiAssessment && (
        <Card>
          <CardHeader title="AI Preliminary Assessment" subtitle="Advisory only — not a confirmed diagnosis" />
          <dl className="space-y-2 text-sm">
            <Row label="Result" value={report.aiAssessment.diagnosis} />
            <Row label="Confidence" value={`${report.aiAssessment.confidence}%`} />
          </dl>
        </Card>
      )}

      {report.scoutVerification && (
        <Card>
          <CardHeader title="Scout Verification" />
          <dl className="space-y-2 text-sm">
            <Row label="Status" value={VERIFY_LABELS[report.scoutVerification.status] || report.scoutVerification.status} />
            {report.scoutVerification.note && <Row label="Note" value={report.scoutVerification.note} />}
          </dl>
        </Card>
      )}

      {(report.visitOutcome || report.outcomeLabel) && (
        <Card>
          <CardHeader icon={ClipboardList} title="Field Visit Outcome" subtitle="Student’s record of what happened during the physical visit" />
          <dl className="space-y-2 text-sm">
            <Row label="Outcome" value={report.outcomeLabel || report.visitOutcome} />
            {report.outcomeNote && <Row label="Notes" value={report.outcomeNote} />}
          </dl>
        </Card>
      )}

      {report.evidence && report.evidence.length > 0 && (
        <Card>
          <CardHeader
            icon={Camera}
            title="Field Evidence"
            subtitle={`${report.evidence.length} photo(s) • prototype storage only — no cloud image storage`}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {report.evidence.map((p, i) => (
              <div key={p.id || i} className="border border-gov-border rounded-xl overflow-hidden bg-white">
                <img src={p.dataUrl} alt={`Field evidence ${i + 1}`} className="aspect-square w-full object-cover" />
                <div className="p-2">
                  <p className="text-[11px] font-bold text-gov-navy">{EVIDENCE_CATEGORY_LABELS[p.category] || `Photo ${i + 1}`}</p>
                  {p.description ? (
                    <p className="text-[11px] text-gov-text mt-0.5">{p.description}</p>
                  ) : null}
                  <p className="text-[10px] text-gov-textSec mt-0.5">{p.capturedAt} • local prototype storage, no cloud storage</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Evidence Timeline" subtitle="Auditable field record" />        <div className="space-y-0">
          {report.timeline.map((ev, i) => {
            const Icon = ICONS[ev.icon] || MapPin;
            const isLast = i === report.timeline.length - 1;
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-gov-bg border border-gov-border flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-gov-blue" />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-gov-border" />}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="text-xs font-bold text-gov-textSec">{ev.time}</p>
                  <p className="text-sm text-gov-navy font-medium">{ev.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gov-textSec">{label}</dt>
      <dd className="font-semibold text-gov-navy">{value}</dd>
    </div>
  );
}
