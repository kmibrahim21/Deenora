import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AWAJ_BASE_URL, getAwajHeaders } from '../_config.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${AWAJ_BASE_URL}/senders`, { headers: getAwajHeaders() });
      if (!response.ok) {
        console.error(`Awaj API Error (Senders): ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        return res.status(response.status).json({ error: `Awaj API Error: ${response.statusText}`, details: errorText });
      }
      
      const responseText = await response.text();
      try {
        const data = JSON.parse(responseText);
        res.status(200).json(data);
      } catch (e) {
        console.error('Error parsing Awaj API response:', responseText);
        res.status(200).json({ error: 'Invalid JSON from Awaj API', raw: responseText });
      }
    } catch (error: any) {
      console.error('Error fetching senders:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
