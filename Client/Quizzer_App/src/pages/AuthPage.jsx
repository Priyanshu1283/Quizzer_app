import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'

export const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState('login')
  const { login, register } = useAuth()
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [regData, setRegData] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const oauthErr = searchParams.get('error')
    if (!oauthErr) return
    const messages = {
      database_unavailable:
        'Cannot reach the database. Check your connection, MONGO_URI, and MongoDB Atlas network access, then restart the server.',
      oauth_failed: 'Google sign-in failed. Please try again.',
    }
    setError(messages[oauthErr] || 'Sign-in failed. Please try again.')
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const handleChange = (setter) => (e) => {
    const { name, value } = e.target
    setter((s) => ({ ...s, [name]: value }))
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setError(null); setLoading(true)
    try { await login(loginData, isAdminLogin) }
    catch (err) { setError(err.response?.data?.message || 'Login failed') }
    finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault(); setError(null)
    const missing = Object.entries(regData).filter(([, v]) => !v)
    if (missing.length) return setError('Please fill all fields')
    setLoading(true)
    try { await register(regData) }
    catch (err) {
      const serverErr = err.response?.data
      if (serverErr?.error) setError(serverErr.error.map((e) => e.msg).join(', '))
      else setError(serverErr?.message || 'Registration failed')
    }
    finally { setLoading(false) }
  }

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const googleRedirect = () => { window.location.href = `${API_URL}/auth/google`; }

  const tabBtn = (label, active, onClick) => (
    <button onClick={onClick}
      className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'}`}>
      {label}
    </button>
  )

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100/90 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle nav={false} />
      </div>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)' }}>
        <div className="text-white text-center max-w-sm">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 text-4xl font-black text-white">Q</div>
          <h1 className="text-4xl font-black mb-4">Quizzer</h1>
          <p className="text-blue-100 text-lg leading-relaxed">India's most trusted competitive exam preparation platform. Practice, compete, and excel.</p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
            {[['10k+', 'Students'], ['500+', 'Mock Tests'], ['95%', 'Success Rate'], ['24/7', 'Available']].map(([n, l]) => (
              <div key={l} className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-white">{n}</div>
                <div className="text-blue-200 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-6 pt-16 sm:pt-6">
        <div className="w-full max-w-md animate-in">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-2xl font-black text-white lg:hidden dark:bg-blue-500">Q</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back!</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Sign in to continue your preparation</p>
            </div>

            <div className="mb-7 flex items-center gap-2 rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
              {tabBtn('Student', tab === 'login' && !isAdminLogin, () => { setTab('login'); setIsAdminLogin(false); })}
              {tabBtn('Admin', tab === 'login' && isAdminLogin, () => { setTab('login'); setIsAdminLogin(true); })}
              {tabBtn('Register', tab === 'register', () => setTab('register'))}
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="relative overflow-hidden">
              <div className={`transition-all duration-300 ${tab === 'login' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input label="Email Address" name="email" value={loginData.email} onChange={handleChange(setLoginData)} type="email" placeholder="you@example.com" />
                  <Input label="Password" name="password" value={loginData.password} onChange={handleChange(setLoginData)} type="password" placeholder="••••••••" />
                  <Button type="submit" disabled={loading} className="w-full bg-blue-600 py-3 text-base text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500">
                    {loading ? 'Signing in...' : isAdminLogin ? ' Admin Sign In' : 'Sign In'}
                  </Button>
                  <div className="relative my-2 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200 dark:bg-slate-600" />
                    <span className="text-xs font-medium text-gray-400 dark:text-slate-500">OR</span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-slate-600" />
                  </div>
                  <Button onClick={googleRedirect} className="w-full border border-gray-200 bg-white py-3 text-base text-gray-700 shadow-none hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Continue with Google
                  </Button>
                </form>
              </div>

              <div className={`transition-all duration-300 ${tab === 'register' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First Name" name="firstName" value={regData.firstName} onChange={handleChange(setRegData)} placeholder="Rahul" />
                    <Input label="Last Name" name="lastName" value={regData.lastName} onChange={handleChange(setRegData)} placeholder="Sharma" />
                  </div>
                  <Input label="Email Address" name="email" value={regData.email} onChange={handleChange(setRegData)} type="email" placeholder="you@example.com" />
                  <Input label="Password" name="password" value={regData.password} onChange={handleChange(setRegData)} type="password" placeholder="Min. 6 characters" />
                  <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 py-3 text-base">
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                  <div className="relative my-2 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200 dark:bg-slate-600" />
                    <span className="text-xs font-medium text-gray-400 dark:text-slate-500">OR</span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-slate-600" />
                  </div>
                  <Button onClick={googleRedirect} className="w-full border border-gray-200 bg-white py-3 text-base text-gray-700 shadow-none hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Sign up with Google
                  </Button>
                </form>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400 dark:text-slate-500">By continuing, you agree to Quizzer's Terms & Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}

export default AuthPage