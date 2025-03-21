#!/usr/bin/env ts-node
import setupDemoData from './setup-demo-data';

// This script is a simple wrapper to run the setup-demo-data script
console.log('Starting Supabase demo data setup...');
setupDemoData()
  .then(() => {
    console.log('Setup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
