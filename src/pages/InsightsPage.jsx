import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Sparkles, TrendingUp, Lightbulb, Brain } from 'lucide-react';

export default function InsightsPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">AI Insights</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          AI-generated discoveries and patterns from your knowledge graph.
        </p>
      </div>

      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center space-y-4 py-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto animate-pulse-glow">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Insights Coming Soon</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Automated discovery of patterns, blind spots, and recommendations powered by graph algorithms and LLMs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
