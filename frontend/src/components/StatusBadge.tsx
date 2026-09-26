import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const s = (status || '').toUpperCase().trim();

  // Consistent status vocabulary mapping
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (['VERIFIED', 'CURRENT', 'PASSED', 'COMPLETED', 'ACCEPTED', 'VALID', 'AUTHENTIC'].includes(s)) {
    // Green
    badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (['SUBMITTED', 'SCHEDULED', 'ASSIGNED', 'IN_FIELD_VERIFICATION', 'IN_PROGRESS', 'DRAFT', 'REGISTERED', 'PENDING'].includes(s)) {
    // Blue
    badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';
    dotColor = 'bg-blue-500';
  } else if (['UNDER_REVIEW', 'UNDER REVIEW', 'EXPIRING', 'NEEDS_REVIEW', 'RESULT_SUBMITTED'].includes(s)) {
    // Amber
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (['FAILED', 'REJECTED', 'EXPIRED', 'INVALID', 'NOT_FOUND', 'NON_COMPLIANT'].includes(s)) {
    // Red
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (['REVOKED', 'CANCELLED'].includes(s)) {
    // Dark / neutral
    badgeStyle = 'bg-slate-800 text-slate-100 border-slate-700';
    dotColor = 'bg-slate-400';
  } else if (['NEEDS_CORRECTION', 'RE_VERIFICATION_REQUIRED'].includes(s)) {
    // Controlled Purple
    badgeStyle = 'bg-purple-50 text-purple-800 border-purple-200';
    dotColor = 'bg-purple-500';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-medium',
    lg: 'text-xs px-3 py-1 font-medium',
  }[size];

  const label = s.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border ${badgeStyle} ${sizeClasses} whitespace-nowrap tracking-wide`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`} />
      <span>{label}</span>
    </span>
  );
};
