'use client';

function reunionDay() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Indian/Reunion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function browserToken() {
  const key = 'volleypei_visitor';
  const current = localStorage.getItem(key);
  if (current) return current;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

export async function anonymousDailyHash(scope: string) {
  const source = new TextEncoder().encode(`${browserToken()}:${reunionDay()}:${scope}`);
  const digest = await crypto.subtle.digest('SHA-256', source);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
