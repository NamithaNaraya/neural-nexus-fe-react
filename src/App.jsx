import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { GlobalFolderProvider } from './contexts/GlobalFolderContext';
import { PredictedLinksProvider } from './contexts/PredictedLinksContext';
import { AppLayout } from './components/layout/AppLayout';
import { ChakraAppProvider } from './providers/ChakraAppProvider';
import { pageLoaders } from './pages/pageLoaders';

const LoginPage = lazy(pageLoaders.login);
const LandingPage = lazy(pageLoaders.landing);
const FoldersPage = lazy(pageLoaders.folders);
const GraphPage = lazy(pageLoaders.graph);
const ChatPage = lazy(pageLoaders.chat);
const UploadPage = lazy(pageLoaders.upload);
const VisualizeDataPage = lazy(pageLoaders.visualize);
const BrowsePage = lazy(pageLoaders.browse);
const MLPredictionPage = lazy(pageLoaders.mlPrediction);
const AnalyticsPage = lazy(pageLoaders.analytics);
const SettingsPage = lazy(pageLoaders.settings);
const HelpPage = lazy(pageLoaders.help);

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/folders" replace />;
  return children;
}

function HomeRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/folders" replace />;
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  );
}

function PageTransition({ children }) {
  return <div className="h-full w-full">{children}</div>;
}

function AppRouteFallback() {
  return (
    <div className="space-y-5 pb-6">
      <div className="rounded-[28px] border border-border/50 bg-card/70 p-6 shadow-sm">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded-full animate-skeleton-shine" />
          <div className="h-9 w-72 max-w-[70%] rounded-2xl animate-skeleton-shine" />
          <div className="h-4 w-full max-w-2xl rounded-full animate-skeleton-shine" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="h-11 w-full rounded-2xl animate-skeleton-shine" />
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="rounded-[24px] border border-border/50 bg-card/70 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl animate-skeleton-shine" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded-full animate-skeleton-shine" />
                  <div className="h-3 w-1/2 rounded-full animate-skeleton-shine" />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <div className="h-8 w-20 rounded-xl animate-skeleton-shine" />
                <div className="h-8 w-24 rounded-xl animate-skeleton-shine" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] border border-border/50 bg-card/70 p-5 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-[24px] border border-border/40 bg-background/40 p-4">
                <div className="h-5 w-5 rounded-md animate-skeleton-shine" />
                <div className="mt-3 h-7 w-16 rounded-full animate-skeleton-shine" />
                <div className="mt-2 h-3 w-20 rounded-full animate-skeleton-shine" />
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-10 w-56 rounded-2xl animate-skeleton-shine" />
            <div className="h-[260px] w-full rounded-[24px] animate-skeleton-shine" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Navigate to="/folders" replace />} />
      <Route path="/folders" element={<PageTransition><FoldersPage /></PageTransition>} />
      <Route path="/graph/*" element={<PageTransition><GraphPage /></PageTransition>} />
      <Route path="/visualize/*" element={<PageTransition><VisualizeDataPage /></PageTransition>} />
      <Route path="/chat" element={<PageTransition><ChatPage /></PageTransition>} />
      <Route path="/upload" element={<PageTransition><UploadPage /></PageTransition>} />
      <Route path="/browse" element={<PageTransition><BrowsePage /></PageTransition>} />
      <Route path="/ml-prediction" element={<PageTransition><MLPredictionPage /></PageTransition>} />
      <Route path="/analytics" element={<PageTransition><AnalyticsPage /></PageTransition>} />
      <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
      <Route path="/help" element={<PageTransition><HelpPage /></PageTransition>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const protectedFallback = <AppRouteFallback />;

  return (
    <Routes>
      <Route
        path="/"
        element={<HomeRoute />}
      />
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
                  <AppLayout>
                    <Suspense fallback={protectedFallback}>
                      <AnimatedRoutes />
                    </Suspense>
                  </AppLayout>
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
            <AppContent />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ChakraAppProvider>
  );
}

export default App;
