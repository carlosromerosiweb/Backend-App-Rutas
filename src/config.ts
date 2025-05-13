import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Export configuration variables
export const config = {
  // Server configuration
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'default_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Google Calendar configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,

  // Google Maps API configuration (usada también para Places API)
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
}

// Validate required configuration
const requiredEnvVars = [
  'DATABASE_URL', 
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'GOOGLE_MAPS_API_KEY'
];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}
