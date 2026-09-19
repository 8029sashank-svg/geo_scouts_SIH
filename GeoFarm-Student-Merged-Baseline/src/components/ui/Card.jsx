import React from 'react';

/**
 * Geo-Farm — Card UI Primitive
 * Updated for Gov of Maharashtra light theme.
 */

export function Card({ children, className = '', padded = true, ...rest }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded shadow-sm ${padded ? 'p-4 sm:p-5' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ icon: Icon, title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start gap-3 mb-4 ${className}`}>
      {Icon && (
        <div className="w-9 h-9 rounded bg-gov-bg border border-gov-border flex items-center justify-center shrink-0">
          <Icon size={18} className="text-gov-blue" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-gov-navy truncate">{title}</h3>
        {subtitle && <p className="text-xs text-gov-textSec mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardStat({ label, value, unit, trend, className = '' }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-[11px] uppercase tracking-wide text-gov-textSec font-bold">
        {label}
      </span>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-2xl font-bold text-gov-navy tabular-nums">{value}</span>
        {unit && <span className="text-xs text-gov-textSec font-medium">{unit}</span>}
      </div>
      {trend !== undefined && trend !== null && (
        <span
          className={`text-[11px] font-bold mt-0.5 ${
            trend > 0 ? 'text-red-600' : trend < 0 ? 'text-green-700' : 'text-gray-500'
          }`}
        >
          {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {Math.abs(trend).toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default Card;
