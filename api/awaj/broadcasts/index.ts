import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AWAJ_BASE_URL, getAwajHeaders } from '../_config.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${AWAJ_BASE_URL}/broadcasts`, { headers: getAwajHeaders() });
      if (!response.ok) {
        console.error(`Awaj API Error (Broadcasts): ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        return res.status(response.status).json({ error: `Awaj API Error: ${response.statusText}`, details: errorText });
      }
      const data = await response.json();
      res.status(200).json(data);
    } catch (error: any) {
      console.error('Error fetching broadcasts:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
