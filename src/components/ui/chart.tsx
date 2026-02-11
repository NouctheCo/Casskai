import * as React from "react";
import {
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  LineChart,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext"; // ✅ ajout du hook

interface ChartProps {
  type: "bar" | "line" | "area" | "pie";
  data: Record<string, any>[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  height?: number;
  className?: string;
  stack?: boolean;
}

export function Chart({
  type,
  data = [],
  index,
  categories = [],
  colors = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
  valueFormatter = (value: number) => value.toString(),
  height = 400,
  className,
  stack = false,
}: ChartProps) {
  const { t } = useLocale(); // ✅ nécessaire pour utiliser t()

  const getHslColor = (colorName: string) => {
    const colorVar = getComputedStyle(document.documentElement).getPropertyValue(`--${colorName}`).trim();
    return colorVar ? `hsl(${colorVar})` : "#8884d8";
  };

  const chartColors = colors.map(getHslColor);

  if (!Array.isArray(data) || !Array.isArray(categories) || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center w-full h-full", className)}>
        <p className="text-sm text-muted-foreground">
          {t('chart.aucune_donne_afficher', { defaultValue: 'Aucune donnée à afficher.' })}
        </p>
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={index} />
            <YAxis tickFormatter={valueFormatter} />
            <Tooltip formatter={valueFormatter} />
            <Legend />
            {categories.map((category, i) => (
              <Bar
                key={category}
                dataKey={category}
                fill={chartColors[i % chartColors.length]}
                stackId={stack ? "stack" : undefined}
              />
            ))}
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={index} />
            <YAxis tickFormatter={valueFormatter} />
            <Tooltip formatter={valueFormatter} />
            <Legend />
            {categories.map((category, i) => (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={chartColors[i % chartColors.length]}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={index} />
            <YAxis tickFormatter={valueFormatter} />
            <Tooltip formatter={valueFormatter} />
            <Legend />
            {categories.map((category, i) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stroke={chartColors[i % chartColors.length]}
                fill={chartColors[i % chartColors.length]}
                fillOpacity={0.3}
                stackId={stack ? "stack" : undefined}
              />
            ))}
          </AreaChart>
        );
      case "pie": {
        const pieData = categories.map((category) => ({
          name: category,
          value: data.reduce((sum, item) => sum + (typeof item?.[category] === "number" ? item[category] : 0), 0),
        }));

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={valueFormatter} />
            <Legend />
          </PieChart>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className={cn("w-full h-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart() ?? <></>}
      </ResponsiveContainer>
    </div>
  );
}
