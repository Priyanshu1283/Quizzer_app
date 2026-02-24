import api from './api'

export const register = (data) => {
    // Expecting { firstName, lastName, email, password }
    const { firstName, lastName, email, password } = data
    const payload = {
        email,
        password,
        fullname: {
            firstName,
            lastName,
        },
    }
    return api.post('/auth/register', payload)
}

const login = (data) => api.post('/auth/login', data)
const me = () => api.get('/auth/me')
const logout = () => api.post('/auth/logout')

const authService = {
    register,
    login,
    me,
    logout
}

export default authService;