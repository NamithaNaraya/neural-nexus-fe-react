import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Upload as UploadIcon,
  FileText,
  FolderPlus,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { uploadService } from '../services/uploadService';
import { useGlobalFolder } from '../contexts/GlobalFolderContext';

export default function UploadPage() {
  const { currentFolder, selectedFolderId } = useGlobalFolder();
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles.map(f => ({ file: f, status: 'pending' }))]);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles.map(f => ({ file: f, status: 'pending' }))]);
  }, []);

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (!selectedFolderId || files.length === 0 || uploading) return;

    setUploading(true);
    setUploadProgress(0);

    // Mark all as uploading
    setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

    try {
      const rawFiles = files.map(f => f.file);
      await uploadService.uploadFiles(
        selectedFolderId,
        rawFiles,
        (progress) => setUploadProgress(progress)
      );

      // Mark all as success
      setFiles(prev => prev.map(f => ({ ...f, status: 'success' })));
    } catch (err) {
      const message = err.response?.data?.detail || 'Upload failed';
      setFiles(prev => prev.map(f => ({ ...f, status: 'error', error: message })));
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="gradient-text">Upload & Ingest</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Upload documents to extract knowledge and build your graph automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-2 space-y-4">
          {/* Folder selector */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  Target Folder
                </label>
                {selectedFolderId ? (
                  <div className="flex min-h-10 items-center justify-between rounded-lg border border-input bg-background/50 px-3 text-sm backdrop-blur-sm">
                    <span className="font-medium">{currentFolder?.name || 'Selected folder'}</span>
                    <span className="text-xs text-muted-foreground">
                      {Number(currentFolder?.file_count || 0).toLocaleString()} files
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No global folder selected. <a href="/folders" className="text-primary hover:underline">Create one</a> or choose it in the header first.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Drop zone */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer',
                  isDragging
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-border/50 hover:border-primary/40 hover:bg-muted/20'
                )}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.txt,.csv,.json,.md,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="space-y-4">
                  <div className={cn(
                    'w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-all duration-300',
                    isDragging ? 'bg-primary/20 scale-110' : 'bg-muted/30'
                  )}>
                    <CloudUpload className={cn(
                      'w-8 h-8 transition-colors',
                      isDragging ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>

                  <div>
                    <p className="text-base font-medium">
                      {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or <span className="text-primary font-medium">click to browse</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {['PDF', 'TXT', 'CSV', 'JSON', 'MD', 'DOCX'].map(ext => (
                      <Badge key={ext} variant="secondary" className="text-[10px]">{ext}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">{files.length} file(s) selected</h3>
                    <Button variant="ghost" size="sm" onClick={() => setFiles([])}>Clear all</Button>
                  </div>

                  {files.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30 transition-all duration-200"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatSize(item.file.size)}</p>
                      </div>

                      {item.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {item.status === 'uploading' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}

                      {item.status === 'pending' && (
                        <button
                          onClick={() => removeFile(i)}
                          className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Progress bar */}
                  {uploading && (
                    <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  <Button
                    variant="gradient"
                    className="w-full mt-4 gap-2"
                    disabled={uploading || !selectedFolderId || files.every(f => f.status === 'success')}
                    onClick={handleUpload}
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing... {uploadProgress}%</>
                    ) : files.every(f => f.status === 'success') ? (
                      <><CheckCircle2 className="w-4 h-4" /> Uploaded Successfully</>
                    ) : (
                      <><UploadIcon className="w-4 h-4" /> Upload & Process</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-primary" />
                How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {[
                'Choose the active folder from the global header',
                'Upload documents (PDF, text, CSV, etc.)',
                'AI extracts entities & relationships',
                'Review extractons in the Review Inbox',
                'Approve to commit to knowledge graph',
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <p>{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
