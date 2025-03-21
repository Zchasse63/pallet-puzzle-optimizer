import { supabase } from '../lib/supabase';

/**
 * This script sets up demo data in the Supabase database for the Pallet Puzzle Optimizer
 * It creates the necessary tables and populates them with realistic demo data
 */

// Define the tables to be created
const createTables = async () => {
  console.log('Creating tables if they don\'t exist...');
  
  try {
    // Products table
    console.log('Creating products table...');
    const { error: productsError } = await supabase.from('products').select('id').limit(1);
    
    if (productsError && productsError.code === '42P01') { // Table doesn't exist
      const { error } = await supabase.from('products').insert({
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Temporary Row',
        sku: 'TEMP-0000',
        description: 'Temporary row for table creation',
        price: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        weight: 0,
        unitsPerPallet: 0
      });
      
      if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error('Failed to create products table:', error);
        return false;
      }
    }
    
    // Quotes table
    console.log('Creating quotes table...');
    const { error: quotesError } = await supabase.from('quotes').select('id').limit(1);
    
    if (quotesError && quotesError.code === '42P01') { // Table doesn't exist
      const { error } = await supabase.from('quotes').insert({
        id: '00000000-0000-0000-0000-000000000000',
        quote_number: 'TEMP-0000',
        status: 'draft',
        products: [],
        container_utilization: 0,
        total_pallets: 0,
        expires_at: new Date().toISOString()
      });
      
      if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error('Failed to create quotes table:', error);
        return false;
      }
    }
    
    // Email logs table
    console.log('Creating email_logs table...');
    const { error: logsError } = await supabase.from('email_logs').select('id').limit(1);
    
    if (logsError && logsError.code === '42P01') { // Table doesn't exist
      // For email_logs, we need to ensure the quotes table exists first
      const { data: quotes } = await supabase.from('quotes').select('id').limit(1);
      
      if (quotes && quotes.length > 0) {
        const { error } = await supabase.from('email_logs').insert({
          id: '00000000-0000-0000-0000-000000000000',
          quote_id: quotes[0].id,
          recipient_email: 'temp@example.com',
          subject: 'Temporary Email',
          status: 'sent'
        });
        
        if (error && error.code !== '23505') { // Ignore duplicate key error
          console.error('Failed to create email_logs table:', error);
          return false;
        }
      } else {
        console.warn('Could not create email_logs table: quotes table is empty');
      }
    }
    
    // Clean up temporary rows
    await supabase.from('products').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('quotes').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('email_logs').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('Tables created successfully!');
    return true;
  } catch (err) {
    console.error('Error creating tables:', err);
    return false;
  }
};

// Generate demo products data
const demoProducts = [
  {
    name: 'Standard Cardboard Box',
    sku: 'BOX-STD-001',
    description: 'Standard corrugated cardboard box suitable for most shipping needs.',
    price: 2.99,
    dimensions: { length: 30, width: 20, height: 15 },
    weight: 0.5,
    unitsPerPallet: 50
  },
  {
    name: 'Heavy Duty Shipping Box',
    sku: 'BOX-HD-002',
    description: 'Reinforced cardboard box designed for heavier items up to 25kg.',
    price: 4.99,
    dimensions: { length: 40, width: 30, height: 25 },
    weight: 0.8,
    unitsPerPallet: 50
  },
  {
    name: 'Small Mailer Box',
    sku: 'BOX-SM-003',
    description: 'Compact box perfect for small items and e-commerce shipping.',
    price: 1.99,
    dimensions: { length: 20, width: 15, height: 10 },
    weight: 0.3,
    unitsPerPallet: 50
  },
  {
    name: 'Document Shipping Box',
    sku: 'BOX-DOC-004',
    description: 'Flat box designed specifically for documents and paperwork.',
    price: 2.49,
    dimensions: { length: 35, width: 25, height: 5 },
    weight: 0.4,
    unitsPerPallet: 50
  },
  {
    name: 'Insulated Shipping Box',
    sku: 'BOX-INS-005',
    description: 'Thermally insulated box for temperature-sensitive items.',
    price: 6.99,
    dimensions: { length: 35, width: 25, height: 20 },
    weight: 1.2,
    unitsPerPallet: 50
  },
  {
    name: 'Tall Storage Box',
    sku: 'BOX-TL-006',
    description: 'Tall box ideal for storing longer items vertically.',
    price: 3.99,
    dimensions: { length: 30, width: 30, height: 50 },
    weight: 0.9,
    unitsPerPallet: 50
  },
  {
    name: 'Cube Box',
    sku: 'BOX-CB-007',
    description: 'Perfect cube-shaped box for even weight distribution.',
    price: 3.49,
    dimensions: { length: 25, width: 25, height: 25 },
    weight: 0.6,
    unitsPerPallet: 50
  },
  {
    name: 'Extra Large Moving Box',
    sku: 'BOX-XL-008',
    description: 'Oversized box for moving or shipping large items.',
    price: 7.99,
    dimensions: { length: 60, width: 45, height: 40 },
    weight: 1.5,
    unitsPerPallet: 50
  },
  {
    name: 'Display Box with Window',
    sku: 'BOX-DW-009',
    description: 'Retail display box with transparent window.',
    price: 4.49,
    dimensions: { length: 30, width: 20, height: 15 },
    weight: 0.5,
    unitsPerPallet: 50
  },
  {
    name: 'Shipping Tube',
    sku: 'TUBE-ST-010',
    description: 'Cylindrical tube for posters, blueprints and documents.',
    price: 3.29,
    dimensions: { length: 90, width: 10, height: 10 },
    weight: 0.4,
    unitsPerPallet: 50
  },
  {
    name: 'Book Mailer Box',
    sku: 'BOX-BK-011',
    description: 'Specially designed for shipping books and media.',
    price: 2.79,
    dimensions: { length: 30, width: 22, height: 5 },
    weight: 0.4,
    unitsPerPallet: 50
  },
  {
    name: 'Wardrobe Box',
    sku: 'BOX-WD-012',
    description: 'Tall box with hanging rail for clothing transport.',
    price: 9.99,
    dimensions: { length: 50, width: 45, height: 120 },
    weight: 2.0,
    unitsPerPallet: 50
  }
];

