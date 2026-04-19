import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 10000 })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  const tenantSlug = localStorage.getItem('tenantSlug')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (tenantSlug) config.headers['X-Tenant-Slug'] = tenantSlug
  return config
})

api.interceptors.response.use(r => r, async err => {
  if (err.response?.status === 401) {
    const refresh = localStorage.getItem('refreshToken')
    if (refresh) {
      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken: refresh })
        localStorage.setItem('accessToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        err.config.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api.request(err.config)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    } else {
      localStorage.clear()
      window.location.href = '/login'
    }
  }
  return Promise.reject(err)
})

export default api