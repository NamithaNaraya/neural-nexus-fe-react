import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { Input, Label } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../../services/authService';

function PasswordField({ label, value, onChange, minLength, hint }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        {hint ? <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">{hint}</span> : null}
      </div>
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          minLength={minLength}
          className="h-11 rounded-xl pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    if (newPassword !== confirmPassword) {
      setStatus('New password and confirm password must match.');
      return;
    }

    setSaving(true);
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      setStatus(response?.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setStatus(error.response?.data?.detail || 'Password change failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/82 p-4 shadow-[0_18px_46px_-36px_rgba(15,23,42,0.3)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <KeyRound className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600/80 dark:text-amber-400/80">Password</p>
          <h2 className="text-lg font-semibold">Change password</h2>
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.06] to-background/90 px-4 py-3">
        <p className="text-xs font-medium text-foreground">Use a fresh password you do not reuse elsewhere.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-[22px] border border-border/50 bg-background/72 p-4">
        <PasswordField
          label="Current password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
        <PasswordField
          label="New password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={3}
          hint="Min. 3 chars"
        />
        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={3}
        />
        <Button type="submit" variant="gradient" className="mt-2 h-11 w-full gap-2 rounded-xl" disabled={saving || !currentPassword || !newPassword || !confirmPassword}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Update password
        </Button>
      </form>

      {status && (
        <div className="mt-4 rounded-2xl border border-border/50 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {status}
        </div>
      )}
    </section>
  );
}
