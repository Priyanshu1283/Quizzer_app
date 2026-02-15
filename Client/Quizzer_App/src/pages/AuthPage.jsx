import React, { useState } from 'react'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

export const AuthPage = () => {
  const [tab, setTab] = useState('login')
  const { login, register } = useAuth()
  const [isAdminLogin, setIsAdminLogin] = useState(false)

  // login state
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [regData, setRegData] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (setter) => (e) => {
    const { name, value } = e.target
    setter((s) => ({ ...s, [name]: value }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(loginData, isAdminLogin)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(null)
    // basic validation
    const missing = Object.entries(regData).filter(([, v]) => !v)
    if (missing.length) return setError('Please fill all fields')
    setLoading(true)
    try {
      await register(regData)
    } catch (err) {
      // show detailed validation errors when available
      const serverErr = err.response?.data
      if (serverErr) {
        if (serverErr.error) {
          // express-validator errors array
          const msgs = serverErr.error.map((e) => e.msg).join(', ')
          setError(msgs)
        } else if (serverErr.message) {
          setError(serverErr.message)
        } else {
          setError(JSON.stringify(serverErr))
        }
      } else {
        setError('Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const googleRedirect = () => {
    window.location.href = 'http://localhost:3000/api/auth/google'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-indigo-600">Welcome to Quizzer</h1>
          <p className="text-sm text-gray-500">Sign in or create an account</p>
        </div>

        <div className="flex items-center gap-2 mb-6 justify-center">
          <button
            onClick={() => { setTab('login'); setIsAdminLogin(false); }}
            className={`px-4 py-2 rounded-md ${tab === 'login' && !isAdminLogin ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            User Login
          </button>
          <button
            onClick={() => { setTab('login'); setIsAdminLogin(true); }}
            className={`px-4 py-2 rounded-md ${tab === 'login' && isAdminLogin ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Admin Login
          </button>
          <button
            onClick={() => setTab('register')}
            className={`px-4 py-2 rounded-md ${tab === 'register' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Register
          </button>
        </div>

        <div className="relative">
          <div className={`transition-all duration-300 ${tab === 'login' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 absolute inset-0'}`}>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && tab === 'login' && <div className="text-sm text-red-600">{error}</div>}
              <Input label="Email" name="email" value={loginData.email} onChange={handleChange(setLoginData)} type="email" />
              <Input label="Password" name="password" value={loginData.password} onChange={handleChange(setLoginData)} type="password" />
              <div className="flex items-center justify-between">
                <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700" disabled={loading}>
                  {loading ? 'Loading...' : (isAdminLogin ? 'Admin Login' : 'Login')}
                </Button>
                <Button onClick={googleRedirect} className="bg-red-500 text-white hover:bg-red-600">
                  Login with Google
                </Button>
              </div>
            </form>
          </div>

          <div className={`transition-all duration-300 ${tab === 'register' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 absolute inset-0'}`}>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && tab === 'register' && <div className="text-sm text-red-600">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name" name="firstName" value={regData.firstName} onChange={handleChange(setRegData)} />
                <Input label="Last Name" name="lastName" value={regData.lastName} onChange={handleChange(setRegData)} />
              </div>
              <Input label="Email" name="email" value={regData.email} onChange={handleChange(setRegData)} type="email" />
              <Input label="Password" name="password" value={regData.password} onChange={handleChange(setRegData)} type="password" />
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button type="submit" className="w-full bg-indigo-600 text-white hover:bg-indigo-700" disabled={loading}>
                  {loading ? 'Loading...' : 'Register'}
                </Button>
                <Button onClick={googleRedirect} className="w-full bg-blue-500 text-white hover:bg-red-600">
                  Continue with Google
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
