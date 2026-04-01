
import fetch from 'node-fetch';
import FormData from 'form-data';

const token = 'oat_MjAz.NFBQQVZmUFBFemdxbFJ4NEh5TF9YcUZTZmlGdzVwY3BUMWc3MXVDajMxNjQyNTQwODA';
const baseUrl = 'https://api.awajdigital.com/api';

async function testField(fieldName) {
  console.log(`Testing field name: ${fieldName}`);
  const name = 'Test Voice ' + fieldName + ' ' + Date.now();
  const fileBuffer = Buffer.from('ID3...mock mp3 content...'); // Add ID3 header just in case
  
  const formData = new FormData();
  formData.append('name', name);
  formData.append(fieldName, fileBuffer, {
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
  
  console.log(`Status for ${fieldName}: ${res.status}`);
  const text = await res.text();
  console.log('Response:', text);
}

async function run() {
  await testField('audio');
  await testField('file');
  await testField('voice');
  await testField('voice_file');
}

run();
