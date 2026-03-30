import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { GlobalFolderProvider } from './contexts/GlobalFolderContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const GraphPage = lazy(() => import('./pages/GraphPage'));
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const FoldersPage = lazy(() => import('./pages/FoldersPage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const MLPredictionPage = lazy(() => import('./pages/InsightsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function RouteLoader() {
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-border/50 bg-card/70 p-6 text-center shadow-xl backdrop-blur-sm">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <h2 className="mt-4 text-lg font-semibold">Loading page</h2>
        <p className="mt-1 text-sm text-muted-foreground">Bringing the next section into view.</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Suspense fallback={<RouteLoader />}>
              <LoginPage />
            </Suspense>
          </PublicRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <SidebarProvider>
              <GlobalFolderProvider>
                <Suspense fallback={<RouteLoader />}>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/graph/*" element={<GraphPage />} />
                      <Route path="/chat" element={<ChatPage />} />
                      <Route path="/upload" element={<UploadPage />} />
                      <Route path="/folders" element={<FoldersPage />} />
                      <Route path="/browse" element={<BrowsePage />} />
                      <Route path="/ml-prediction" element={<MLPredictionPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/insights" element={<Navigate to="/ml-prediction" replace />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/help" element={<HelpPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </DashboardLayout>
                </Suspense>
              </GlobalFolderProvider>
            </SidebarProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
