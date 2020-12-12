/*
 * Warning: This development server was not meant to be used in a production environment.
 * It can have securiy vulnerabilities, so please make sure that it's not exposed to the internet.
 * By default, it is restricted to be accessed only from localhost.
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const INDEX = 'index.html';

const getContentType = file => {
	switch (path.extname(file)) {
		case '.html':
			return 'text/html';
		case '.js':
			return 'text/javascript';
		case '.css':
			return 'text/css';
		default:
			return 'text/plain';
	}
};

const server = http.createServer(async (req, res) => {
	console.log('Request: ', req.url);

	const { pathname } = url.parse(req.url);
	const file = pathname.endsWith('/') ? `.${pathname}${INDEX}` : `.${pathname}`;

	try {
		const data = await fs.readFile(file);
		const contentType = getContentType(file);
		const contentLength = data.length;

		res.writeHead(200, {
			'Cache-Control': 'no-cache',
			'Content-Length': contentLength,
			'Content-Type': `${contentType}; charset=UTF-8`,
		});

		res.end(data);
	} catch (err) {
		console.error(err);
		res.writeHead(404);
		return res.end();
	}
});

server.listen({ host: HOST, port: PORT });

console.log(`Listening on port ${HOST}:${PORT}...`, '\x1b[33m');
console.log(
	`Warning: This development server was not meant to be used in a production environment.\n`,
	`It can have securiy vulnerabilities, so please make sure that it's not exposed to the internet.\n`,
	`By default, it is restricted to be accessed only from localhost.`,
	'\x1b[0m'
);
