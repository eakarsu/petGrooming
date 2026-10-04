import test from 'node:test'
import assert from 'node:assert/strict'
import { sha256 } from '../src/lib/workflow/hash'
import { suggestVisitBuffers, type CompletedVisit } from '../src/lib/workflow/recommendations'
import { visitLocation } from '../src/lib/workflow/service'

function visit(index: number): CompletedVisit {
  const id = `order-${index}`, origin = Date.UTC(2026, 8, 1, 8 + index * 2)
  const entries = [
    { action: 'JOB_CHECKED_IN', at: origin, payload: { location: { latitude: 40 + index * 0.01, longitude: -73, accuracyMeters: 12 } } },
    { action: 'JOB_IN_PROGRESS', at: origin + 5 * 60000, payload: {} },
    { action: 'JOB_COMPLETED', at: origin + 75 * 60000, payload: { location: { latitude: 40 + index * 0.01, longitude: -73, accuracyMeters: 12 } } },
  ]
  let previousHash: string | null = null
  const audits = entries.map((entry, eventIndex) => {
    const createdAt = new Date(entry.at)
    const eventHash = sha256({ stream: `order:${id}`, actorId: 'tech-1', action: entry.action, payload: entry.payload, previousHash, createdAt: createdAt.toISOString() })
    const event = { id: `${id}-${eventIndex}`, actorId: 'tech-1', action: entry.action, payload: entry.payload, previousHash, eventHash, createdAt }
    previousHash = eventHash
    return event
  })
  return { id, technicianId: 'tech-1', scheduledStart: new Date(origin), scheduledEnd: new Date(origin + 60 * 60000), quote: { lines: [{ serviceId: 'bath' }] }, audits }
}

test('suggestions require five completed visits with intact audit chains and only return advice', () => {
  const result = suggestVisitBuffers(Array.from({ length: 6 }, (_, index) => visit(index)))
  assert.equal(result.duration[0].sampleCount, 6)
  assert.equal(result.duration[0].suggestedDurationMinutes, 70)
  assert.equal(result.route?.sampleCount, 5)
  assert.equal(result.route?.suggestedIntervisitBufferMinutes, 45)
  assert.match(result.policy, /never change bookings/i)
  const tampered = visit(7)
  tampered.audits[2].payload = { location: { latitude: 41, longitude: -73, accuracyMeters: 12 } }
  const checked = suggestVisitBuffers([tampered, ...Array.from({ length: 4 }, (_, index) => visit(index))])
  assert.equal(checked.duration.length, 0)
  assert.equal(checked.excluded, 1)
})

test('visit location only accepts bounded, accurate numeric coordinates', () => {
  assert.deepEqual(visitLocation({ latitude: 40, longitude: -73, accuracyMeters: 25 }), { latitude: 40, longitude: -73, accuracyMeters: 25 })
  assert.throws(() => visitLocation({ latitude: 500, longitude: -73, accuracyMeters: 25 }), /location/i)
  assert.throws(() => visitLocation({ latitude: 40, longitude: -73, accuracyMeters: 250 }), /location/i)
})
