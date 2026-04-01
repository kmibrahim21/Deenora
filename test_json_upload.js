
import fetch from 'node-fetch';

const token = 'oat_MjAz.NFBQQVZmUFBFemdxbFJ4NEh5TF9YcUZTZmlGdzVwY3BUMWc3MXVDajMxNjQyNTQwODA';
const baseUrl = 'https://api.awajdigital.com/api';

async function testJsonUpload() {
  const file_url = 'https://github.com/rafaelreis-hotmart/Audio-Sample-files/raw/master/sample.mp3';
  const name = 'Test JSON Voice ' + Date.now();
  
  console.log('Sending JSON request to Awaj...');
  const res = await fetch(`${baseUrl}/voices/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      name: name,
      file_url: file_url
    })
  });
  
  console.log(`Status: ${res.status}`);
  const text = await res.text();
  console.log('Response:', text);
}

testJsonUpload();
