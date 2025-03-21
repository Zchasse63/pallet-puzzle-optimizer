/**
 * Supabase Storage Setup Script
 * 
 * This script creates storage buckets for the Pallet Puzzle Optimizer app.
 * Run with: node scripts/setup-supabase-storage.js <SERVICE_ROLE_KEY>
 */
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://kzpatsbjixgtoskfrwzh.supabase.co';
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: Service role key is required');
  console.log('Usage: node scripts/setup-supabase-storage.js <SERVICE_ROLE_KEY>');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Define storage buckets to create
const STORAGE_BUCKETS = [
  {
    name: 'quotes',
    public: false,
    allowedMimeTypes: ['application/pdf'],
    fileSizeLimit: 10485760, // 10MB
  },
  {
    name: 'product-images',
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    fileSizeLimit: 5242880, // 5MB
  },
  {
    name: 'assets',
    public: true,
    allowedMimeTypes: ['image/*', 'application/pdf'],
    fileSizeLimit: 20971520, // 20MB
  }
];

/**
 * Create a storage bucket
 */
async function createBucket(bucketConfig) {
  try {
    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase
      .storage
      .listBuckets();
    
    if (listError) {
      console.error(`❌ Error listing buckets: ${listError.message}`);
      return false;
    }
    
    const bucketExists = existingBuckets.some(bucket => bucket.name === bucketConfig.name);
    
    if (bucketExists) {
      console.log(`✅ Bucket '${bucketConfig.name}' already exists`);
      
      // Update bucket configuration
      const { error: updateError } = await supabase
        .storage
        .updateBucket(bucketConfig.name, {
          public: bucketConfig.public,
          fileSizeLimit: bucketConfig.fileSizeLimit,
          allowedMimeTypes: bucketConfig.allowedMimeTypes
        });
      
      if (updateError) {
        console.error(`❌ Error updating bucket '${bucketConfig.name}': ${updateError.message}`);
        return false;
      }
      
      console.log(`✅ Updated bucket '${bucketConfig.name}' configuration`);
      return true;
    }
    
    // Create new bucket
    const { error: createError } = await supabase
      .storage
      .createBucket(bucketConfig.name, {
        public: bucketConfig.public,
        fileSizeLimit: bucketConfig.fileSizeLimit,
        allowedMimeTypes: bucketConfig.allowedMimeTypes
      });
    
    if (createError) {
      console.error(`❌ Error creating bucket '${bucketConfig.name}': ${createError.message}`);
      return false;
    }
    
    console.log(`✅ Created bucket '${bucketConfig.name}'`);
    return true;
  } catch (error) {
    console.error(`❌ Unexpected error with bucket '${bucketConfig.name}':`, error);
    return false;
  }
}

/**
 * Set up storage bucket policies
 */
async function setupBucketPolicies(bucketName, isPublic) {
  try {
    if (isPublic) {
      // For public buckets, we'll create a policy that allows anyone to read files
      const { error } = await supabase.rpc('create_storage_policy', {
        bucket_name: bucketName,
        policy_name: `${bucketName}_public_read`,
        definition: `
          CREATE POLICY "${bucketName}_public_read" 
          ON storage.objects 
          FOR SELECT 
          USING (bucket_id = '${bucketName}');
        `
      });
      
      if (error) {
        console.log(`⚠️ Could not create public read policy for '${bucketName}': ${error.message}`);
        console.log('You may need to configure this policy manually in the Supabase dashboard');
      } else {
        console.log(`✅ Created public read policy for '${bucketName}'`);
      }
    }
    
    // Create policy for authenticated users to upload files
    const { error: authError } = await supabase.rpc('create_storage_policy', {
      bucket_name: bucketName,
      policy_name: `${bucketName}_auth_insert`,
      definition: `
        CREATE POLICY "${bucketName}_auth_insert" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = '${bucketName}' AND auth.role() = 'authenticated');
      `
    });
    
    if (authError) {
      console.log(`⚠️ Could not create auth insert policy for '${bucketName}': ${authError.message}`);
      console.log('You may need to configure this policy manually in the Supabase dashboard');
    } else {
      console.log(`✅ Created authenticated upload policy for '${bucketName}'`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error setting up policies for '${bucketName}':`, error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Supabase storage setup...');
  
  let success = true;
  
  // Create each bucket
  for (const bucketConfig of STORAGE_BUCKETS) {
    const bucketCreated = await createBucket(bucketConfig);
    
    if (bucketCreated) {
      // Set up policies for the bucket
      await setupBucketPolicies(bucketConfig.name, bucketConfig.public);
    } else {
      success = false;
    }
  }
  
  if (success) {
    console.log('\n✨ Storage setup completed successfully!');
    console.log('\nStorage buckets created:');
    STORAGE_BUCKETS.forEach(bucket => {
      console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    console.log('\nUsage in your application:');
    console.log(`
    // Upload a file
    const { data, error } = await supabase
      .storage
      .from('quotes')
      .upload('filename.pdf', fileData);
    
    // Get a private file URL (with expiry)
    const { data } = await supabase
      .storage
      .from('quotes')
      .createSignedUrl('filename.pdf', 60); // expires in 60 seconds
    
    // Get a public file URL
    const { data } = supabase
      .storage
      .from('product-images')
      .getPublicUrl('image.png');
    `);
  } else {
    console.log('\n⚠️ Some storage buckets could not be created or configured.');
    console.log('Please check the error messages above and consider configuring them manually in the Supabase dashboard.');
  }
  
  console.log('\n🔒 IMPORTANT: Do not commit or share your service role key!');
}

// Execute the script
main();
