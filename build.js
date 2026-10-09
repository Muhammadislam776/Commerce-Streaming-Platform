/**
 * Build Script for Vercel & Production Deployment
 * Copies frontend HTML and static assets to distribution directories
 */
const fs = require('fs');
const path = require('path');

const srcHtml = path.join(__dirname, 'public', 'live-room-preview.html');

if (!fs.existsSync(srcHtml)) {
  console.error('Source HTML not found:', srcHtml);
  process.exit(1);
}

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy to dist/index.html and dist/live-room-preview.html
fs.copyFileSync(srcHtml, path.join(distDir, 'index.html'));
fs.copyFileSync(srcHtml, path.join(distDir, 'live-room-preview.html'));

// Copy to public/index.html
fs.copyFileSync(srcHtml, path.join(__dirname, 'public', 'index.html'));

// Copy to root index.html
fs.copyFileSync(srcHtml, path.join(__dirname, 'index.html'));

console.log('✓ Build step successful: Static assets and index.html generated for Vercel deployment.');
