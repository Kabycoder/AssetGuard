import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { StatusDistributionItem } from '../../types';

interface StatusDonutChartProps {
  data: StatusDistributionItem[];
  totalCount: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: StatusDistributionItem;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-800">
        <p className="font-semibold">{item.name}</p>
        <p className="text-slate-300">
          {item.value.toLocaleString()} assets ({item.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  data,
  totalCount,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-800">Asset Status Overview</h2>
        <span className="text-xs text-slate-400 font-medium">{totalCount} Processed</span>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Donut Chart */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-900 leading-tight">
              {totalCount}
            </span>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {item.value.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 w-12 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
