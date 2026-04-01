import fetch from 'node-fetch';
import FormData from 'form-data';

const token = 'oat_MjAz.NFBQQVZmUFBFemdxbFJ4NEh5TF9YcUZTZmlGdzVwY3BUMWc3MXVDajMxNjQyNTQwODA';
const baseUrl = 'https://api.awajdigital.com/api';

async function testUpload() {
  const file_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  const name = 'Test Voice';
  
  const fileRes = await fetch(file_url);
  const fileBuffer = await fileRes.arrayBuffer();
  
  const formData = new FormData();
  formData.append('name', name || 'Voice Upload');
  formData.append('audio', Buffer.from(fileBuffer), {
    filename: 'voice.mp3',
    contentType: 'audio/mpeg'
  });

  const res = await fetch(`${baseUrl}/voices/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      ...formData.getHeaders()
    },
    body: formData
  });
  
  console.log(`Status: ${res.status}`);
  const text = await res.text();
  console.log(text);
}

testUpload();
