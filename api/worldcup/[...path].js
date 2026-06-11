export default async function handler(req, res) {
  const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (!API_KEY) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Missing FOOTBALL_DATA_API_KEY environment variable' });
  }

  const { path = [] } = req.query;
  const tail = Array.isArray(path) ? path.join('/') : String(path || '');
  const qs = new URLSearchParams(req.query);
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

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');

    return res.status(response.status).send(body);
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(502).json({
      error: 'Proxy request failed',
      detail: String(error?.message || error)
    });
  }
}
