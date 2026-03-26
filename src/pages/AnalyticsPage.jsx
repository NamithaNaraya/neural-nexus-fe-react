import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { BarChart3, Network, Sparkles, TrendingUp, Target, GitBranch } from 'lucide-react';

export default function AnalyticsPage() {
  const algorithms = [
    { name: 'PageRank', desc: 'Find influential nodes', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Community Detection', desc: 'Discover clusters', icon: Network, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { name: 'Betweenness', desc: 'Find bridge nodes', icon: GitBranch, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'Similarity', desc: 'Find related entities', icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { name: 'Link Prediction', desc: 'Predict connections', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { name: 'K-Core', desc: 'Graph decomposition', icon: BarChart3, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Run graph algorithms powered by Neo4j GDS to discover patterns and insights.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {algorithms.map((algo, i) => (
          <Card
            key={i}
            className="hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group"
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl ${algo.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <algo.icon className={`w-5 h-5 ${algo.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{algo.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{algo.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
