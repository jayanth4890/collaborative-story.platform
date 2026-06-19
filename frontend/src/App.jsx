import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PageLoader from './components/PageLoader';

// Lazy loaded page components
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const StoriesFeed = lazy(() => import('./pages/StoriesFeed'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateStory = lazy(() => import('./pages/CreateStory'));
const StoryDetails = lazy(() => import('./pages/StoryDetails'));
const PublicStories = lazy(() => import('./pages/PublicStories'));
const PublicStoryDetails = lazy(() => import('./pages/PublicStoryDetails'));

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Unprotected Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Public feed and reading routes */}
                <Route
                  path="/public-stories"
                  element={
                    <Layout>
                      <PublicStories />
                    </Layout>
                  }
                />
                <Route
                  path="/public-story/:id"
                  element={
                    <Layout>
                      <PublicStoryDetails />
                    </Layout>
                  }
                />

                {/* General Protected Routes (Any logged-in role) */}
                <Route element={<ProtectedRoute />}>
                  <Route
                    path="/"
                    element={
                      <Layout>
                        <StoriesFeed />
                      </Layout>
                    }
                  />
                  <Route
                    path="/story/:id"
                    element={
                      <Layout>
                        <StoryDetails />
                      </Layout>
                    }
                  />
                </Route>

                {/* Contributor, Author, Admin Protected Workspace */}
                <Route element={<ProtectedRoute allowedRoles={['contributor', 'author', 'admin']} />}>
                  <Route
                    path="/dashboard"
                    element={
                      <Layout>
                        <Dashboard />
                      </Layout>
                    }
                  />
                </Route>

                {/* Author and Admin Story Creation */}
                <Route element={<ProtectedRoute allowedRoles={['author', 'admin']} />}>
                  <Route
                    path="/story/create"
                    element={
                      <Layout>
                        <CreateStory />
                      </Layout>
                    }
                  />
                </Route>

                {/* Catch-all Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
