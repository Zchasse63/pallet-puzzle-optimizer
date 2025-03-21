/**
 * Netlify Environment Setup Script
 * 
 * This script helps configure environment variables for Netlify deployment.
 * Run this script before deploying to ensure all required variables are set.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define required environment variables
const requiredEnvVars = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase URL (e.g., https://kzpatsbjixgtoskfrwzh.supabase.co)',
    default: 'https://kzpatsbjixgtoskfrwzh.supabase.co'
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase Anon Key (from Supabase dashboard)',
    default: ''
  },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    description: 'Your website URL (e.g., https://your-domain.com)',
    default: ''
  },
  {
    key: 'NEXT_PUBLIC_APP_NAME',
    description: 'Application name',
    default: 'Pallet Puzzle Optimizer'
  }
];

// Function to prompt for environment variables
async function promptForEnvVars() {
  const envValues = {};
  
  console.log('\n🔧 Netlify Environment Setup\n');
  console.log('This script will help you configure the necessary environment variables for your Netlify deployment.');
  console.log('These values will be saved to a .env.production file that you can use as reference when configuring Netlify.\n');
  
  for (const envVar of requiredEnvVars) {
    const value = await new Promise(resolve => {
      const defaultPrompt = envVar.default ? ` (default: ${envVar.default})` : '';
      rl.question(`${envVar.key}${defaultPrompt}: `, answer => {
        resolve(answer || envVar.default);
      });
    });
    
    envValues[envVar.key] = value;
  }
  
  return envValues;
}

// Function to generate .env.production file
function generateEnvFile(envValues) {
  const envContent = Object.entries(envValues)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(path.join(__dirname, '..', '.env.production'), envContent);
  console.log('\n✅ .env.production file created successfully!');
}

// Function to generate Netlify CLI commands
function generateNetlifyCommands(envValues) {
  const commands = Object.entries(envValues)
    .map(([key, value]) => `netlify env:set ${key} "${value}"`)
    .join('\n');
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'netlify-env-commands.sh'), 
    `#!/bin/bash\n\n# Run these commands to set up your Netlify environment variables\n\n${commands}`
  );
  
  // Make the file executable
  fs.chmodSync(path.join(__dirname, '..', 'netlify-env-commands.sh'), '755');
  
  console.log('✅ netlify-env-commands.sh script created successfully!');
}

// Function to generate Netlify deployment instructions
function generateDeploymentInstructions() {
  const instructions = `
🚀 Netlify Deployment Instructions

1. Install Netlify CLI (if not already installed):
   npm install -g netlify-cli

2. Login to Netlify:
   netlify login

3. Initialize your Netlify site:
   netlify init

4. Set environment variables:
   - Option 1: Run the generated script:
     ./netlify-env-commands.sh
   
   - Option 2: Set variables manually in the Netlify dashboard:
     Go to Site settings > Build & deploy > Environment > Environment variables

5. Deploy your site:
   netlify deploy --prod

6. Configure custom domain:
   - In the Netlify dashboard, go to Site settings > Domain management
   - Add your custom domain and follow the DNS configuration instructions

For more information, visit: https://docs.netlify.com/
`;

  fs.writeFileSync(path.join(__dirname, '..', 'NETLIFY_DEPLOYMENT.md'), instructions);
  console.log('✅ NETLIFY_DEPLOYMENT.md guide created successfully!');
}

// Main function
async function main() {
  try {
    const envValues = await promptForEnvVars();
    generateEnvFile(envValues);
    generateNetlifyCommands(envValues);
    generateDeploymentInstructions();
    
    console.log('\n🎉 Setup complete! Follow the instructions in NETLIFY_DEPLOYMENT.md to deploy your site.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
  }
}

// Run the script
main();
