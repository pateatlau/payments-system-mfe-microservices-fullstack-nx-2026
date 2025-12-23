/**
 * Quick Actions Component
 * Provides quick access to common admin tasks
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@mfe/shared-design-system';

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface QuickActionsProps {
  actions: QuickAction[];
}

/**
 * QuickActions Component
 * Displays a grid of actionable cards
 */
export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map(action => (
        <Card
          key={action.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={action.disabled ? undefined : action.onClick}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {action.title}
              </CardTitle>
              <span className="text-2xl">{action.icon}</span>
            </div>
            <CardDescription className="text-sm mt-1 min-h-[2.5rem]">
              {action.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={action.disabled}
              onClick={e => {
                e.stopPropagation();
                if (!action.disabled) {
                  action.onClick();
                }
              }}
            >
              {action.disabled ? 'Coming Soon' : 'Open →'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
