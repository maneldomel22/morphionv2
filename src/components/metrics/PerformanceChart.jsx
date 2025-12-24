import { useState } from 'react';

export default function PerformanceChart({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const maxLeads = Math.max(...data.map(d => d.leads));
  const maxPaid = Math.max(...data.map(d => d.paid));
  const maxValue = Math.max(maxLeads, maxPaid);

  const chartHeight = 200;
  const chartWidth = 100;
  const padding = 20;

  const getY = (value) => {
    return chartHeight - padding - ((value / maxValue) * (chartHeight - padding * 2));
  };

  const getX = (index) => {
    return padding + (index * (chartWidth - padding * 2) / (data.length - 1));
  };

  const leadsPath = data.map((d, i) => {
    const x = getX(i);
    const y = getY(d.leads);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  const paidPath = data.map((d, i) => {
    const x = getX(i);
    const y = getY(d.paid);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-textSecondary">Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-textSecondary">Pagamentos</span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto"
          style={{ maxHeight: '200px' }}
        >
          <defs>
            <linearGradient id="leadsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(74, 222, 128)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(74, 222, 128)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="paidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(77, 163, 255)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(77, 163, 255)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d={`${leadsPath} L ${getX(data.length - 1)} ${chartHeight - padding} L ${getX(0)} ${chartHeight - padding} Z`}
            fill="url(#leadsGradient)"
          />
          <path
            d={leadsPath}
            fill="none"
            stroke="rgb(74, 222, 128)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={`${paidPath} L ${getX(data.length - 1)} ${chartHeight - padding} L ${getX(0)} ${chartHeight - padding} Z`}
            fill="url(#paidGradient)"
          />
          <path
            d={paidPath}
            fill="none"
            stroke="rgb(77, 163, 255)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((d, i) => (
            <g key={i}>
              <circle
                cx={getX(i)}
                cy={getY(d.leads)}
                r={hoveredIndex === i ? 5 : 3}
                fill="rgb(74, 222, 128)"
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              <circle
                cx={getX(i)}
                cy={getY(d.paid)}
                r={hoveredIndex === i ? 5 : 3}
                fill="rgb(77, 163, 255)"
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}

          {data.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y={chartHeight - 5}
              textAnchor="middle"
              fontSize="10"
              fill="rgba(181, 181, 192, 0.7)"
            >
              D{i + 1}
            </text>
          ))}
        </svg>

        {hoveredIndex !== null && (
          <div className="absolute top-0 left-0 bg-black/90 text-white text-xs rounded-lg p-2 pointer-events-none backdrop-blur-sm border border-white/10"
            style={{
              transform: `translate(${getX(hoveredIndex) * (100 / chartWidth)}%, -100%)`,
              marginTop: '-8px'
            }}
          >
            <div className="font-semibold mb-1">{data[hoveredIndex].day}</div>
            <div className="text-green-500">Leads: {data[hoveredIndex].leads}</div>
            <div className="text-blue-500">Pagos: {data[hoveredIndex].paid}</div>
          </div>
        )}
      </div>
    </div>
  );
}
