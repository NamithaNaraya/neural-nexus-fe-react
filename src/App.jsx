import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { GlobalFolderProvider } from './contexts/GlobalFolderContext';
import { PredictedLinksProvider } from './contexts/PredictedLinksContext';
import { AppLayout } from './components/layout/AppLayout';
import { ChakraAppProvider } from './providers/ChakraAppProvider';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const GraphPage = lazy(() => import('./pages/GraphPage'));
const VisualizeDataPage = lazy(() => import('./pages/visualize/VisualizeDataPage'));
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


function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Suspense fallback={null}>
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
                <PredictedLinksProvider>
                  <Suspense fallback={null}>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/folders" replace />} />
                        <Route path="/graph/*" element={<GraphPage />} />
                        <Route path="/visualize/*" element={<VisualizeDataPage />} />
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
                    </AppLayout>
                  </Suspense>
                </PredictedLinksProvider>
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
    <ChakraAppProvider>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ChakraAppProvider>
  );
}

export default App;
