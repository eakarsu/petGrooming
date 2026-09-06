import http from 'node:http'
import net from 'node:net'

const port = Number(process.env.FRONTEND_PORT)
const target = Number(process.env.BACKEND_PORT)
if (!Number.isInteger(port) || !Number.isInteger(target) || port === target) throw new Error('Distinct BACKEND_PORT and FRONTEND_PORT are required')

const server = http.createServer((req, res) => {
  const upstream = http.request({ hostname: '127.0.0.1', port: target, method: req.method, path: req.url, headers: { ...req.headers, host: `127.0.0.1:${target}` } }, (response) => {
    res.writeHead(response.statusCode || 502, response.headers)
    response.pipe(res)
  })
  upstream.on('error', () => { res.writeHead(502); res.end('Upstream unavailable') })
  req.pipe(upstream)
})
server.on("upgrade", (request, socket, head) => {
  const upstream = net.connect(target, "127.0.0.1", () => {
    const lines = [`${request.method} ${request.url} HTTP/${request.httpVersion}`];
    for (let i = 0; i < request.rawHeaders.length; i += 2) {
      const name = request.rawHeaders[i];
      const value = name.toLowerCase() === "host" ? `127.0.0.1:${target}` : request.rawHeaders[i + 1];
      lines.push(`${name}: ${value}`);
    }
    upstream.write(`${lines.join("\r\n")}\r\n\r\n`);
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
  socket.on("close", () => upstream.destroy());
  upstream.on("close", () => socket.destroy());
});


server.listen(port, '127.0.0.1', () => console.log(`Pet Grooming UI proxy listening on 127.0.0.1:${port}`))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)))
