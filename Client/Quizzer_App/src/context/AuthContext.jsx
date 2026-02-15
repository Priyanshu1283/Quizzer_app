import React, { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/auth'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    authService
      .me()
      .then((res) => {
        const payload = res.data?.user ?? res.data // If user is null (from backend), set null
        if (mounted) {
          if (payload && (payload.id || payload._id)) {
            setUser(payload);
          } else {
            setUser(null);
          }
        }
      })
      .catch((err) => {
        console.error("Auth check failed", err);
        setUser(null);
      })
      .finally(() => mounted && setLoading(false))

    return () => (mounted = false)
  }, [])

  const handleLogin = async (creds, isAdminLogin = false) => {
    const res = await authService.login(creds)
    const payload = res.data?.user ?? res.data

    if (isAdminLogin && payload?.role !== 'admin') {
      // If trying to login as admin but not admin, deny access logic
      // We shouldn't set user state, instead logout (backend clean up) and throw error
      await authService.logout()
      throw new Error("Access Denied: You are not an admin.")
    }

    setUser(payload)
    if (payload?.role === 'admin') {
      navigate('/admin')
    } else {
      navigate('/dashboard')
    }
    return res
  }

  const handleRegister = async (payload) => {
    const res = await authService.register(payload)
    const data = res.data?.user ?? res.data
    setUser(data)
    navigate('/dashboard')
    return res
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (err) {
      console.error('Logout failed', err)
      // ignore
    }
    setUser(null)
    navigate('/auth')
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login: handleLogin, register: handleRegister, logout: handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
