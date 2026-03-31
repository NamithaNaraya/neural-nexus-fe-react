import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Network, Eye, EyeOff, ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';

export default function LoginPage() {
  const { login, register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = isRegister
      ? await register(email, password)
      : await login(email, password);
    if (success) navigate('/');
  };

  const features = [
    { icon: Sparkles, title: 'AI-Powered RAG', desc: 'Intelligent knowledge retrieval with graph-aware AI' },
    { icon: Zap, title: 'Real-time Analytics', desc: 'Graph algorithms at your fingertips — PageRank, communities & more' },
    { icon: Shield, title: 'Enterprise Ready', desc: 'Neo4j, Redis, PostgreSQL — built for scale' },
  ];

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left Panel — Branding & Features */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-emerald-700/8 blur-[120px] animate-float" />
          <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full bg-amber-700/8 blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full bg-stone-700/6 blur-[80px] animate-float" style={{ animationDelay: '3s' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Top — Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-700/20">
            <Network className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">Neural Nexus</h1>
            <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase">Knowledge Graph Platform</p>
          </div>
        </div>

        {/* Center — Hero */}
        <div className="space-y-8 max-w-lg">
          <div className="space-y-4">
            <h2 className="text-5xl font-extrabold leading-tight tracking-tight">
              <span className="text-foreground">Explore your </span>
              <span className="text-emerald-700 dark:text-emerald-300">knowledge</span>
              <span className="text-foreground"> like never before</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Transform unstructured data into actionable intelligence with AI-powered knowledge graphs and graph analytics.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-4">
            {features.map((feat, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-xl bg-card/30 backdrop-blur-sm border border-border/30 hover:bg-card/50 hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <feat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Footer */}
        <p className="text-xs text-muted-foreground/50">
          Neural Nexus Platform v2.0 · Built with React & FastAPI
        </p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-700/20">
              <Network className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-emerald-700 dark:text-emerald-300">Neural Nexus</h1>
          </div>

          {/* Form card */}
          <div className="space-y-6 p-8 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl shadow-black/20">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                {isRegister ? 'Create an account' : 'Welcome back'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRegister
                  ? 'Enter your email to create your account'
                  : 'Sign in to your Neural Nexus workspace'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  required
                  autoFocus
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                    required
                    minLength={4}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-red-400 animate-fade-up">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                className="w-full h-11 text-base font-semibold gap-2"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegister ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card/40 backdrop-blur-xl px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <button
              onClick={() => { setIsRegister(!isRegister); clearError(); }}
              className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"
              }
            </button>
          </div>

          {/* Extra text */}
          <p className="text-center text-xs text-muted-foreground/40">
            By continuing, you agree to Neural Nexus Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
