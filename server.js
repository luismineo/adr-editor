import { createServer } from 'node:http';

const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 3000);
const allowedHosts = new Set([
	`localhost:${port}`,
	`127.0.0.1:${port}`,
	`[::1]:${port}`,
	`${host}:${port}`
]);

process.env.PROTOCOL_HEADER = 'x-forwarded-proto';
const { handler } = await import('./build/handler.js');

createServer((req, res) => {
	if (!allowedHosts.has(req.headers.host ?? '')) {
		res.writeHead(421).end('Unknown host');
		return;
	}

	req.headers['x-forwarded-proto'] = 'http';
	handler(req, res, () => res.writeHead(404).end('Not found'));
}).listen(port, host, () => {
	console.log(`ADR Editor is running at http://localhost:${port}`);
});
