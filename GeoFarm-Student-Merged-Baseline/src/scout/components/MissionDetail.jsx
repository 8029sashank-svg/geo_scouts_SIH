import React from 'react';
import { ArrowLeft, Droplets, Leaf, Users, Activity, CheckSquare, MapPin, ArrowRight, Target } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { useScout } from '../ScoutContext.jsx';
import { PriorityChip, MissionStatusChip } from './Chips.jsx';
import { MISSION_STATUS } from '../mockData.js';

export default function MissionDetail({ missionId, onBack, onStartVisit }) {
  const { missions, updateMissionStatus } = useScout();
  const mission = missions.find((m) => m.id === missionId);

  if (!mission) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gov-textSec"><ArrowLeft size={16} /> Back</button>
        <p className="text-sm text-gov-textSec">Mission not found.</p>
      </div>
    );
  }

  const inProgress = mission.status === MISSION_STATUS.IN_PROGRESS;

  // Mirrors the unified Field Visit workflow's steps — kept in sync
  // manually since this is just a preview, not a duplicate flow.
  const objectiveChecklist = [
    'Confirm field/location',
    'Record crop and growth stage',
    'Record visible symptoms',
    'Capture whole-field/crop evidence',
    'Capture close-up symptom evidence',
    ...(mission.trapId ? ['Record smart-trap information'] : []),
    'Estimate affected area and spread',
    'Add field observations/notes',
  ];

  const handleStart = () => {
    updateMissionStatus(mission.id, MISSION_STATUS.IN_PROGRESS);
    onStartVisit(mission.id);
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gov-textSec hover:text-gov-navy">
        <ArrowLeft size={16} /> Back to missions
      </button>

      <div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-gov-textSec">Mission #{mission.id}</p>
          <PriorityChip level={mission.priority} />
        </div>
        <h1 className="text-xl font-bold text-gov-navy mt-1">{mission.title}</h1>
        <p className="text-sm text-gov-textSec flex items-center gap-1 mt-1">
          <MapPin size={13} /> {mission.location}
        </p>
      </div>

      <Card>
        <CardHeader title="Mission Overview" />
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-gov-textSec">Assigned by</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.assignedBy}</dd>
          <dt className="text-gov-textSec">Target</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.crop} field</dd>
          <dt className="text-gov-textSec">Survey type</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.surveyType}</dd>
          <dt className="text-gov-textSec">Field</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.fieldName}</dd>
          <dt className="text-gov-textSec">Coordinates</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.coords[0].toFixed(4)}° N, {mission.coords[1].toFixed(4)}° E</dd>
          <dt className="text-gov-textSec">Crop stage</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.cropStage}</dd>
          <dt className="text-gov-textSec">Last observation</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.lastObservation}</dd>
          <dt className="text-gov-textSec">Status</dt>
          <dd className="text-right"><MissionStatusChip status={mission.status} size="sm" /></dd>
        </dl>
      </Card>

      <Card>
        <CardHeader icon={Activity} title="Why This Mission Was Created" subtitle="Early warning detected" />
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gov-bg rounded-lg p-3 border border-gov-border">
            <div className="flex items-center gap-1.5 text-gov-textSec text-xs font-semibold"><Droplets size={13} /> Humidity</div>
            <p className="text-lg font-bold text-gov-navy mt-0.5">{mission.reason.humidity}%</p>
          </div>
          <div className="bg-gov-bg rounded-lg p-3 border border-gov-border">
            <div className="flex items-center gap-1.5 text-gov-textSec text-xs font-semibold"><Leaf size={13} /> Leaf wetness</div>
            <p className="text-lg font-bold text-gov-navy mt-0.5">{mission.reason.leafWetness}</p>
          </div>
          <div className="bg-gov-bg rounded-lg p-3 border border-gov-border">
            <div className="flex items-center gap-1.5 text-gov-textSec text-xs font-semibold"><Users size={13} /> Nearby reports</div>
            <p className="text-lg font-bold text-gov-navy mt-0.5">{mission.reason.nearbyReports}</p>
          </div>
          <div className="bg-gov-bg rounded-lg p-3 border border-gov-border">
            <div className="text-gov-textSec text-xs font-semibold">Risk model</div>
            <p className="text-lg font-bold text-red-600 mt-0.5">{mission.reason.riskModel}</p>
          </div>
        </div>
        <p className="text-xs text-gov-textSec mt-3">
          Previous field observation: <span className="font-semibold text-gov-navy">{mission.reason.previousObservation}</span>
        </p>
      </Card>

      <Card>
        <CardHeader icon={CheckSquare} title="Recommended Field Action" subtitle="Inspect the following" />
        <ul className="space-y-2">
          {mission.recommendedChecks.map((c) => (
            <li key={c} className="flex items-center gap-2 text-sm text-gov-text">
              <span className="w-1.5 h-1.5 rounded-full bg-gov-blue shrink-0" /> {c}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader icon={Target} title="Field Visit Objective" subtitle="Why you're being sent, and what to collect" />

        <p className="text-xs font-bold text-gov-textSec uppercase tracking-wide mb-1.5">Why this visit</p>
        <p className="text-sm text-gov-text mb-4">
          Verify {mission.reason.previousObservation.toLowerCase()} reported in this field.
        </p>

        <p className="text-xs font-bold text-gov-textSec uppercase tracking-wide mb-1.5">What to collect</p>
        <ul className="space-y-1.5 mb-4">
          {objectiveChecklist.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-gov-text">
              <CheckSquare size={13} className="text-gov-blue shrink-0" /> {item}
            </li>
          ))}
        </ul>

        <p className="text-xs text-gov-textSec border-t border-gray-100 pt-3">
          The completed Field Verification Report will be sent to the Agriculture Officer for review.
        </p>
      </Card>

      <div className="sticky bottom-16 lg:bottom-0 lg:static pt-2">
        {mission.status === MISSION_STATUS.COMPLETED || mission.status === MISSION_STATUS.UNDER_REVIEW || mission.status === MISSION_STATUS.VERIFIED ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-lg py-3 text-center">
            This mission has already been submitted.
          </div>
        ) : (
          <button
            onClick={handleStart}
            className="w-full bg-gov-blue hover:bg-gov-navy text-white font-bold py-3.5 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors"
          >
            {inProgress ? 'Continue Field Visit' : 'START FIELD VISIT'} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
