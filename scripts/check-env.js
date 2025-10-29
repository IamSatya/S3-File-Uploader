#!/usr/bin/env node

/**
 * Script to validate environment variables before deployment
 * Usage: node scripts/check-env.js
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET_NAME',
];

console.log('🔍 Checking environment variables...\n');

let hasErrors = false;

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ Missing: ${varName}`);
    hasErrors = true;
  } else {
    const value = process.env[varName];
    const displayValue = varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASSWORD')
      ? '[hidden]'
      : value.length > 50
      ? value.substring(0, 47) + '...'
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('');

if (hasErrors) {
  console.error('❌ Some required environment variables are missing.');
  console.error('Please check your .env file or environment configuration.\n');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!\n');
  
  // Additional checks
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    console.warn('⚠️  Warning: SESSION_SECRET should be at least 32 characters for production');
  }
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`ℹ️  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  }
  
  process.exit(0);
}
