/**
 * Script to generate a CSV file from the demo product data
 * Run with: node scripts/generate-products-csv.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Demo products data (copied from SupabaseDemo.tsx)
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
  }
];

// Generate CSV header
const headers = ['name', 'sku', 'description', 'price', 'dimensions', 'weight', 'unitsPerPallet'];
const csvHeader = headers.join(',');

// Generate CSV rows
const csvRows = demoProducts.map(product => {
  // Escape any commas in the description
  const escapedDescription = product.description.includes(',') 
    ? `"${product.description}"` 
    : product.description;
  
  // Format dimensions as a JSON string and escape it
  const dimensionsJson = JSON.stringify(product.dimensions);
  const escapedDimensions = `"${dimensionsJson}"`;
  
  return [
    product.name,
    product.sku,
    escapedDescription,
    product.price,
    escapedDimensions,
    product.weight,
    product.unitsPerPallet
  ].join(',');
});

// Combine header and rows
const csvContent = [csvHeader, ...csvRows].join('\n');

// Write to file
const outputDir = path.join(__dirname, '..', 'data');
const outputFile = path.join(outputDir, 'products.csv');

// Ensure the directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, csvContent);

console.log(`CSV file generated at: ${outputFile}`);