// Generate demo quotes data
const generateDemoQuotes = (productIds: string[]) => {
  const statuses = ['draft', 'sent', 'accepted', 'rejected'];
  const quotes = [];
  
  for (let i = 0; i < 5; i++) {
    // Select 2-5 random products for this quote
    const numProducts = Math.floor(Math.random() * 4) + 2;
    const shuffledIds = [...productIds].sort(() => 0.5 - Math.random());
    const selectedProductIds = shuffledIds.slice(0, numProducts);
    
    // Create product entries for the quote
    const products = selectedProductIds.map(productId => ({
      product_id: productId,
      quantity: Math.floor(Math.random() * 10) + 1,
      price: (Math.random() * 5 + 1).toFixed(2)
    }));
    
    // Calculate a realistic container utilization
    const containerUtilization = (Math.random() * 0.3 + 0.6).toFixed(2);
    
    quotes.push({
      quote_number: `Q-${Date.now()}-${i}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      products,
      container_utilization: containerUtilization,
      total_pallets: Math.ceil(products.reduce((sum, p) => sum + p.quantity, 0) / 50),
      expires_at: new Date(Date.now() + (30 + i * 5) * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return quotes;
};

// Generate demo email logs
const generateEmailLogs = (quoteIds: string[]) => {
  const statuses = ['sent', 'delivered', 'failed'];
  const emails = ['customer@example.com', 'buyer@company.org', 'shipping@business.net'];
  const logs = [];
  
  for (const quoteId of quoteIds) {
    // Each quote might have 0-3 email logs
    const numLogs = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numLogs; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      logs.push({
        quote_id: quoteId,
        recipient_email: emails[Math.floor(Math.random() * emails.length)],
        subject: `Your Quote #${quoteId.substring(0, 8)}`,
        status,
        error_message: status === 'failed' ? 'SMTP server connection timeout' : null,
        sent_at: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }
  
  return logs;
};

// Insert demo data
const insertDemoData = async () => {
  console.log('Inserting demo products...');
  
  // Check if products already exist
  const { data: existingProducts } = await supabase
    .from('products')
    .select('id')
    .limit(1);
  
  let productIds: string[] = [];
  
  if (!existingProducts || existingProducts.length === 0) {
    // Insert products
    const { data: products, error } = await supabase
      .from('products')
      .insert(demoProducts)
      .select('id');
    
    if (error) {
      console.error('Error inserting products:', error);
      return false;
    }
    
    console.log(`Inserted ${products.length} products`);
    productIds = products.map(p => p.id);
  } else {
    console.log('Products already exist, skipping insertion');
    
    // Get existing product IDs
    const { data: products } = await supabase
      .from('products')
      .select('id');
    
    productIds = products?.map(p => p.id) || [];
  }
  
  // Check if quotes already exist
  const { data: existingQuotes } = await supabase
    .from('quotes')
    .select('id')
    .limit(1);
  
  let quoteIds: string[] = [];
  
  if (!existingQuotes || existingQuotes.length === 0) {
    console.log('Inserting demo quotes...');
    
    // Generate and insert quotes
    const demoQuotes = generateDemoQuotes(productIds);
    const { data: quotes, error } = await supabase
      .from('quotes')
      .insert(demoQuotes)
      .select('id');
    
    if (error) {
      console.error('Error inserting quotes:', error);
      return false;
    }
    
    console.log(`Inserted ${quotes.length} quotes`);
    quoteIds = quotes.map(q => q.id);
  } else {
    console.log('Quotes already exist, skipping insertion');
    
    // Get existing quote IDs
    const { data: quotes } = await supabase
      .from('quotes')
      .select('id');
    
    quoteIds = quotes?.map(q => q.id) || [];
  }
  
  // Check if email logs already exist
  const { data: existingLogs } = await supabase
    .from('email_logs')
    .select('id')
    .limit(1);
  
  if (!existingLogs || existingLogs.length === 0) {
    console.log('Inserting demo email logs...');
    
    // Generate and insert email logs
    const demoLogs = generateEmailLogs(quoteIds);
    
    if (demoLogs.length > 0) {
      const { data: logs, error } = await supabase
        .from('email_logs')
        .insert(demoLogs)
        .select('id');
      
      if (error) {
        console.error('Error inserting email logs:', error);
        return false;
      }
      
      console.log(`Inserted ${logs.length} email logs`);
    } else {
      console.log('No email logs to insert');
    }
  } else {
    console.log('Email logs already exist, skipping insertion');
  }
  
  return true;
};

// Main function to run the setup
const setupDemoData = async () => {
  console.log('Setting up demo data for Pallet Puzzle Optimizer...');
  
  // Create tables
  const tablesCreated = await createTables();
  if (!tablesCreated) {
    console.error('Failed to create tables. Aborting setup.');
    return;
  }
  
  // Insert demo data
  const dataInserted = await insertDemoData();
  if (!dataInserted) {
    console.error('Failed to insert demo data.');
    return;
  }
  
  console.log('Demo data setup completed successfully!');
};

// Execute the setup
setupDemoData().catch(err => {
  console.error('Error setting up demo data:', err);
});

export default setupDemoData;
