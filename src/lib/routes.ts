// lib/routes.ts

// lib/routes.ts

import { ROLES } from './roles';

export const ROLE_PAGE_ACCESS: Record<string, string[]> = {
  SUPER_ADMIN: ['/super-admin', '/dashboard', '/branches', '/appointments'],
  ADMIN: ['/dashboard', '/branches', '/appointments'],
  STAFF: ['/dashboard', '/appointments'],
  CUSTOMER: ['/dashboard'],
};

export const ROLE_API_ACCESS: Record<string, string[]> = {
  SUPER_ADMIN: ['/api/super-admin', '/api/branch', '/api/appointments'],
  ADMIN: ['/api/branches', '/api/appointments'],
  STAFF: ['/api/appointments'],
  CUSTOMER: ['/api/appointments'],
};



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
  '/admin/login',
  '/users',
];


// APIs that DO NOT require login
export const PUBLIC_API_ROUTES = [
  '/api/admin/login',
    '/api/user/login',
    '/api/user/signup',
    ];

    // APIs that REQUIRE login
    export const PROTECTED_API_PREFIX = '/api';