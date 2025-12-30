export function getBrandName() {
  return process.env.NEXT_PUBLIC_BRAND_NAME || 'Pet Grooming'; // Fallback brand name
}
