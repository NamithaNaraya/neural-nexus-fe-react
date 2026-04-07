import React, { useEffect, useState } from 'react';
import { FolderLock, Loader2, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useGlobalFolder } from '../../../contexts/GlobalFolderContext';
import { folderService } from '../../../services/folderService';
import { Button } from '../../../components/ui/Button';
import { Input, Label } from '../../../components/ui/Input';

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
    <section className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-border/60 bg-card/82 p-4 shadow-[0_18px_46px_-36px_rgba(15,23,42,0.3)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <FolderLock className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600/80 dark:text-blue-400/80">Folder permission</p>
          <h2 className="text-lg font-semibold">{currentFolder?.name || 'Select a folder'}</h2>
        </div>
      </div>

      <form onSubmit={handleGrant} className="mt-4 grid gap-3 rounded-[22px] border border-border/50 bg-gradient-to-r from-background/90 to-blue-500/[0.04] p-4 md:grid-cols-[1fr_140px_auto]">
        <div className="space-y-2">
          <Label>Share with user email</Label>
          <Input value={userEmail} onChange={(event) => setUserEmail(event.target.value)} placeholder="user@example.com" className="h-10" />
        </div>

        <div className="space-y-2">
          <Label>Permission</Label>
          <select
            value={permission}
            onChange={(event) => setPermission(event.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm backdrop-blur-sm"
          >
            <option value="read">Read</option>
            <option value="write">Write</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button type="submit" variant="gradient" className="h-10 w-full gap-2" disabled={!selectedFolderId || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Grant
          </Button>
        </div>
      </form>

      {status && (
        <div className="mt-4 rounded-2xl border border-border/50 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {status}
        </div>
      )}

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading permissions...
          </div>
        ) : permissions.length > 0 ? (
          permissions.map((entry) => (
            <div key={`${entry.user_id}-${entry.permission}`} className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/72 px-4 py-2.5">
              <div>
                <p className="font-medium">{entry.user_email || entry.user_id}</p>
                <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {entry.permission}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(entry.user_id)}
                className="rounded-xl p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                title="Revoke permission"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border/50 bg-background/52 px-4 py-5 text-sm text-muted-foreground">
            No shared users for the selected folder.
          </div>
        )}
      </div>
    </section>
  );
}
