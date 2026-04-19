import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

interface User { id: number; name: string; email: string; role: string }
interface AuthCtx {
  user: User | null
  loading: boolean
  tenantSlug: string | null
  login(tenantSlug: string, email: string, password: string): Promise<void>
  logout(): void
  isAdmin(): boolean
  isManager(): boolean
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const slug = localStorage.getItem('tenantSlug')
    if (stored) setUser(JSON.parse(stored))
    if (slug) setTenantSlug(slug)
    setLoading(false)
  }, [])

  async function login(slug: string, email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password }, {
      headers: { 'X-Tenant-Slug': slug }
    })
    const { accessToken, refreshToken, user: u } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(u))
    localStorage.setItem('tenantSlug', slug)
    setUser(u)
    setTenantSlug(slug)
    toast.success(`Bem-vinda, ${u.name}! 🎂`)
  }

  function logout() {
    api.post('/auth/logout').catch(() => {})
    localStorage.clear()
    setUser(null)
    setTenantSlug(null)
  }

  return (
    <AuthContext.Provider value={{
      user, loading, tenantSlug, login, logout,
      isAdmin: () => user?.role === 'admin',
      isManager: () => ['admin', 'manager'].includes(user?.role || ''),
    }}>
      {children}
    </AuthContext.Provider>
  )
}
