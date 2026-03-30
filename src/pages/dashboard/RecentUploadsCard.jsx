import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { cn } from '../../utils/cn';

/**
 * Recent Uploads Card
 * Shows the latest files uploaded and their impact on the knowledge graph
 * Updates dynamically from the database
 */
export function RecentUploadsCard() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await dashboardService.getRecentUploads(5);
        setUploads(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load uploads');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="hover:border-primary/10 transition-all duration-500 ease-out">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="w-4 h-4 text-primary" />
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || uploads.length === 0) {
    return (
      <Card className="hover:border-primary/10 transition-all duration-500 ease-out">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="w-4 h-4 text-primary" />
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>{error || 'No recent uploads'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (status === 'failed') return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <FileText className="w-4 h-4 text-amber-500" />;
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return 'bg-emerald-500/10 border border-emerald-500/30';
    if (status === 'failed') return 'bg-red-500/10 border border-red-500/30';
    return 'bg-amber-500/10 border border-amber-500/30';
  };

  return (
    <Card className="hover:border-primary/10 transition-all duration-500 ease-out">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="w-4 h-4 text-primary" />
          Recent Uploads
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Latest files added to your knowledge graph
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className={cn(
                'p-3 rounded-lg transition-all duration-300 ease-out hover:shadow-sm',
                getStatusColor(upload.status)
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getStatusIcon(upload.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.filename}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <span>{upload.nodeCount.toLocaleString()} nodes</span>
                    <span>•</span>
                    <span>{upload.relationshipCount.toLocaleString()} relationships</span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {upload.createdAt ? formatTime(upload.createdAt) : 'Just now'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Format date/time in relative terms (e.g., "2 hours ago")
 */
function formatTime(date) {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}
