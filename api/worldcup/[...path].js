export default async function handler(req, res) {
  const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'Missing FOOTBALL_DATA_API_KEY environment variable' });
  }

  const requestUrl = new URL(req.url, `https://${req.headers.host}`);
  const pathname = requestUrl.pathname;
  const marker = '/api/worldcup/';
  const tailFromPath = pathname.includes(marker) ? pathname.split(marker)[1] : '';
  const tailFromQuery = Array.isArray(req.query.path)
    ? req.query.path.join('/')
    : String(req.query.path || '');
  const tail = (tailFromPath || tailFromQuery || '').replace(/^\/+|\/+$/g, '');

  if (!tail) {
    return res.status(400).json({
      error: 'Missing proxy path',
      expected: ['/api/worldcup/standings', '/api/worldcup/matches?season=2026']
    });
  }

  const qs = new URLSearchParams(requestUrl.search);
  qs.delete('path');

  const upstream = `https://api.football-data.org/v4/competitions/WC/${tail}${qs.toString() ? `?${qs.toString()}` : ''}`;

  try {
    const response = await fetch(upstream, {
      headers: {
        'X-Auth-Token': API_KEY,
        'Accept': 'application/json'
      }
    });

    const body = await response.text();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.setHeader('X-Proxy-Upstream', upstream);
    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(502).json({
      error: 'Proxy request failed',
      detail: String(error?.message || error),
      upstream
    });
  }
}
