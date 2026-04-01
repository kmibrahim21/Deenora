import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AWAJ_BASE_URL, getAwajHeaders } from '../_config.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      let response = await fetch(`${AWAJ_BASE_URL}/broadcasts/${id}/result`, { headers: getAwajHeaders() });
      
      // Fallback to /broadcasts/${id} if /result endpoint doesn't exist
      if (response.status === 404) {
        console.log(`Fallback to /broadcasts/${id} as /result returned 404`);
        response = await fetch(`${AWAJ_BASE_URL}/broadcasts/${id}`, { headers: getAwajHeaders() });
      }

      if (!response.ok) {
        console.error(`Awaj API Error (Broadcast Result): ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        return res.status(response.status).json({ error: `Awaj API Error: ${response.statusText}`, details: errorText });
      }
      const data = await response.json();
      res.status(200).json(data);
    } catch (error: any) {
      console.error('Error fetching broadcast result:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
