import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AWAJ_BASE_URL, getAwajHeaders } from '../_config.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const token = process.env.AWAJ_API_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'AWAJ_API_TOKEN is not set' });
      }
      console.log(`Using AWAJ_API_TOKEN starting with: ${token.substring(0, 8)}...`);
      console.log('Target URL:', `${AWAJ_BASE_URL}/broadcasts`);
      console.log('Request Headers:', JSON.stringify(getAwajHeaders(), null, 2));
      console.log('Request Body:', JSON.stringify(req.body, null, 2));

      const response = await fetch(`${AWAJ_BASE_URL}/broadcasts`, {
        method: 'POST',
        headers: getAwajHeaders(),
        body: JSON.stringify(req.body)
      });
      
      const responseText = await response.text();
      console.log(`Awaj API Response (${response.status}):`, responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { error: 'Invalid JSON from Awaj API', raw: responseText };
      }

      if (!response.ok) {
        const detailedMessage = data.message || data.error || (typeof data === 'string' ? data : null);
        const finalError = detailedMessage ? `Awaj API Error: ${detailedMessage}` : `Awaj API Error: ${response.status} ${response.statusText}`;

        return res.status(response.status).json({ 
          error: finalError,
          message: detailedMessage,
          details: data.details || data.errors || data,
          raw_response: responseText,
          sent_payload: req.body
        });
      }
      
      res.status(200).json(data);
    } catch (error: any) {
      console.error('Error creating broadcast:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
