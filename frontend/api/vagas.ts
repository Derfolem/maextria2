import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const APP_ID = process.env.ADZUNA_APP_ID;
  const APP_KEY = process.env.ADZUNA_APP_KEY;

  if (!APP_ID || !APP_KEY) {
    return res.status(500).json({ error: 'Adzuna credentials not configured' });
  }

  const { what = 'tecnologia', where, page = '1', results_per_page = '10', sort_by = 'date' } = req.query;

  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: APP_KEY,
    results_per_page: String(results_per_page),
    what: String(what),
    sort_by: String(sort_by),
  });

  if (where) {
    params.set('where', String(where));
  }

  try {
    const adzunaRes = await fetch(
      `https://api.adzuna.com/v1/api/jobs/br/search/${page}?${params.toString()}`,
    );

    const data = await adzunaRes.json();

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(adzunaRes.status).json(data);
  } catch (err) {
    console.error('Adzuna proxy error:', err);
    return res.status(502).json({ error: 'Failed to fetch jobs' });
  }
}
