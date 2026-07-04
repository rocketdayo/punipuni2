import fs from 'fs';
import path from 'path';

const urls = [
  "https://game8.jp/punipuni/38669",
  "https://game8.jp/punipuni/38521",
  "https://game8.jp/punipuni/38321",
  "https://game8.jp/punipuni/36046",
  "https://game8.jp/punipuni/35822",
  "https://game8.jp/punipuni/35821"
];

async function run() {
  console.log("Downloading character images from game8...");
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const html = await res.text();
      
      // Look for the main character image (usually og:image)
      const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
      if (ogMatch && ogMatch[1]) {
        const imgUrl = ogMatch[1];
        console.log(`[${i+1}] Found image: ${imgUrl}`);
        
        const imgRes = await fetch(imgUrl);
        const buffer = await imgRes.arrayBuffer();
        
        const savePath = path.join(process.cwd(), `public`, `puni_s_${i+1}.png`);
        fs.writeFileSync(savePath, Buffer.from(buffer));
        console.log(`    -> Saved to ${savePath}`);
      } else {
        console.log(`[${i+1}] Could not find image for ${url}`);
      }
    } catch (e) {
      console.error(`[${i+1}] Error downloading ${url}:`, e.message);
    }
  }
  console.log("Done.");
}

run();
