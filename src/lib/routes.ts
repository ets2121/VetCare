// lib/routes.ts

// lib/routes.ts

// Public pages
export const PUBLIC_PAGES = [
  '/login',
  '/signup',
];

// Pages that REQUIRE login
export const PROTECTED_PAGE_PREFIXES = [
  '/dashboard',
  '/branches',
  '/appointments',
  '/super-admin',
  '/admin',
  '/users',
];


// APIs that DO NOT require login
export const PUBLIC_API_ROUTES = [
  '/api/auth/login',
    '/api/auth/logout',
    ];

    // APIs that REQUIRE login
    export const PROTECTED_API_PREFIX = '/api';