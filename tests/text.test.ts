import assert from 'node:assert/strict';
import test from 'node:test';
import { ageOn, slugify } from '../lib/text.ts';

test('slugify normalise les accents et la ponctuation', () => {
  assert.equal(slugify('  Volley Péi — Saint-Denis !  '), 'volley-pei-saint-denis');
});

test('slugify limite les identifiants à 80 caractères', () => {
  assert.equal(slugify('A'.repeat(100)).length, 80);
});

test('ageOn calcule l’âge avant et après la date anniversaire', () => {
  assert.equal(ageOn('2010-09-16', new Date('2026-09-15T12:00:00Z')), 15);
  assert.equal(ageOn('2010-09-15', new Date('2026-09-15T12:00:00Z')), 16);
});

test('ageOn rejette une date invalide', () => {
  assert.equal(ageOn('date-invalide', new Date('2026-09-15T12:00:00Z')), null);
});
