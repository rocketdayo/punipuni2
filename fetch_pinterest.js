import fs from 'fs';
import path from 'path';

async function run() {
  try {
    console.log("Fetching Pinterest page...");
    const url = "https://jp.pinterest.com/pin/563018696815506/";
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = await res.text();
    
    const ogMatch = html.match(/<meta property="og:image" name="og:image" content="([^"]+)"/i) || 
                    html.match(/<meta property="og:image" content="([^"]+)"/i) ||
                    html.match(/<img[^>]+src="([^"]+\.jpg)"/i);
    
    if (ogMatch && ogMatch[1]) {
      const imgUrl = ogMatch[1];
      console.log(`Found image: ${imgUrl}`);
      
      const imgRes = await fetch(imgUrl);
      const buffer = await imgRes.arrayBuffer();
      
      const savePath = path.join(process.cwd(), 'pinterest_ref.jpg');
      fs.writeFileSync(savePath, Buffer.from(buffer));
      console.log(`Saved to ${savePath}`);
    } else {
      console.log("Could not find image in Pinterest HTML");
      fs.writeFileSync('pinterest.html', html);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
