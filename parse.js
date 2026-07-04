import fs from 'fs';

const html = fs.readFileSync('game8.html', 'utf-8');
const titleMatch = html.match(/<title>(.*?)<\/title>/);
console.log("Title:", titleMatch ? titleMatch[1] : "Not found");

// Find all img tags and print first 5 with game8.jp that are not ui elements
const imgRegex = /<img[^>]+src="([^">]+)"/g;
let match;
let count = 0;
while ((match = imgRegex.exec(html)) !== null) {
  const url = match[1];
  if (url.includes('img.game8.jp') && !url.match(/\d{4}-\d{2}-\d{2}/)) {
    console.log("Possible char image:", url);
    count++;
    if (count > 5) break;
  }
}
