import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { HelpCircle, BookOpen, ExternalLink, MessageSquare, Github } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function HelpPage() {
  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Help & Support</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Get started and learn more about Neural Nexus Platform.
        </p>
      </div>

      <div className="grid gap-4">
        {[
          { icon: BookOpen, title: 'Documentation', desc: 'Read the full platform guide', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: MessageSquare, title: 'AI Chat Help', desc: 'Learn how to use the RAG pipeline', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: HelpCircle, title: 'FAQs', desc: 'Frequently asked questions', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((item, i) => (
          <Card key={i} className="hover:border-primary/20 transition-all duration-300 cursor-pointer group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Neural Nexus Platform v2.0</p>
          <p className="text-xs text-muted-foreground/50">React + Tailwind + FastAPI + Neo4j + Redis</p>
        </CardContent>
      </Card>
    </div>
  );
}
