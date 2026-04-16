import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { GlobalFolderProvider } from './contexts/GlobalFolderContext';
import { PredictedLinksProvider } from './contexts/PredictedLinksContext';
import { AppLayout } from './components/layout/AppLayout';
import { ChakraAppProvider } from './providers/ChakraAppProvider';
import { RoutePageSkeleton } from './components/skeletons/RoutePageSkeleton';
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
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
    </AnimatePresence>
  );
}

function AppContent() {
  const location = useLocation();
  const protectedFallback = <RoutePageSkeleton pathname={location.pathname} />;

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
