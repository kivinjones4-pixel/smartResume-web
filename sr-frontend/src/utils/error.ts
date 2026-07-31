import { ApiError } from '../services/request'

export function getErrorMessage(error: unknown, fallback = '操作失败，请稍后重试') {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function isFormValidationError(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'errorFields' in error &&
      Array.isArray((error as { errorFields?: unknown }).errorFields),
  )
}
