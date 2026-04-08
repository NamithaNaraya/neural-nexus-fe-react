import React, { useEffect, useState } from 'react';
import { FolderLock, Loader2, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useGlobalFolder } from '../../../contexts/GlobalFolderContext';
import { folderService } from '../../../services/folderService';
import { Button } from '../../../components/ui/Button';
import { Input, Label } from '../../../components/ui/Input';
import { Card, CardContent } from '../../../components/ui/Card';

export function FolderPermissionsCard() {
  const { currentFolder, selectedFolderId } = useGlobalFolder();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [permission, setPermission] = useState('read');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  async function loadPermissions() {
    if (!selectedFolderId) {
      setPermissions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await folderService.getPermissions(selectedFolderId);
      setPermissions(Array.isArray(response?.permissions) ? response.permissions : []);
      setStatus('');
    } catch (error) {
      setPermissions([]);
      setStatus(error.response?.data?.detail || 'Folder permissions are not available for this folder.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPermissions();
  }, [selectedFolderId]);

  async function handleGrant(event) {
    event.preventDefault();
    if (!selectedFolderId || !userEmail.trim() || saving) return;

    setSaving(true);
    try {
      const response = await folderService.grantPermission(selectedFolderId, userEmail.trim(), permission);
      setStatus(response?.message || 'Permission updated.');
      setUserEmail('');
      await loadPermissions();
    } catch (error) {
      setStatus(error.response?.data?.detail || 'Failed to update permission.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(userId) {
    if (!selectedFolderId || !userId) return;

    try {
      const response = await folderService.revokePermission(selectedFolderId, userId);
      setStatus(response?.message || 'Permission removed.');
      await loadPermissions();
    } catch (error) {
      setStatus(error.response?.data?.detail || 'Failed to remove permission.');
    }
  }

  return (
    <Card variant="branded" className="flex min-h-0 flex-1 flex-col border-border/60 bg-card/82 shadow-lg backdrop-blur-xl">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <FolderLock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600/80">Folder Control</p>
            <h2 className="text-lg font-bold truncate max-w-[200px] sm:max-w-none">{currentFolder?.name || 'Workspace Security'}</h2>
          </div>
        </div>

        <form onSubmit={handleGrant} className="mt-5 grid gap-4 rounded-[26px] border border-border/50 bg-gradient-to-r from-background/90 to-emerald-500/[0.04] p-5 md:grid-cols-[1fr_160px_auto]">
          <div className="space-y-2">
            <Label className="font-bold text-[11px] text-muted-foreground uppercase">Invite Researcher</Label>
            <Input 
              value={userEmail} 
              onChange={(event) => setUserEmail(event.target.value)} 
              placeholder="user@example.com" 
              className="h-11 rounded-xl bg-background/50 focus:bg-background border-border/60 transition-colors" 
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-[11px] text-muted-foreground uppercase">Privilege</Label>
            <select
              value={permission}
              onChange={(event) => setPermission(event.target.value)}
              className="flex h-11 w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm font-medium backdrop-blur-sm transition-colors focus:border-emerald-500/40 focus:outline-none"
            >
              <option value="read">Read Only</option>
              <option value="write">Collaborator</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button type="submit" variant="gradient" className="h-11 w-full gap-2 rounded-xl shadow-lg shadow-emerald-500/20" disabled={!selectedFolderId || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4.5 w-4.5" />}
              Share
            </Button>
          </div>
        </form>

        {status && (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 animate-fade-in">
            {status}
          </div>
        )}

        <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Access List</p>
          {loading ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/40 bg-background/40 text-sm font-medium text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              Verifying credentials...
            </div>
          ) : permissions.length > 0 ? (
            permissions.map((entry) => (
              <div key={`${entry.user_id}-${entry.permission}`} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-background/50 px-4 py-3 hover:border-emerald-500/20 transition-colors">
                <div className="min-w-0">
                  <p className="font-bold truncate text-foreground">{entry.user_email || entry.user_id}</p>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {entry.permission}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(entry.user_id)}
                  className="rounded-xl p-2.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive group"
                  title="Revoke access"
                >
                  <X className="h-4.5 w-4.5 transition-transform group-hover:rotate-90" />
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-[26px] border border-dashed border-border/50 bg-background/30 px-4 py-8 text-center">
              <p className="text-sm font-bold text-muted-foreground">No shared access profiles found.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
