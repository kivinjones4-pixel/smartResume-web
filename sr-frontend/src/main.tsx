import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import Home from './pages/Home/Home.tsx'
import { AuthProvider } from './store/Auth.ts'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import AuthPage from './pages/AuthPage/AuthPage.tsx'
import { ResumeProvider } from './store/Resume.ts'
import KKAssistant from './components/KKAssistant/KKAssistant.tsx'

export const ResumeWorkspace = lazy(() => import('./pages/ResumeWorkspace/ResumeWorkspace.tsx'))
const AccessSettings = lazy(() => import('./pages/AccessSettings/AccessSettings.tsx'))
const ResumeVisitor = lazy(() => import('./pages/ResumeVisitor/ResumeVisitor.tsx'))

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
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route
              path="/resume"
              element={
                <ProtectedRoute>
                  <ResumeProvider>
                    <ResumeWorkspace />
                  </ResumeProvider>
                </ProtectedRoute>
              }
            />
            <Route path="/access-settings" element={<ProtectedRoute><AccessSettings /></ProtectedRoute>} />
            <Route path="/resume-visitor/:id" element={<ResumeVisitor />} />
          </Routes>
          <KKAssistant />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
