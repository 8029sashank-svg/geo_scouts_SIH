import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

/**
 * Geo-Farm — Badge UI Primitive
 * Updated for Gov of Maharashtra light theme.
 */

const RISK_STYLES = {
  LOW: 'bg-green-100 text-green-800 border-green-300',
  MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  SEVERE: 'bg-red-100 text-red-800 border-red-300',
  CRITICAL: 'bg-red-700 text-white border-red-900',
};

const RISK_LABEL_KEY = {
  LOW: 'riskLow',
  MODERATE: 'riskModerate',
  HIGH: 'riskHigh',
  SEVERE: 'riskSevere',
  CRITICAL: 'riskCritical',
};

const STATUS_STYLES = {
  FLAGGED: 'bg-orange-100 text-orange-800 border-orange-300',
  PENDING: 'bg-orange-100 text-orange-800 border-orange-300',
  VERIFIED: 'bg-blue-100 text-blue-800 border-blue-300',
  REJECTED: 'bg-gray-100 text-gray-800 border-gray-300',
  DISPATCHED: 'bg-green-100 text-green-800 border-green-300',
};

const STATUS_LABEL_KEY = {
  FLAGGED: 'statusFlagged',
  PENDING: 'statusPending',
  VERIFIED: 'statusVerified',
  REJECTED: 'reject',
  DISPATCHED: 'statusDispatched',
};

export function RiskBadge({ level = 'LOW', size = 'md', pulse = false, className = '' }) {
  const { t } = useLanguage();
  const style = RISK_STYLES[level] ?? RISK_STYLES.LOW;
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-semibold uppercase tracking-wide ${style} ${sizeClass} ${className}`}
    >
      {pulse && (level === 'SEVERE' || level === 'CRITICAL') && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {t(RISK_LABEL_KEY[level] ?? 'riskLow')}
    </span>
  );
}

export function StatusBadge({ status = 'PENDING', size = 'md', className = '' }) {
  const { t } = useLanguage();
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-semibold uppercase tracking-wide ${style} ${sizeClass} ${className}`}
    >
      {t(STATUS_LABEL_KEY[status] ?? 'statusPending')}
    </span>
  );
}

export function Badge({ children, color = 'slate', size = 'md', className = '' }) {
  const colorMap = {
    slate: 'bg-gray-100 text-gray-800 border-gray-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    amber: 'bg-orange-100 text-orange-800 border-orange-300',
  };
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium ${
        colorMap[color] ?? colorMap.slate
      } ${sizeClass} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
