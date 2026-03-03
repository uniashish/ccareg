import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FiX } from "react-icons/fi";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const breakdown = data.breakdown || [];

    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 shadow-lg max-w-sm">
        <p className="font-bold text-sm mb-2">{data.name}</p>
        {breakdown.length > 0 ? (
          <div className="text-xs space-y-1 border-t border-slate-600 pt-2">
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between gap-2">
                <span className="text-slate-300">{item.ccaName}</span>
                <span className="text-emerald-400 font-semibold">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="text-sm text-emerald-400 font-semibold mt-2 border-t border-slate-600 pt-2">
          Total: {data.value}
        </div>
      </div>
    );
  }
  return null;
};

export default function SelectionChart({ isOpen, onClose, selections }) {
  // Group CCAs by their base name (e.g., "Badminton" groups all badminton variants)
  const chartData = useMemo(() => {
    if (!Array.isArray(selections) || selections.length === 0) {
      return [];
    }

    const groupedData = {};

    selections.forEach((selection) => {
      const selectedCCAs = Array.isArray(selection.selectedCCAs)
        ? selection.selectedCCAs
        : [];

      selectedCCAs.forEach((cca) => {
        const ccaName = cca?.name || "Unknown";
        // Extract base name (first word or everything before parentheses)
        const baseName = ccaName.split("(")[0].trim();

        if (baseName) {
          if (!groupedData[baseName]) {
            groupedData[baseName] = {
              count: 0,
              breakdown: {},
            };
          }
          groupedData[baseName].count += 1;
          groupedData[baseName].breakdown[ccaName] =
            (groupedData[baseName].breakdown[ccaName] || 0) + 1;
        }
      });
    });

    // Convert to chart format with breakdown info and sort by count descending
    return Object.entries(groupedData)
      .map(([name, data]) => ({
        name,
        value: data.count,
        breakdown: Object.entries(data.breakdown)
          .map(([ccaName, count]) => ({
            ccaName,
            count,
          }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.value - a.value);
  }, [selections]);

  // Custom color palette for pie chart
  const COLORS = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // emerald
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#6366f1", // indigo
    "#14b8a6", // teal
    "#f97316", // orange
    "#64748b", // slate
    "#84cc16", // lime
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-800">
              CCA Selection Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {chartData.length} CCA{chartData.length !== 1 ? "s" : ""} |{" "}
              {chartData.reduce((sum, item) => sum + item.value, 0)} total
              selection
              {chartData.reduce((sum, item) => sum + item.value, 0) !== 1
                ? "s"
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-colors shrink-0"
            title="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {chartData.length > 0 ? (
            <div className="flex flex-col items-center gap-8">
              {/* PIE CHART */}
              <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value }) => `${name} (${value})`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      fontSize={11}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* DATA TABLE */}
              <div className="w-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 font-bold text-slate-700">
                        CCA Name
                      </th>
                      <th className="text-center px-4 py-3 font-bold text-slate-700">
                        Selections
                      </th>
                      <th className="text-center px-4 py-3 font-bold text-slate-700">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((item, index) => {
                      const total = chartData.reduce(
                        (sum, i) => sum + i.value,
                        0,
                      );
                      const percentage = ((item.value / total) * 100).toFixed(
                        1,
                      );
                      return (
                        <tr
                          key={`row-${index}`}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-700 font-medium">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    COLORS[index % COLORS.length],
                                }}
                              />
                              {item.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 font-semibold">
                            {item.value}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 font-semibold">
                            {percentage}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-slate-400 text-center">
              <div>
                <p className="text-lg font-semibold">No selections yet</p>
                <p className="text-sm">Students haven't selected any CCAs</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
