import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Upload, Network, MessageSquare, BarChart3, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

const actions = [
  { label: 'Upload Data', icon: Upload, path: '/upload', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'View Graph', icon: Network, path: '/graph', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: 'AI Chat', icon: MessageSquare, path: '/chat', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics', color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="hover:border-primary/10 transition-all duration-500 ease-out">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="w-4 h-4 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-muted/20 border border-border/30 hover:bg-muted/40 hover:border-primary/20 transition-all duration-300 ease-out group active:scale-[0.97]"
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-110',
                action.bg
              )}>
                <action.icon className={cn('w-5 h-5', action.color)} />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
