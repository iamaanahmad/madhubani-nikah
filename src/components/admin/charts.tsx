'use client';

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const userGrowthData = [
  { month: 'January', users: 186 },
  { month: 'February', users: 305 },
  { month: 'March', users: 237 },
  { month: 'April', users: 73 },
  { month: 'May', users: 209 },
  { month: 'June', users: 214 },
];

const userGrowthChartConfig = {
  users: {
    label: 'Users',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function UserGrowthChart() {
  return (
    <ChartContainer config={userGrowthChartConfig} className="h-[150px] w-full">
      <LineChart
        accessibilityLayer
        data={userGrowthData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Line
          dataKey="users"
          type="natural"
          stroke="var(--color-users)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

const userDistributionData = [
  { location: 'Benipatti', users: 275 },
  { location: 'Rajnagar', users: 200 },
  { location: 'Madhubani', users: 187 },
  { location: 'Jhanjharpur', users: 173 },
  { location: 'Pandaul', users: 90 },
];

const userDistributionChartConfig = {
  users: {
    label: 'Users',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function UserDistributionChart() {
  return (
    <ChartContainer
      config={userDistributionChartConfig}
      className="h-[200px] w-full"
    >
      <BarChart accessibilityLayer data={userDistributionData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="location"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="users" fill="var(--color-users)" radius={8} />
      </BarChart>
    </ChartContainer>
  );
}
