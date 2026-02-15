import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import TestSeriesPage from './pages/TestSeriesPage'
import TestInstructionsPage from './pages/TestInstructionsPage'
import TestInterface from './pages/TestInterface'
import ResultPage from './pages/ResultPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/series/:seriesId"
          element={
            <ProtectedRoute>
              <TestSeriesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/test/:testId/instructions"
          element={
            <ProtectedRoute>
              <TestInstructionsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/test/:testId/attempt/:attemptId"
          element={
            <ProtectedRoute>
              <TestInterface />
            </ProtectedRoute>
          }
        />

        <Route
          path="/result/:resultId"
          element={
            <ProtectedRoute>
              <ResultPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Ideally should have AdminRoute protection */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
