import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Network, Maximize2, ZoomIn, MousePointer, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GraphPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Knowledge Graph</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Visualize and explore your knowledge graph in an interactive 2D canvas.
        </p>
      </div>

      {/* Graph Visualization Placeholder */}
      <Card className="min-h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Decorative floating nodes */}
        <div className="absolute top-[20%] left-[15%] w-3 h-3 rounded-full bg-blue-500/30 animate-float" />
        <div className="absolute top-[40%] right-[20%] w-4 h-4 rounded-full bg-purple-500/20 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[30%] left-[25%] w-2.5 h-2.5 rounded-full bg-cyan-500/25 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[60%] right-[35%] w-2 h-2 rounded-full bg-emerald-500/20 animate-float" style={{ animationDelay: '0.5s' }} />

        {/* Decorative connection lines */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <line x1="15%" y1="20%" x2="80%" y2="40%" stroke="hsl(var(--primary))" strokeWidth="1" />
          <line x1="25%" y1="70%" x2="60%" y2="35%" stroke="hsl(var(--primary))" strokeWidth="1" />
          <line x1="80%" y1="40%" x2="35%" y2="60%" stroke="hsl(var(--primary))" strokeWidth="1" />
        </svg>

        <CardContent className="flex flex-col items-center text-center space-y-6 relative z-10 py-16">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-primary/10 animate-pulse-glow">
            <Network className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-2 max-w-md">
            <h2 className="text-xl font-bold">Graph Visualization</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Interactive force-directed graph canvas coming soon. Explore nodes, relationships, and patterns in your knowledge data.
            </p>
          </div>

          {/* Capability badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { icon: MousePointer, text: 'Click to Expand' },
              { icon: ZoomIn, text: 'Zoom & Pan' },
              { icon: Layers, text: 'Type Filtering' },
              { icon: Maximize2, text: 'Fullscreen' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30 text-xs text-muted-foreground">
                <item.icon className="w-3.5 h-3.5" />
                {item.text}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
