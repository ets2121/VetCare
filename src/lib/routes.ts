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
  SUPER_ADMIN: ['/api/super-admin', '/api/branches', '/api/users','/api/users/search','/api/pets'],
  ADMIN: ['/api/branches', '/api/users','/api/users/search','/api/pets'],
  STAFF: ['/api/appointments'],
  CUSTOMER: ['/api/users','/api/branches','/api/users/customer','/api/pets'],
};



// Public pages
export const PUBLIC_PAGES = [
  '/login',
  '/signup',
  '/admin/login',
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
  '/api/admin/login',
    '/api/user/login',
    '/api/user/signup',
    ];

    // APIs that REQUIRE login
    export const PROTECTED_API_PREFIX = '/api';