import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', 'node_modules', 'cryptocurrency-icons', 'svg', 'color');
const targetDir = path.join(__dirname, '..', 'public', 'icons', 'tokens');

/**
 * Synchronizes cryptocurrency icons from the NPM package to the public folder.
 */
function syncIcons () {
  console.log('🪙 Syncing cryptocurrency icons…');

  // Check if source directory exists.
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  // Create target directory if it doesn't exist.
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`📁 Created target directory: ${targetDir}`);
  }

  let copiedCount = 0;
  let skippedCount = 0;

  try {
    // Read all SVG files from the source.
    const files = fs.readdirSync(sourceDir).filter(file => file.endsWith('.svg'));

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);

      // Check if we need to copy (file doesn't exist or source is newer).
      let shouldCopy = true;

      if (fs.existsSync(targetPath)) {
        const sourceStats = fs.statSync(sourcePath);
        const targetStats = fs.statSync(targetPath);
        shouldCopy = sourceStats.mtime > targetStats.mtime;
      }

      if (shouldCopy) {
        fs.copyFileSync(sourcePath, targetPath);
        copiedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('✅ Icon sync complete:');
    console.log(`   📋 ${files.length} total icons available`);
    console.log(`   📥 ${copiedCount} icons copied/updated`);
    console.log(`   ⏭️  ${skippedCount} icons skipped (up to date)`);

  } catch (error) {
    console.error('❌ Error syncing icons:', error.message);
    process.exit(1);
  }
}

syncIcons();
