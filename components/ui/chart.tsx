"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type LineChartSeries = {
  key: string;
  color: string;
  name: string;
};

export function QuantLineChart({
  data,
  series,
  xKey,
}: {
  data: Record<string, number | string>[];
  series: LineChartSeries[];
  xKey: string;
}) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey={xKey} hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              border: "1px solid rgba(148,163,184,0.2)",
              background: "rgba(2,6,23,0.9)",
              borderRadius: 8,
              color: "#e2e8f0",
            }}
          />
          <Legend />
          {series.map((item) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.name}
              dot={false}
              stroke={item.color}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
