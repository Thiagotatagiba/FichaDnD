#!/usr/bin/env node

/**
 * Servidor HTTP Simples para FichaDnD
 * Execute: node server.js
 * Depois abra: http://localhost:8000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const HOSTNAME = 'localhost';

// Tipos MIME comuns
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURI(parsedUrl.pathname);
  
  // Default to index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Caminho do arquivo (relativo ao diretório do script)
  let filePath = path.join(__dirname, pathname);

  // Segurança: não permitir subir de diretório
  const baseDir = path.resolve(__dirname);
  const resolvedPath = path.resolve(filePath);
  
  if (!resolvedPath.startsWith(baseDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Acesso negado');
    return;
  }

  // Ler arquivo
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>404 Não Encontrado</title>
              <style>
                body { font-family: Arial; margin: 50px; background: #f5f5f5; }
                h1 { color: #d32f2f; }
                p { color: #666; }
                pre { background: #fff; padding: 10px; border-left: 3px solid #d32f2f; }
              </style>
            </head>
            <body>
              <h1>404 - Arquivo Não Encontrado</h1>
              <p>Caminho: <code>${pathname}</code></p>
              <p>Arquivo: <code>${filePath}</code></p>
              <hr>
              <p><a href="/">Voltar para Index</a></p>
            </body>
          </html>
        `);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Erro do servidor: ${err.message}`);
      }
    } else {
      // Detectar tipo MIME
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

      // Configurar headers CORS para aceitar requisições
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });

      res.end(data);
    }
  });
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║     🚀 Servidor HTTP Local - FichaDnD                ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  Servidor rodando em: http://${HOSTNAME}:${PORT}       ║
║                                                       ║
║  Abra a Ficha em:                                     ║
║  http://localhost:8000/ficha/Ficha%20DnD%20-%20      ║
║  Tatagiba%201.0.html                                 ║
║                                                       ║
║  Teste o Card em:                                    ║
║  http://localhost:8000/teste_xhr.html                ║
║                                                       ║
║  Pressione CTRL+C para parar o servidor              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Erro: Porta ${PORT} já está em uso!`);
    console.error(`\nTente uma dessas soluções:`);
    console.error(`1. Feche a aplicação que está usando a porta ${PORT}`);
    console.error(`2. Edite o arquivo server.js e mude PORT = 8000 para outra porta`);
    console.error(`3. Use: npx http-server -p 9000 (porta diferente)\n`);
  } else {
    console.error('Erro do servidor:', err);
  }
  process.exit(1);
});
