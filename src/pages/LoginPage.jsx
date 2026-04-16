import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Network,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  BrainCircuit,
  Orbit,
} from 'lucide-react';
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
    if (success) navigate('/folders');
  };

  const features = [
    { icon: Sparkles, title: 'AI-powered RAG', desc: 'Grounded answers across folders, graph context, and saved history.' },
    { icon: Zap, title: 'Live analytics', desc: 'Move from ingestion to graph algorithms and insight flows without friction.' },
    { icon: Shield, title: 'Enterprise-ready', desc: 'Built for structured workspaces, team usage, and connected knowledge systems.' },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8%] top-[-6%] h-[26rem] w-[26rem] rounded-full bg-primary/16 blur-3xl" />
          <div className="absolute right-[-6%] top-[10%] h-[22rem] w-[22rem] rounded-full bg-accent/16 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[35%] h-[20rem] w-[20rem] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="mx-auto grid min-h-screen w-full max-w-[1380px] items-center gap-10 px-6 py-8 lg:grid-cols-[1.04fr_0.96fr] lg:px-10">
          <div className="hidden lg:flex lg:flex-col lg:justify-between">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-card/85 shadow-[0_16px_40px_-28px_hsl(var(--primary)/0.35)] backdrop-blur-xl">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">NESSO Botanica</h1>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Knowledge intelligence</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-card/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary backdrop-blur-xl">
                  <Orbit className="h-3.5 w-3.5" />
                  Calm neural workspace
                </div>
                <h2 className="max-w-2xl text-5xl font-bold leading-[1.04] tracking-[-0.04em] text-foreground">
                  Sign in to your connected graph, chat, and analytics workspace.
                </h2>
                <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                  A softer, modern interface for structured knowledge work with graph-aware AI, ingestion pipelines, and smooth workspace navigation.
                </p>
              </div>

              <div className="grid gap-4">
                {features.map((feat, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-[1.5rem] border border-border/60 bg-card/72 p-5 shadow-[0_24px_70px_-48px_hsl(var(--primary)/0.22)] backdrop-blur-xl"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <feat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{feat.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-12 text-xs text-muted-foreground/60">
              NESSO Platform v2.0 · Natural and essential oil intelligence
            </p>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md space-y-8">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-card/85 backdrop-blur-xl">
                  <Network className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">NESSO Botanica</h1>
              </div>

              <section aria-labelledby="login-title" className="space-y-6 rounded-[2rem] border border-border/60 bg-card/78 p-8 shadow-[0_30px_100px_-56px_hsl(var(--primary)/0.32)] backdrop-blur-2xl">
                <div className="space-y-2 text-center">
                  <h2 id="login-title" className="text-2xl font-bold tracking-tight">
                    {isRegister ? 'Create an account' : 'Welcome back'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isRegister
                      ? 'Enter your email to create your account'
                      : 'Sign in to your Neural Nexus workspace'}
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
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError();
                      }}
                      required
                      autoFocus
                      autoComplete="email"
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
                        onChange={(e) => {
                          setPassword(e.target.value);
                          clearError();
                        }}
                        required
                        minLength={3}
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div role="alert" aria-live="polite" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-red-500 animate-fade-up">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full h-11 gap-2 text-base font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="h-5 w-5 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
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
                    <span className="bg-card/40 px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    clearError();
                  }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isRegister
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Create one"}
                </button>
              </section>

              <p className="text-center text-xs text-muted-foreground/50">
                By continuing, you agree to Neural Nexus Terms of Service
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
