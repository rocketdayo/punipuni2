import fs from 'fs';

async function run() {
  const url = "https://game8.jp/punipuni/38669";
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  const html = await res.text();
  fs.writeFileSync('game8.html', html);
  console.log("Saved game8.html");
}

run();
