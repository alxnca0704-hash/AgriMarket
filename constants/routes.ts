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
  checkout: '/checkout',
  orders: '/orders',
  orderDetail: (id: string) => `/orders/${id}`,
  profile: '/profile',
  profileAddresses: '/profile/addresses',
  seller: '/seller',
  sellerOnboarding: '/seller/onboarding',
  sellerDashboard: '/seller/dashboard',
  sellerProducts: '/seller/products',
  sellerProductNew: '/seller/products/new',
  sellerProductEdit: (id: string) => `/seller/products/${id}`,
  sellerOrders: '/seller/orders',
  sellerOrderDetail: (id: string) => `/seller/orders/${id}`,
  sellerStall: '/seller/stall',
  sellerEarnings: '/seller/earnings',
  sellerReviews: '/seller/reviews',
  sellerNotifications: '/seller/notifications',
  sellerSettings: '/seller/settings',
  shops: '/shops',
  shop: (id: string) => `/shops/${id}`,
  publicSellerProfile: (id: string) => `/sellers/${id}`,
} as const;

export const API_ROUTES = {
  locations: '/api/locations',
  clerkRole: '/api/clerk/role',
  stallImageUpload: '/api/uploads/stall-image',
  productImageUpload: '/api/uploads/product-image',
} as const;

export const ASSET_ROUTES = {
  logo: '/AgriMarketLogo.png',
} as const;
