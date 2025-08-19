#!/usr/bin/env node

/**
 * Script to validate that .env.example is properly maintained and in sync with code requirements
 * This can be run as part of CI/CD pipeline or during development
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_EXAMPLE_PATH = path.join(__dirname, '..', '.env.example');
const ENV_CONFIG_PATH = path.join(__dirname, '..', 'src', 'config', 'env.ts');

/**
 * Required environment variables that must be documented
 */
const REQUIRED_VARIABLES = [
  // Supabase configuration
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  
  // Environment credentials configuration
  'VITE_AUTH_ENV_ENABLED',
  'VITE_AUTH_ENV_AUTO_SIGNIN',
  'VITE_AUTH_ENV_ALLOW_FALLBACK',
  'VITE_AUTH_ENV_STRICT_MODE',
  'VITE_AUTH_ENV_ACCOUNTS',
];

/**
 * Account variable patterns that should be documented
 */
const ACCOUNT_VARIABLE_PATTERNS = [
  'VITE_AUTH_ENV_ACCOUNT_*_EMAIL',
  'VITE_AUTH_ENV_ACCOUNT_*_PASSWORD',
  'VITE_AUTH_ENV_ACCOUNT_*_ROLE',
];

/**
 * Required documentation sections
 */
const REQUIRED_SECTIONS = [
  'Supabase Configuration',
  'Environment Credentials Configuration',
  'Account configurations',
  'Security Notes:',
  'Use Cases:',
];

function validateEnvExample() {
  console.log('🔍 Validating .env.example file...');
  
  let hasErrors = false;
  const errors = [];
  const warnings = [];

  // Check if .env.example exists
  if (!fs.existsSync(ENV_EXAMPLE_PATH)) {
    errors.push('❌ .env.example file not found');
    hasErrors = true;
  } else {
    const envExampleContent = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
    
    // Check required variables
    console.log('📋 Checking required variables...');
    for (const variable of REQUIRED_VARIABLES) {
      if (!envExampleContent.includes(`${variable}=`)) {
        errors.push(`❌ Missing required variable: ${variable}`);
        hasErrors = true;
      } else {
        console.log(`✅ Found: ${variable}`);
      }
    }
    
    // Check account variable examples
    console.log('👤 Checking account variable examples...');
    const hasAdminExample = envExampleContent.includes('VITE_AUTH_ENV_ACCOUNT_ADMIN_EMAIL=');
    const hasTestUserExample = envExampleContent.includes('VITE_AUTH_ENV_ACCOUNT_TESTUSER_EMAIL=');
    
    if (!hasAdminExample) {
      errors.push('❌ Missing admin account example');
      hasErrors = true;
    } else {
      console.log('✅ Found admin account example');
    }
    
    if (!hasTestUserExample) {
      errors.push('❌ Missing test user account example');
      hasErrors = true;
    } else {
      console.log('✅ Found test user account example');
    }
    
    // Check required sections
    console.log('📚 Checking documentation sections...');
    for (const section of REQUIRED_SECTIONS) {
      if (!envExampleContent.includes(section)) {
        errors.push(`❌ Missing documentation section: ${section}`);
        hasErrors = true;
      } else {
        console.log(`✅ Found section: ${section}`);
      }
    }
    
    // Check for security best practices
    console.log('🔒 Checking security best practices...');
    if (!envExampleContent.includes('Never commit actual credentials')) {
      warnings.push('⚠️  Missing warning about not committing credentials');
    }
    
    if (!envExampleContent.includes('strong and unique')) {
      warnings.push('⚠️  Missing guidance about strong passwords');
    }
    
    // Check for use case examples
    console.log('💡 Checking use case examples...');
    const useCases = ['Development:', 'Testing:', 'Production:'];
    for (const useCase of useCases) {
      if (!envExampleContent.includes(useCase)) {
        warnings.push(`⚠️  Missing use case example: ${useCase}`);
      }
    }
    
    // Check for proper formatting
    console.log('📝 Checking formatting...');
    const lines = envExampleContent.split('\n');
    const commentLines = lines.filter(line => line.trim().startsWith('#'));
    
    if (commentLines.length < 20) {
      warnings.push('⚠️  Insufficient documentation comments (should have substantial documentation)');
    }
    
    // Check for consistent account naming in ACCOUNTS list
    const accountsMatch = envExampleContent.match(/VITE_AUTH_ENV_ACCOUNTS=([^\n\r]+)/);
    if (accountsMatch) {
      const accountNames = accountsMatch[1].split(',').map(name => name.trim());
      console.log(`📋 Found ${accountNames.length} accounts in ACCOUNTS list: ${accountNames.join(', ')}`);
      
      for (const accountName of accountNames) {
        const upperAccountName = accountName.toUpperCase();
        if (!envExampleContent.includes(`VITE_AUTH_ENV_ACCOUNT_${upperAccountName}_EMAIL=`)) {
          errors.push(`❌ Missing EMAIL variable for account: ${accountName}`);
          hasErrors = true;
        }
        if (!envExampleContent.includes(`VITE_AUTH_ENV_ACCOUNT_${upperAccountName}_PASSWORD=`)) {
          errors.push(`❌ Missing PASSWORD variable for account: ${accountName}`);
          hasErrors = true;
        }
      }
    }
  }
  
  // Print results
  console.log('\n📊 Validation Results:');
  console.log('='.repeat(50));
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(error => console.log(`  ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  if (!hasErrors && warnings.length === 0) {
    console.log('\n🎉 All checks passed! .env.example is properly maintained.');
  } else if (!hasErrors) {
    console.log('\n✅ No errors found, but there are some warnings to consider.');
  } else {
    console.log('\n💥 Validation failed! Please fix the errors above.');
  }
  
  console.log('\n📋 Summary:');
  console.log(`  - Errors: ${errors.length}`);
  console.log(`  - Warnings: ${warnings.length}`);
  console.log(`  - Status: ${hasErrors ? 'FAILED' : 'PASSED'}`);
  
  // Exit with appropriate code
  process.exit(hasErrors ? 1 : 0);
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateEnvExample();
}

export { validateEnvExample };
