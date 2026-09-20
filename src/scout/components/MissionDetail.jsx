import React from 'react';
import { ArrowLeft, Droplets, Leaf, Users, Activity, CheckSquare, MapPin, ArrowRight, Target, AlertTriangle, Navigation, User, Phone, Calendar, Clock } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { useScout } from '../ScoutContext.jsx';
import { PriorityChip, MissionStatusChip } from './Chips.jsx';
import { MISSION_STATUS } from '../mockData.js';
import { STUDENT_OPERATING_RADIUS_KM, isWithinOperatingRadius } from '../config.js';

export default function MissionDetail({ missionId, onBack, onStartVisit }) {
  const { missions, updateMissionStatus, farmerAvailabilities, updateFarmerAvailability } = useScout();
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
  const withinRadius = isWithinOperatingRadius(mission.distanceKm);

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

  // Build a Google Maps URL from the mission's existing coordinates.
  // Priority: coords → location string → unavailable.
  // No fake coordinates are generated.
  const hasCoords =
    Array.isArray(mission.coords) &&
    mission.coords.length === 2 &&
    typeof mission.coords[0] === 'number' &&
    typeof mission.coords[1] === 'number';
  const hasLocation = typeof mission.location === 'string' && mission.location.trim().length > 0;

  let googleMapsUrl = null;
  if (hasCoords) {
    googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mission.coords[0]},${mission.coords[1]}`;
  } else if (hasLocation) {
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mission.location.trim())}`;
  }

  const handleNavigate = () => {
    if (googleMapsUrl) window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
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
        <CardHeader icon={User} title="Farmer / Field" />
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-gov-textSec">Farmer Name</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.farmerName || '—'}</dd>
          
          <dt className="text-gov-textSec">Farmer ID</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.farmerId || '—'}</dd>
          
          <dt className="text-gov-textSec">Field ID</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.fieldId || '—'}</dd>
          
          <dt className="text-gov-textSec">Plot Number</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.plotNumber || '—'}</dd>
          
          <dt className="text-gov-textSec">Village / Location</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.location}</dd>
          
          <dt className="text-gov-textSec">Crop</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.crop}</dd>
        </dl>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
          {mission.farmerPhone ? (
            <a 
              href={`tel:${mission.farmerPhone.replace(/\s+/g, '')}`}
              className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Phone size={15} /> Call Farmer
            </a>
          ) : (
            <div className="flex-1 bg-gray-50 text-gray-400 border border-gray-200 font-semibold py-2 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
              <Phone size={15} /> No Phone
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader icon={Calendar} title="Visit Schedule & Preparation" />
        <dl className="grid grid-cols-2 gap-y-3 text-sm mb-4">
          <dt className="text-gov-textSec flex items-center gap-1.5"><Calendar size={13} /> Visit Date</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.visitDate || '—'}</dd>
          
          <dt className="text-gov-textSec flex items-center gap-1.5"><Clock size={13} /> Preferred Time</dt>
          <dd className="font-semibold text-gov-navy text-right">{mission.preferredTime || '—'}</dd>
        </dl>

        <div className="pt-3 border-t border-gray-100">
          <label className="block text-xs font-bold text-gov-textSec uppercase tracking-wide mb-1.5">
            Farmer Availability
          </label>
          <select 
            value={farmerAvailabilities[mission.id] || ''}
            onChange={(e) => updateFarmerAvailability(mission.id, e.target.value)}
            className="w-full bg-white border border-gov-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-gov-blue text-gov-navy font-semibold"
          >
            <option value="" disabled>Select availability...</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
            <option value="Not Contacted">Not Contacted</option>
            <option value="Unable to Reach">Unable to Reach</option>
          </select>
        </div>
      </Card>

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
          <dt className="text-gov-textSec">Distance</dt>
          <dd className={`font-semibold text-right ${withinRadius ? 'text-gov-navy' : 'text-red-600'}`}>
            {mission.distanceKm} km {withinRadius ? '' : '(outside radius)'}
          </dd>
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

      <Card>
        <CardHeader title="Before You Visit" subtitle="Preparation checklist" />
        <ul className="space-y-2 text-sm text-gov-navy font-semibold">
          <li className="flex items-center gap-2">
            <CheckSquare size={14} className={mission.farmerName ? 'text-green-600' : 'text-gray-300'} /> 
            Farmer information {mission.farmerName ? 'available' : 'missing'}
          </li>
          <li className="flex items-center gap-2">
            <CheckSquare size={14} className={hasCoords || hasLocation ? 'text-green-600' : 'text-gray-300'} /> 
            Field location {hasCoords || hasLocation ? 'available' : 'missing'}
          </li>
          <li className="flex items-center gap-2">
            <CheckSquare size={14} className={googleMapsUrl ? 'text-green-600' : 'text-gray-300'} /> 
            Navigation {googleMapsUrl ? 'available' : 'unavailable'}
          </li>
          <li className="flex items-center gap-2">
            <CheckSquare size={14} className={mission.visitDate ? 'text-green-600' : 'text-gray-300'} /> 
            Visit date/time {mission.visitDate ? 'scheduled' : 'not scheduled'}
          </li>
          <li className="flex items-center gap-2">
            <CheckSquare size={14} className={farmerAvailabilities[mission.id] && farmerAvailabilities[mission.id] !== 'Not Contacted' ? 'text-green-600' : 'text-gray-300'} /> 
            Farmer availability {farmerAvailabilities[mission.id] ? `(${farmerAvailabilities[mission.id]})` : '(Not recorded)'}
          </li>
        </ul>
      </Card>

      {/* ── Navigate to Field ─────────────────────────────────────── */}
      <div className="border border-gov-border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-gov-textSec uppercase tracking-wide">Field Location</p>
            <p className="text-sm font-semibold text-gov-navy mt-0.5 flex items-center gap-1">
              <MapPin size={13} className="shrink-0" /> {mission.location}
            </p>
            {mission.fieldName && (
              <p className="text-xs text-gov-textSec mt-0.5">{mission.fieldName}</p>
            )}
            {hasCoords && (
              <p className="text-xs text-gov-textSec mt-0.5">
                {mission.coords[0].toFixed(4)}° N, {mission.coords[1].toFixed(4)}° E
              </p>
            )}
          </div>
        </div>
        {googleMapsUrl ? (
          <button
            onClick={handleNavigate}
            className="w-full flex items-center justify-center gap-2 border border-gov-blue text-gov-blue hover:bg-gov-blue hover:text-white font-bold text-sm py-2.5 rounded-lg transition-colors"
          >
            <Navigation size={15} />
            Navigate to Field
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-400 text-sm py-2.5 rounded-lg cursor-not-allowed bg-gray-50">
            <Navigation size={15} />
            Navigation location unavailable for this case.
          </div>
        )}
        {hasCoords && (
          <p className="text-[11px] text-gov-textSec mt-2 text-center">Opens Google Maps in a new tab</p>
        )}
      </div>

      <div className="sticky bottom-16 lg:bottom-0 lg:static pt-2">
        {mission.status === MISSION_STATUS.COMPLETED || mission.status === MISSION_STATUS.UNDER_REVIEW || mission.status === MISSION_STATUS.VERIFIED ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-lg py-3 text-center">
            This mission has already been submitted.
          </div>
        ) : !withinRadius && !inProgress ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 text-center">
            <p className="text-sm font-bold text-red-700 flex items-center justify-center gap-1.5">
              <AlertTriangle size={15} /> Outside operating radius
            </p>
            <p className="text-xs text-red-700 mt-1">
              This field is outside your assigned operating radius. It is {mission.distanceKm} km away; the limit is {STUDENT_OPERATING_RADIUS_KM} km.
            </p>
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
