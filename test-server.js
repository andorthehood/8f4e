const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    let filePath = req.url;
    if (filePath === '/') filePath = '/index.html';

    // Prepend dist folder to the path
    filePath = path.join('./dist', filePath);

    const extname = path.extname(filePath);
    let contentType = 'text/html';

    if (extname === '.js') contentType = 'application/javascript';
    else if (extname === '.css') contentType = 'text/css';
    else if (extname === '.png') contentType = 'image/png';
    else if (extname === '.json') contentType = 'application/json';
    else if (extname === '.ico') contentType = 'image/x-icon';
    else if (extname === '.svg') contentType = 'image/svg+xml';
    else if (extname === '.woff') contentType = 'font/woff';
    else if (extname === '.woff2') contentType = 'font/woff2';
    else if (extname === '.ttf') contentType = 'font/ttf';
    else if (extname === '.eot') contentType = 'application/vnd.ms-fontobject';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(8080, () => {
    console.log('Server running at http://localhost:8080/');
    console.log('CORS headers configured for SharedArrayBuffer support');
    console.log('Serving files from dist folder');
}); 