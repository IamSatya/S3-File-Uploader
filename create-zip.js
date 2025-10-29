import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const zip = new JSZip();

// Files and directories to exclude
const excludePatterns = [
  'node_modules',
  '.git',
  'dist',
  '.replit',
  'replit.nix',
  '.config',
  'logs',
  'tmp',
  '.env',
  '.cache',
  '.local',
  '.upm',
  'attached_assets',
  'create-zip.js',
  'hackfiles-deployment.zip',
  'download.html',
  /\.log$/,
];

// Critical config files that must be included
const criticalFiles = [
  'vite.config.ts',
  'tsconfig.json',
  'drizzle.config.ts',
  'tailwind.config.ts',
  'postcss.config.js',
  'ecosystem.config.js',
  'package.json',
  'package-lock.json',
];

function shouldExclude(filePath) {
  // Never exclude critical config files
  const fileName = path.basename(filePath);
  if (criticalFiles.includes(fileName)) {
    return false;
  }

  return excludePatterns.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function addDirectoryToZip(dirPath, zipFolder) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const relativePath = path.relative(__dirname, filePath);

    if (shouldExclude(relativePath)) {
      return;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      addDirectoryToZip(filePath, zipFolder);
    } else {
      const content = fs.readFileSync(filePath);
      zip.file(relativePath, content);
      console.log(`Added: ${relativePath}`);
    }
  });
}

console.log('Creating HackFiles deployment ZIP...\n');

// Add all files
addDirectoryToZip(__dirname, zip);

// Generate ZIP
zip.generateAsync({ type: 'nodebuffer' }).then(content => {
  const outputPath = path.join(__dirname, 'hackfiles-deployment.zip');
  fs.writeFileSync(outputPath, content);
  
  const stats = fs.statSync(outputPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`\n✅ ZIP file created successfully!`);
  console.log(`📦 File: hackfiles-deployment.zip`);
  console.log(`📊 Size: ${fileSizeInMB} MB`);
  console.log(`\nYou can now download this file and deploy it to your server.`);
});
