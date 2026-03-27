import axios from 'axios'
import { env } from '@/lib/env'

export const api = axios.create({
  baseURL: env.apiUrl,
})

export const setAuthToken = (token?: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}
