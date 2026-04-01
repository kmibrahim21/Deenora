import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AWAJ_BASE_URL, getAwajHeaders } from '../_config.js';
import fetch from 'node-fetch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      const response = await fetch(`${AWAJ_BASE_URL}/voices/${id}`, {
        method: 'DELETE',
        headers: getAwajHeaders() as any
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Awaj API Error deleting voice ${id}: ${response.status} ${response.statusText}`, errorText);
        return res.status(response.status).json({ error: `Awaj API Error: ${response.statusText}`, details: errorText });
      }
      
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        // Might be empty response
      }
      
      res.status(200).json({ success: true, ...data });
    } catch (error: any) {
      console.error(`Error deleting voice ${id}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
