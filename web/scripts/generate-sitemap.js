
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const showsFile = path.join(distDir, 'shows.json');
const sitemapFile = path.join(distDir, 'sitemap.xml');

const BASE_URL = 'https://fredbourni.github.io/prr-archives';

console.log('Generating sitemap.xml...');

if (fs.existsSync(showsFile)) {
    try {
        const content = fs.readFileSync(showsFile, 'utf-8');
        const shows = JSON.parse(content);

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Add root URL
        xml += '  <url>\n';
        xml += `    <loc>${BASE_URL}/</loc>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>1.0</priority>\n';
        xml += '  </url>\n';

        // Add stats URL
        xml += '  <url>\n';
        xml += `    <loc>${BASE_URL}/?stats=1</loc>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';

        // Add show URLs
        shows.forEach(show => {
            if (show.slug) {
                xml += '  <url>\n';
                xml += `    <loc>${BASE_URL}/?show=${show.slug}</loc>\n`;
                // Use created_time if available, otherwise default to monthly
                if (show.created_time) {
                    xml += `    <lastmod>${show.created_time}</lastmod>\n`;
                }
                xml += '    <changefreq>yearly</changefreq>\n';
                xml += '    <priority>0.7</priority>\n';
                xml += '  </url>\n';
            }
        });

        xml += '</urlset>';

        fs.writeFileSync(sitemapFile, xml);
        console.log(`Successfully generated sitemap.xml with ${shows.length + 2} URLs`);

    } catch (error) {
        console.error('Error generating sitemap.xml:', error);
        process.exit(1);
    }
} else {
    console.error('shows.json not found in dist directory. Cannot generate sitemap.');
    process.exit(1);
}
