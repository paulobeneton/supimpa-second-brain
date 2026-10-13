export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const csrf = document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))?.slice(11)
  const response = await fetch(path, { ...init, credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(csrf ? { 'X-XSRF-TOKEN': decodeURIComponent(csrf) } : {}), ...init.headers } })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = data?.errors ? Object.values(data.errors).flat().join(' ') : data?.message
    throw new ApiError(response.status, detail || `Não foi possível concluir (${response.status}).`)
  }
  return data as T
}
export const csrf = () => fetch('/sanctum/csrf-cookie', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
export interface User { id: number; name: string; email: string }
