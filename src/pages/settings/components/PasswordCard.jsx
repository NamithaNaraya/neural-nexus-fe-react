import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Input, Label } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../../services/authService';

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
    <section className="rounded-[30px] border border-border/60 bg-card/82 p-6 shadow-[0_22px_60px_-36px_rgba(15,23,42,0.34)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600/80 dark:text-amber-400/80">Password</p>
          <h2 className="text-2xl font-semibold">Change password</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-[28px] border border-border/50 bg-background/72 p-5">
        <div className="space-y-2">
          <Label>Current password</Label>
          <Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>New password</Label>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Min. 3 characters</span>
          </div>
          <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={3} />
        </div>
        <div className="space-y-2">
          <Label>Confirm new password</Label>
          <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={3} />
        </div>
        <Button type="submit" variant="gradient" className="gap-2" disabled={saving || !currentPassword || !newPassword || !confirmPassword}>
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
