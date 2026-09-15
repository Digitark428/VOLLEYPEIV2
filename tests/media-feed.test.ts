import assert from 'node:assert/strict';
import test from 'node:test';
import { displayName, one } from '../lib/feed.ts';
import { protectedMediaUrl } from '../lib/media.ts';

test('protectedMediaUrl route les médias communautaires vers le proxy authentifié', () => {
  assert.equal(protectedMediaUrl('profiles/abc/avatar.webp'), '/media/profiles/abc/avatar.webp');
  assert.equal(
    protectedMediaUrl('https://demo.supabase.co/storage/v1/object/public/media-public/posts/photo%20été.webp'),
    '/media/posts/photo%20%C3%A9t%C3%A9.webp',
  );
});

test('protectedMediaUrl conserve les buckets historiques dans le chemin', () => {
  assert.equal(
    protectedMediaUrl('https://demo.supabase.co/storage/v1/object/public/posters/tournaments/affiche.webp'),
    '/media/posters/tournaments/affiche.webp',
  );
});

test('protectedMediaUrl ne réécrit pas une ressource externe', () => {
  assert.equal(protectedMediaUrl('https://images.example.org/photo.webp'), 'https://images.example.org/photo.webp');
  assert.equal(protectedMediaUrl(null), null);
});

test('one normalise les relations Supabase simples ou en tableau', () => {
  assert.deepEqual(one([{ id: '1' }, { id: '2' }]), { id: '1' });
  assert.deepEqual(one({ id: '1' }), { id: '1' });
  assert.equal(one([]), null);
});

test('displayName respecte la préférence de confidentialité', () => {
  const profile = { id: '1', username: 'kevin', first_name: 'Kevin', last_name: 'Test', show_real_name: false, avatar_path: null };
  assert.equal(displayName(profile), '@kevin');
  assert.equal(displayName({ ...profile, show_real_name: true }), 'Kevin Test');
  assert.equal(displayName(null), 'Membre VolleyPéi');
});
