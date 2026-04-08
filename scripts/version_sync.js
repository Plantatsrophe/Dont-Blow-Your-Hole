import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * VERSION SYNC UTILITY
 * --------------------
 * This script is executed during 'npm run build' to automate the 
 * cache-busting lifecycle of the Progressive Web App (PWA).
 * 
 * Logic Flow:
 * 1. Reads the current version (v=XXX) from index.html.
 * 2. Increments the version integer.
 * 3. Globally replaces all 'v=XXX' tags in index.html and sw.js.
 * 4. Regenerates the CACHE_NAME and Timestamp in sw.js to 
 *    trigger a Service Worker update on the client.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexHtmlPath = path.resolve(__dirname, '../index.html');
const swJsPath = path.resolve(__dirname, '../sw.js');

try {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

    // Find the current version from index.html (first occurrence of v=XXX)
    const versionMatch = indexHtml.match(/v=(\d+)/);
    if (!versionMatch) {
        console.error('CRITICAL: Could not find version tag (v=XXX) in index.html');
        process.exit(1);
    }

    const currentVersion = parseInt(versionMatch[1], 10);
    const nextVersion = currentVersion + 1;
    const nextTag = `v=${nextVersion}`;

    console.log(`[Version Sync] Bumping version from v${currentVersion} to v${nextVersion}...`);

    // 1. Update index.html (all instances of v=XXX)
    indexHtml = indexHtml.replace(/v=\d+/g, nextTag);
    fs.writeFileSync(indexHtmlPath, indexHtml);
    console.log(`[Version Sync] Updated index.html with ${nextTag}`);

    // 2. Update sw.js (Manifest, Cache name, and Timestamp)
    if (fs.existsSync(swJsPath)) {
        let swJs = fs.readFileSync(swJsPath, 'utf8');
        
        // --- MANIFEST AUTOMATION ---
        // Dynamically crawl the dist folder to ensure every script is cached
        const distPath = path.resolve(__dirname, '../src/dist');
        const getFilesRecursive = (dir) => {
            let results = [];
            const list = fs.readdirSync(dir);
            list.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat && stat.isDirectory()) {
                    results = results.concat(getFilesRecursive(fullPath));
                } else if (file.endsWith('.js')) {
                    const relPath = './' + path.relative(path.resolve(__dirname, '..'), fullPath).replace(/\\/g, '/');
                    results.push(relPath);
                }
            });
            return results;
        };

        const dynamicAssets = getFilesRecursive(distPath);
        const staticAssets = [
            './',
            './index.html',
            './manifest.json',
            './style.css',
            './src/assets/images/icon.svg',
            './src/assets/images/logo.png'
        ];

        const allAssets = [...staticAssets, ...dynamicAssets].map(path => `  '${path}?v=${nextVersion}'`);
        const manifestString = allAssets.join(',\n');
        
        // Inject into the array between markers
        const manifestRegex = /\/\* --- MANIFEST START --- \*\/[\s\S]*?\/\* --- MANIFEST END --- \*\//;
        swJs = swJs.replace(manifestRegex, `/* --- MANIFEST START --- */\n${manifestString}\n/* --- MANIFEST END --- */`);

        // Update all v=XXX in the rest of the file
        swJs = swJs.replace(/v=\d+/g, nextTag);

        // Update Cache Name Pattern
        swJs = swJs.replace(/platformer-cache-v\d+/g, `platformer-cache-v${nextVersion}`);
        
        // Update Timestamp
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        swJs = swJs.replace(/\/\/ Cache-Busting Timestamp: .+/g, `// Cache-Busting Timestamp: ${timestamp}`);

        fs.writeFileSync(swJsPath, swJs);
        console.log(`[Version Sync] Updated sw.js with ${dynamicAssets.length} dynamic assets and ${staticAssets.length} static assets.`);
    } else {
        console.warn(`[Version Sync] Warning: sw.js not found at ${swJsPath}`);
    }

    console.log('[Version Sync] Success! All versions are synchronized.');

} catch (error) {
    console.error('[Version Sync] Failed to synchronize versions:', error.message);
    process.exit(1);
}
