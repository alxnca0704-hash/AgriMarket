export const APP_ROUTES = {
  landing: '/',
  signIn: '/signin',
  signUp: '/signup',
  signUpWithRole: (role: string) => `/signup?role=${encodeURIComponent(role)}`,
  home: '/home',
} as const;

export const API_ROUTES = {
  signIn: '/api/auth/signin',
  signUp: '/api/auth/signup',
  locations: '/api/locations',
} as const;
