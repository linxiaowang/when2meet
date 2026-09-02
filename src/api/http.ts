const base = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT'
  data?: unknown
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function apiUrl(path: string): string {
  return `${base}${path}`
}

export function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: apiUrl(path),
      method: options.method || 'GET',
      data: options.data as Record<string, unknown> | undefined,
      header: {
        'Content-Type': 'application/json',
      },
      success: (res) => {
        const data = res.data as { error?: string } & T
        if (res.statusCode >= 400) {
          reject(new ApiError(data?.error || `请求失败 ${res.statusCode}`, res.statusCode))
          return
        }
        resolve(data)
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络错误'))
      },
    })
  })
}
