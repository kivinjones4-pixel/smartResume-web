export type AuthUser = {
  id: string
  email: string
  username: string
  phone?: string | null
}

export type AuthResponse = {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  user: AuthUser
}

export type LoginParams = {
  identifier: string
  password: string
}

export type RegisterParams = {
  email: string
  password: string
  username: string
}

export type AuthStoreValue = {
  user: AuthUser | null
  loading: boolean
  login: (values: LoginParams) => Promise<void>
  register: (values: RegisterParams) => Promise<void>
  logout: () => Promise<void>
}
