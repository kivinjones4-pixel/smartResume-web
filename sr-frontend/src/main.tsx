import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import ProtectedRoute from './auth/ProtectedRoute.tsx'
import AuthPage from './pages/AuthPage/AuthPage.tsx'

export const ResumeWorkspace = lazy(() => import('./pages/ResumeWorkspace/ResumeWorkspace.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="grid min-h-screen place-items-center text-sm text-slate-500">
              正在加载…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route
              path="/resume"
              element={
                <ProtectedRoute>
                  <ResumeWorkspace />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
