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

export const login = (data) => api.post('/auth/login', data)
export const me = () => api.get('/auth/me')
export const logout = () => api.post('/auth/logout')
