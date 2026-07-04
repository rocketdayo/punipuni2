import fs from 'fs';
import path from 'path';

const urls = [
  "https://game8.jp/punipuni/35821", // S?
  "https://game8.jp/punipuni/35822", // A?
  "https://game8.jp/punipuni/36046", // B?
  "https://game8.jp/punipuni/38321", // C?
  "https://game8.jp/punipuni/38521", // D?
  "https://game8.jp/punipuni/38669"  // E?
];

const ranks = ['S', 'A', 'B', 'C', 'D', 'E'];

async function run() {
  const imagesByRank = {};
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const rank = ranks[i];
    imagesByRank[rank] = [];
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      console.log(`[${rank}] Title:`, titleMatch ? titleMatch[1] : "Not found");
      
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const imgUrl = match[1];
        if (imgUrl.includes('img.game8.jp') && !imgUrl.match(/\d{4}-\d{2}-\d{2}/)) {
          if (!imagesByRank[rank].includes(imgUrl) && !imgUrl.includes('thumb')) {
             imagesByRank[rank].push(imgUrl);
             if (imagesByRank[rank].length >= 10) break;
          }
        }
      }
      
      console.log(`[${rank}] Found ${imagesByRank[rank].length} images`);
      // Download them
      for (let j = 0; j < imagesByRank[rank].length; j++) {
        try {
           const imgRes = await fetch(imagesByRank[rank][j]);
           const buffer = await imgRes.arrayBuffer();
           const savePath = path.join(process.cwd(), `public`, `puni_${rank.toLowerCase()}_${j+1}.png`);
           fs.writeFileSync(savePath, Buffer.from(buffer));
        } catch(e) {}
      }

    } catch (e) {
      console.error(e);
    }
  }
  fs.writeFileSync('downloaded_images.json', JSON.stringify(imagesByRank, null, 2));
}
run();
