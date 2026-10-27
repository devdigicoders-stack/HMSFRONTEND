import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { IoTrendingUpOutline, IoTrendingDownOutline } from 'react-icons/io5';

/**
 * 1. AreaChartCard - Smooth curved gradient line chart with interactive hover tooltip
 */
export const AreaChartCard = ({
  title = 'Patient Volume & Clinical Trends',
  subtitle = 'Weekly trend analysis',
  data = [12, 19, 15, 27, 22, 34, 30],
  labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  unit = 'Encounters',
  color = '#10B981',
  gradientId = 'greenGradient',
  badgeText = '+16.8% High Activity',
  badgePositive = true,
  className = ''
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const safeData = Array.isArray(data) && data.length > 0 ? data : [0, 0, 0, 0, 0, 0];
  const safeLabels = Array.isArray(labels) && labels.length > 0 ? labels : ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

  const maxVal = Math.max(...safeData, 1);
  const minVal = Math.min(...safeData, 0);
  const range = maxVal - minVal || 1;

  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const numPoints = Math.max(safeData.length, 2);
  const points = safeData.map((val, idx) => {
    const x = paddingX + (idx / (numPoints - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((val - minVal) / range) * (height - paddingY * 2);
    return { x, y, val, label: safeLabels[idx] || `P${idx + 1}` };
  });

  // Generate smooth SVG bezier path
  const pathD = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    const cp2y = point.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <GlassCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-sm text-slate-800 tracking-tight">{title}</div>
          <div className="text-xs text-slate-500 font-normal">{subtitle}</div>
        </div>
        {badgeText && (
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              badgePositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                : 'bg-rose-50 text-rose-700 border border-rose-200/80'
            }`}
          >
            {badgePositive ? <IoTrendingUpOutline size={13} /> : <IoTrendingDownOutline size={13} />}
            <span>{badgeText}</span>
          </div>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
            <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={color} floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#F1F5F9"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="#F1F5F9"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#E2E8F0"
          />

          {/* Area Fill */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.8"
            strokeLinecap="round"
            filter={`url(#glow-${gradientId})`}
          />

          {/* Data Points */}
          {points.map((pt, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === i ? 6 : 4}
                fill="#FFFFFF"
                stroke={color}
                strokeWidth={hoveredIdx === i ? 3 : 2}
                className="transition-all duration-150"
              />
              {/* X Axis Label */}
              <text
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                fontSize="10"
                fontWeight="500"
                fill={hoveredIdx === i ? color : '#94A3B8'}
                className="transition-colors"
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute -top-1 px-2.5 py-1 rounded-md bg-slate-900/95 border border-white/10 text-white text-[11px] font-semibold shadow-xl pointer-events-none transform -translate-x-1/2 transition-all duration-150 flex items-center gap-1.5"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span>{points[hoveredIdx].label}:</span>
            <span className="text-emerald-400 font-bold">{points[hoveredIdx].val} {unit}</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

/**
 * 2. DonutChartCard - Modern radial breakdown with segments and legend
 */
export const DonutChartCard = ({
  title = 'Case Distribution by Status',
  subtitle = 'Clinical operational ratio',
  totalLabel = 'Total Encounters',
  segments = [
    { label: 'Completed', value: 68, color: '#10B981' },
    { label: 'In Progress', value: 22, color: '#0E9FAD' },
    { label: 'Pending', value: 14, color: '#F59E0B' },
    { label: 'Cancelled', value: 6, color: '#F43F5E' }
  ],
  className = ''
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const rawTotal = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
  const total = rawTotal || 1;
  const radius = 42;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <GlassCard className={`p-4 ${className}`}>
      <div className="mb-3">
        <div className="font-semibold text-sm text-slate-800 tracking-tight">{title}</div>
        <div className="text-xs text-slate-500 font-normal">{subtitle}</div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* SVG Circular Ring */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background Base Ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />

            {/* Segments */}
            {segments.map((seg, idx) => {
              const val = Number(seg.value) || 0;
              const percent = rawTotal > 0 ? val / rawTotal : 0;
              const strokeDasharray = `${percent * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativePercent * circumference;
              cumulativePercent += percent;

              return (
                <circle
                  key={idx}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={hoveredIdx === idx ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className="text-xl font-bold text-slate-800 leading-none">
              {hoveredIdx !== null ? segments[hoveredIdx].value : rawTotal}
            </div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5 tracking-wider">
              {hoveredIdx !== null ? segments[hoveredIdx].label : totalLabel}
            </div>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full flex flex-col gap-2">
          {segments.map((seg, idx) => {
            const val = Number(seg.value) || 0;
            const pct = rawTotal > 0 ? Math.round((val / rawTotal) * 100) : 0;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg transition-all cursor-pointer ${
                  hoveredIdx === idx ? 'bg-slate-50 scale-[1.02]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-xs font-medium text-slate-700">{seg.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">{val}</span>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
};

/**
 * 3. BarChartCard - Multi-category vertical rounded bar visualization
 */
export const BarChartCard = ({
  title = 'Weekly Resource & Workload Intake',
  subtitle = 'Operational department throughput',
  bars = [
    { label: 'Cardio', val1: 28, val2: 18 },
    { label: 'Neuro', val1: 19, val2: 14 },
    { label: 'Pedia', val1: 34, val2: 24 },
    { label: 'Lab', val1: 42, val2: 36 },
    { label: 'OPD', val1: 52, val2: 44 }
  ],
  series = [
    { name: 'Scheduled', color: '#10B981' },
    { name: 'Discharged', color: '#0E9FAD' }
  ],
  className = ''
}) => {
  const maxVal = Math.max(...bars.flatMap((b) => [b.val1, b.val2]), 1);

  return (
    <GlassCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold text-sm text-slate-800 tracking-tight">{title}</div>
          <div className="text-xs text-slate-500 font-normal">{subtitle}</div>
        </div>
        <div className="flex items-center gap-3">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[11px] font-medium text-slate-500">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 h-36 pt-4 border-b border-slate-100 px-2">
        {bars.map((bar, i) => {
          const h1 = Math.round((bar.val1 / maxVal) * 100);
          const h2 = Math.round((bar.val2 / maxVal) * 100);

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <div className="flex items-end gap-1.5 h-full w-full justify-center">
                {/* Bar 1 */}
                <div
                  className="w-3 sm:w-4 rounded-t-md transition-all duration-300 group-hover:brightness-110 relative"
                  style={{
                    height: `${h1}%`,
                    backgroundColor: series[0].color
                  }}
                  title={`${series[0].name}: ${bar.val1}`}
                />
                {/* Bar 2 */}
                <div
                  className="w-3 sm:w-4 rounded-t-md transition-all duration-300 group-hover:brightness-110 relative"
                  style={{
                    height: `${h2}%`,
                    backgroundColor: series[1].color
                  }}
                  title={`${series[1].name}: ${bar.val2}`}
                />
              </div>
              <div className="text-[11px] font-medium text-slate-500 group-hover:text-slate-900 transition-colors">
                {bar.label}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

export default {
  AreaChartCard,
  DonutChartCard,
  BarChartCard
};
