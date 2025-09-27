"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";

interface DataPoint {
  [key: string]: number | string;
}

interface ChartAction {
  label: string;
  onClick: () => void;
}

interface DashboardChartProps {
  type: "line" | "bar";
  data: DataPoint[];
  primaryKey: string;
  xKey: string;
  color: string;
  title: string;
  description?: string;
  onPointNavigate?: (payload: DataPoint) => void;
  menuActions: ChartAction[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {item.name}: <span className="font-semibold text-foreground">{item.value}</span>
      </p>
    </div>
  );
};

export function DashboardChart({
  type,
  data,
  primaryKey,
  xKey,
  color,
  title,
  description,
  onPointNavigate,
  menuActions,
}: DashboardChartProps) {
  const router = useRouter();
  const actions = useMemo(
    () =>
      menuActions.map((action) => ({
        ...action,
        onClick: () => {
          action.onClick();
        },
      })),
    [menuActions]
  );

  const handleClick = (payload: any) => {
    if (!onPointNavigate || !payload?.activePayload?.length) return;
    const datum = payload.activePayload[0].payload as DataPoint;
    onPointNavigate(datum);
  };

  return (
    <div className="card-modern p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="h4 text-foreground">{title}</h3>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === "line" ? (
            <LineChart
              data={data}
              onClick={handleClick}
              margin={{ top: 8, right: 20, left: 4, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={primaryKey}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: color }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={data}
              onClick={handleClick}
              margin={{ top: 8, right: 20, left: 4, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={primaryKey} fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}