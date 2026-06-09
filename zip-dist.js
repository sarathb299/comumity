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

  // 4. Recursively read and add files
  // We want files inside dist/ to be at the root of the zip archive.
  // For example, dist/index.html becomes index.html inside the zip.
  console.log('[ZIP ENGINE] Packing files from "dist" recursively into zip root...');
  
  function addDirectoryToZip(localPath, zipFolderPath = '') {
    const items = fs.readdirSync(localPath);
    
    for (const item of items) {
      const fullLocalPath = path.join(localPath, item);
      const stat = fs.statSync(fullLocalPath);
      const zipItemPath = zipFolderPath ? `${zipFolderPath}/${item}` : item;
      
      if (stat.isDirectory()) {
        // Create directory entry and proceed recursively
        zip.addFile(zipItemPath + '/', Buffer.alloc(0));
        addDirectoryToZip(fullLocalPath, zipItemPath);
      } else {
        // Add file
        const fileBuffer = fs.readFileSync(fullLocalPath);
        zip.addFile(zipItemPath, fileBuffer);
        console.log(`  -> Packed: ${zipItemPath} (${(fileBuffer.length / 1024).toFixed(2)} KB)`);
      }
    }
  }

  addDirectoryToZip(distDir);

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
