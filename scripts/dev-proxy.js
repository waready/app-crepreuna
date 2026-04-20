const http = require('node:http');

const PROXY_PORT = Number(process.env.PROXY_PORT || 3000);
const EXPO_ORIGIN = process.env.EXPO_ORIGIN || 'http://localhost:3001';
const API_ORIGIN = process.env.API_ORIGIN || 'https://back.waready.org.pe';

const server = http.createServer(async (req, res) => {
  try {
    const targetOrigin = req.url.startsWith('/api') ? API_ORIGIN : EXPO_ORIGIN;
    const targetUrl = new URL(req.url, targetOrigin);
    const headers = buildForwardHeaders(req.headers, targetUrl);
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : req;

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      duplex: body ? 'half' : undefined,
      redirect: 'manual',
    });

    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        res.setHeader('set-cookie', rewriteSetCookie(value));
        return;
      }
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.end(buffer);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Proxy error', message: error.message }));
  }
});

server.on('upgrade', (req, socket) => {
  // Expo still works without proxying HMR websockets for this local validation flow.
  socket.end('HTTP/1.1 426 Upgrade Required\r\n\r\n');
});

server.listen(PROXY_PORT, () => {
  console.log(`CEPREUNA dev proxy listening on http://localhost:${PROXY_PORT}`);
  console.log(`Expo upstream: ${EXPO_ORIGIN}`);
  console.log(`API upstream: ${API_ORIGIN}`);
});

function buildForwardHeaders(sourceHeaders, targetUrl) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(sourceHeaders)) {
    if (!value) continue;
    const lowerKey = key.toLowerCase();
    if (['host', 'origin', 'referer', 'connection', 'content-length'].includes(lowerKey)) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  headers.set('host', targetUrl.host);
  headers.set('origin', targetUrl.origin);
  headers.set('referer', targetUrl.origin);
  return headers;
}

function rewriteSetCookie(cookieValue) {
  return cookieValue
    .split(/,(?=\s*[^;,]+=)/)
    .map((cookie) =>
      cookie
        .replace(/;\s*Domain=[^;]*/gi, '')
        .replace(/;\s*Secure/gi, '')
        .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
    );
}
