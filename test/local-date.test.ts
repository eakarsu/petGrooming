import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localDate } from '../src/lib/local-date';
test('local calendar day does not jump to tomorrow after UTC midnight', () => {
  const oldTimezone = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try { assert.equal(localDate(new Date('2026-09-06T01:00:00Z')), '2026-09-05'); }
  finally { if (oldTimezone === undefined) delete process.env.TZ; else process.env.TZ = oldTimezone; }
});
