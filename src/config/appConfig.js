// Centralized application configuration driven by environment variables (.env)
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  hospitalName: import.meta.env.VITE_HOSPITAL_NAME || 'LifeCare Hospital',
  hospitalFullName: import.meta.env.VITE_HOSPITAL_FULL_NAME || 'LifeCare Hospital',
  hospitalTagline: import.meta.env.VITE_HOSPITAL_TAGLINE || 'Health • Care • Together',
  hospitalPhone: import.meta.env.VITE_HOSPITAL_PHONE || '+91 98765 43210',
  hospitalEmail: import.meta.env.VITE_HOSPITAL_EMAIL || 'care@lifecarehospital.com'
};

export default config;
