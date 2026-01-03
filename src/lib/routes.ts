// lib/routes.ts

// APIs that DO NOT require login
export const PUBLIC_API_ROUTES = [
  '/api/auth/login',
    '/api/auth/logout',
    ];

    // APIs that REQUIRE login
    export const PROTECTED_API_PREFIX = '/api';