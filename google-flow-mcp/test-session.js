import { readFileSync } from 'fs';

const cookie = readFileSync('cookie.txt', 'utf-8').trim();
const headers = {
  'Origin': 'https://labs.google',
  'Content-Type': 'application/json',
  'Referer': 'https://labs.google/fx/tools/image-fx',
  'Cookie': cookie
};

console.log('Cookie length:', cookie.length);
console.log('Cookie keys:', cookie.split('; ').map(c => c.split('=')[0]).join(', '));
console.log('---');

const res = await fetch('https://labs.google/fx/api/auth/session', { headers });
console.log('Status:', res.status);
console.log('Headers:', Object.fromEntries(res.headers.entries()));
const text = await res.text();
console.log('Body:', text.substring(0, 500));
