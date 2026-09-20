export const APP_ROUTES = {
  landing: '/',
  signIn: '/signin',
  signUp: '/signup',
  signUpWithRole: (role: string) => `/signup?role=${encodeURIComponent(role)}`,
  signUpOnboarding: (role: string, step = 1) =>
    `/signup?role=${encodeURIComponent(role)}&step=${step}`,
  home: '/home',
  productDetail: (id: string) => `/products/${id}`,
  cart: '/cart',
  orders: '/orders',
  orderDetail: (id: string) => `/orders/${id}`,
  profile: '/profile',
  profileAddresses: '/profile/addresses',
} as const;

export const API_ROUTES = {
  locations: '/api/locations',
} as const;

export const ASSET_ROUTES = {
  logo: '/AgriMarketLogo.png',
} as const;
