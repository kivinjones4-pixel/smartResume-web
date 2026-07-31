import { Spin } from 'antd'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/Auth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <Spin size="large" description="正在恢复登录状态…" />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}
