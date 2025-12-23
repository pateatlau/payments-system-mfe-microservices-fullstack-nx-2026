/**
 * Recent Activity Component
 * Displays recent system activity and events
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@mfe/shared-design-system';

export interface ActivityItem {
  id: string;
  type: 'user' | 'payment' | 'system';
  action: string;
  user?: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error';
}

export interface RecentActivityProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  maxItems?: number;
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get badge variant based on activity type
 */
function getActivityBadgeVariant(
  type: ActivityItem['type']
): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'user':
      return 'default';
    case 'payment':
      return 'secondary';
    case 'system':
      return 'outline';
    default:
      return 'default';
  }
}

/**
 * RecentActivity Component
 * Displays a list of recent activities
 */
export function RecentActivity({
  activities,
  isLoading = false,
  maxItems = 10,
}: RecentActivityProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No recent activity to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.map(activity => (
            <div
              key={activity.id}
              className="flex items-start gap-3 pb-4 last:pb-0 border-b last:border-0"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                {activity.type === 'user' && '👤'}
                {activity.type === 'payment' && '💳'}
                {activity.type === 'system' && '⚙️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-foreground">{activity.action}</p>
                  <Badge variant={getActivityBadgeVariant(activity.type)}>
                    {activity.type}
                  </Badge>
                  {activity.status && (
                    <Badge
                      variant={
                        activity.status === 'success'
                          ? 'default'
                          : activity.status === 'warning'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {activity.status}
                    </Badge>
                  )}
                </div>
                {activity.user && (
                  <p className="text-xs text-muted-foreground mt-1">
                    by {activity.user}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
