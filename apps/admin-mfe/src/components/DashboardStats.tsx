/**
 * Dashboard Statistics Component
 * Displays key metrics and stats for the admin dashboard
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@mfe/shared-design-system';

export interface DashboardStat {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

export interface DashboardStatsProps {
  stats: DashboardStat[];
  isLoading?: boolean;
}

/**
 * DashboardStats Component
 * Displays a grid of statistical cards
 */
export function DashboardStats({
  stats,
  isLoading = false,
}: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-slate-900">
                {stat.value}
              </div>
              {stat.icon && <div className="text-slate-400">{stat.icon}</div>}
            </div>
            {stat.trend && (
              <div
                className={`text-sm mt-1 ${
                  stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.trend.isPositive ? '↑' : '↓'} {Math.abs(stat.trend.value)}
                %<span className="text-slate-500 ml-1">vs last month</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
