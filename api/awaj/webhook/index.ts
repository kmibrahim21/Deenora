import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    console.log('Received webhook:', req.body);
    // Process webhook data here
    // e.g. update broadcast status in database
    
    res.status(200).json({ received: true });
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
