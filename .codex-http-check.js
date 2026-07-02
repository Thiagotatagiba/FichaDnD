const http = require('http');
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const port = 8123;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = path.normalize(path.join(root, u));
  if (!f.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(f, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
    res.end(data);
  });
});
server.listen(port, '127.0.0.1', async () => {
  try {
    const url = `http://127.0.0.1:${port}/ficha/Ficha_DnD_-_Tatagiba_1.0.html`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTML ${response.status}`);
    const html = await response.text();
    const refs = [
      ...html.matchAll(/<link[^>]+href="([^"]+)"/g),
      ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
    ].map((m) => m[1]).filter((p) => !p.match(/^(https?:)?\/\//));
    let count = 0;
    for (const ref of refs) {
      const refUrl = new URL(ref, url);
      const refResponse = await fetch(refUrl);
      if (!refResponse.ok) throw new Error(`${refUrl.href} ${refResponse.status}`);
      await refResponse.arrayBuffer();
      count++;
    }
    console.log(`HTTP OK: pagina + ${count} imports locais carregaram.`);
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
