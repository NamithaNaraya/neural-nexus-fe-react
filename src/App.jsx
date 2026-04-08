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

const LoginPage = lazy(() => import('./pages/LoginPage'));
const FoldersPage = lazy(() => import('./pages/FoldersPage'));
const GraphPage = lazy(() => import('./pages/GraphPage'));
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const VisualizeDataPage = lazy(() => import('./pages/visualize/VisualizeDataPage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const MLPredictionPage = lazy(() => import('./pages/InsightsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
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
                  <AppLayout>
                    <Suspense fallback={null}>
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
