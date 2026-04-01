import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AWAJ_BASE_URL, getAwajHeaders } from '../_config.js';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { Buffer } from 'node:buffer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${AWAJ_BASE_URL}/voices`, { headers: getAwajHeaders() as any });
      if (!response.ok) {
        console.error(`Awaj API Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Awaj API Response:', errorText);
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
      console.error('Error fetching voices:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      console.log('Incoming POST body:', req.body);
      const { name, file_url } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      let body: any = JSON.stringify(req.body);
      let headers: any = { ...getAwajHeaders() };
      
      if (!process.env.AWAJ_API_TOKEN) {
        console.error('AWAJ_API_TOKEN is missing in environment!');
      }

      if (file_url) {
        console.log(`Downloading voice from: ${file_url}`);
        const fileRes = await fetch(file_url);
        if (!fileRes.ok) throw new Error(`Failed to download file from URL: ${fileRes.status} ${fileRes.statusText}`);
        const fileBuffer = await fileRes.arrayBuffer();
        if (fileBuffer.byteLength === 0) {
          throw new Error('Downloaded file is empty');
        }
        console.log(`Downloaded file size: ${fileBuffer.byteLength} bytes`);
        
        // Detect content type from URL or response headers
        const contentType = fileRes.headers.get('content-type') || 'audio/mpeg';
        const extension = file_url.split('.').pop()?.split('?')[0] || 'mp3';
        const filename = `voice.${extension}`;

        const formData = new FormData();
        formData.append('name', name || 'Voice Upload');
        formData.append('audio', Buffer.from(new Uint8Array(fileBuffer)), {
          filename: filename,
          contentType: contentType
        });
        formData.append('file', Buffer.from(new Uint8Array(fileBuffer)), {
          filename: filename,
          contentType: contentType
        });

        body = formData;
        
        // Create new headers without Content-Type so fetch can set the boundary
        headers = {
          'Authorization': `Bearer ${process.env.AWAJ_API_TOKEN}`,
          'Accept': 'application/json',
          ...formData.getHeaders()
        };
        console.log(`Sending multipart request to Awaj API (filename: ${filename}, type: ${contentType})...`);
      }

      const response = await fetch(`${AWAJ_BASE_URL}/voices/upload`, {
        method: 'POST',
        headers: headers,
        body: body
      });
      
      let data;
      try {
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
        } catch (e) {
          data = { message: textData || 'Unknown error from Awaj API' };
        }
      } catch (e) {
        data = { message: 'Failed to read response from Awaj API' };
      }
      
      if (!response.ok) {
        console.error('Awaj Voice Upload Error:', response.status, data);
        return res.status(response.status).json(data);
      }
      res.status(200).json(data);
    } catch (error: any) {
      console.error('Error uploading voice:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
