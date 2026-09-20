export const APP_ROUTES = {
  landing: '/',
  signIn: '/signin',
  signUp: '/signup',
  signUpWithRole: (role: string) => `/signup?role=${encodeURIComponent(role)}`,
  signUpOnboarding: (role: string, step = 1) =>
    `/signup?role=${encodeURIComponent(role)}&step=${step}`,
  home: '/home',
} as const;

export const API_ROUTES = {
  locations: '/api/locations',
} as const;

export const ASSET_ROUTES = {
  logo: '/AgriMarketLogo.png',
} as const;
