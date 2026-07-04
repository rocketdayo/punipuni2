import fs from 'fs';

const html = fs.readFileSync('game8.html', 'utf-8');
const imgRegex = /<img[^>]+src="([^">]+)"/g;
let match;
const urls = new Set();
while ((match = imgRegex.exec(html)) !== null) {
  urls.add(match[1]);
}
fs.writeFileSync('images.json', JSON.stringify(Array.from(urls), null, 2));
console.log("Extracted images to images.json");
