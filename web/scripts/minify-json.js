import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const showsFile = path.join(distDir, 'shows.json');

console.log('Minifying shows.json...');

if (fs.existsSync(showsFile)) {
    try {
        const content = fs.readFileSync(showsFile, 'utf-8');
        const json = JSON.parse(content);
        const minified = JSON.stringify(json);
        fs.writeFileSync(showsFile, minified);
        console.log('Successfully minified shows.json');

        // Log size reduction
        const originalSize = Buffer.byteLength(content, 'utf8');
        const minifiedSize = Buffer.byteLength(minified, 'utf8');
        const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
        console.log(`Size reduced from ${originalSize} to ${minifiedSize} bytes (${reduction}%)`);

    } catch (error) {
        console.error('Error minifying shows.json:', error);
        process.exit(1);
    }
} else {
    console.log('shows.json not found in dist directory. Skipping minification.');
}
