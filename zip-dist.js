import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');
const zipPath = path.join(process.cwd(), 'dist.zip');

console.log('[ZIP ENGINE] Starting zip creation process...');
console.log(`[ZIP ENGINE] Target Directory: "${distDir}"`);
console.log(`[ZIP ENGINE] Output Archive:   "${zipPath}"`);

// 1. Sanity Check: Ensure dist directory exists and is not empty
if (!fs.existsSync(distDir)) {
  console.error('[ZIP ENGINE] ERROR: The "dist" folder does not exist! Run "npm run build" first to compile the app.');
  process.exit(1);
}

const filesInDist = fs.readdirSync(distDir);
if (filesInDist.length === 0) {
  console.error('[ZIP ENGINE] ERROR: The "dist" folder is empty!');
  process.exit(1);
}

try {
  // 2. Remove existing dist.zip if any
  if (fs.existsSync(zipPath)) {
    console.log('[ZIP ENGINE] Removing existing dist.zip file...');
    fs.unlinkSync(zipPath);
  }

  // 3. Initialize AdmZip instance
  const zip = new AdmZip();

  // 4. Add the dist folder contents directly to zip root
  console.log('[ZIP ENGINE] Packing files from "dist" using native folder compression...');
  zip.addLocalFolder(distDir);

  // 5. Write Zip file
  console.log('[ZIP ENGINE] Writing zip file to disk...');
  zip.writeZip(zipPath);
  
  const finalSize = fs.statSync(zipPath).size;
  console.log(`[ZIP ENGINE] SUCCESS: "${zipPath}" created successfully!`);
  console.log(`[ZIP ENGINE] Total Archive Size: ${(finalSize / 1024 / 1024).toFixed(3)} MB`);

} catch (err) {
  console.error('[ZIP ENGINE] Critical failure during zip creation:', err);
  process.exit(1);
}
