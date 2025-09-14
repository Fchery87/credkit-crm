"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface ChartProps {
  data: any[];
  type: "area" | "bar" | "line" | "pie";
  title?: string;
  description?: string;
  height?: number;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  dataKey?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  emptyMessage?: string;
}

const defaultColors = [
  "hsl(220, 91%, 54%)",  // Primary blue
  "hsl(174, 72%, 56%)",  // Secondary teal
  "hsl(262, 83%, 58%)",  // Accent purple
  "hsl(142, 76%, 36%)",  // Success green
  "hsl(38, 92%, 50%)",   // Warning orange
  "hsl(0, 84%, 60%)",    // Error red
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded-xl p-4 shadow-soft-lg"
      >
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">
              {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
            </span>
          </div>
        ))}
      </motion.div>
    );
  }
  return null;
};

const EmptyState = ({ message }: { message: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center justify-center h-full min-h-[200px] text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
    <p className="text-sm text-muted-foreground">{message}</p>
  </motion.div>
);

export const ModernChart: React.FC<ChartProps> = ({
  data,
  type,
  title,
  description,
  height = 300,
  colors = defaultColors,
  showGrid = true,
  showLegend = false,
  dataKey = "value",
  xAxisKey = "name",
  yAxisKey,
  emptyMessage = "No data available"
}) => {
  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const chartProps = {
    data,
    margin: { top: 20, right: 30, left: 20, bottom: 20 }
  };

  const renderChart = () => {
    switch (type) {
      case "area":
        return (
          <AreaChart {...chartProps}>
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
              />
            )}
            <XAxis 
              dataKey={xAxisKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.1}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...chartProps}>
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
              />
            )}
            <XAxis 
              dataKey={xAxisKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Bar
              dataKey={dataKey}
              fill={colors[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case "line":
        return (
          <LineChart {...chartProps}>
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
              />
            )}
            <XAxis 
              dataKey={xAxisKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
            />
          </LineChart>
        );

      case "pie":
        return (
          <PieChart {...chartProps}>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend 
                wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
              />
            )}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill={colors[0]}
              dataKey={dataKey}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        );

      default:
        return <EmptyState message="Unsupported chart type" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="h3 text-foreground mb-2">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};