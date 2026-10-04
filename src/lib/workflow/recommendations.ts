import { sha256 } from './hash'

type Event = {
  id: string; actorId: string; action: string; payload: unknown;
  previousHash: string | null; eventHash: string; createdAt: Date;
}
export type CompletedVisit = {
  id: string; technicianId: string; scheduledStart: Date; scheduledEnd: Date;
  quote: { lines: { serviceId: string }[] }; pet?: { breed: { size: string } | null }; audits: Event[];
}
type Point = { latitude: number; longitude: number; accuracyMeters: number }

function verifiedEvents(visit: CompletedVisit) {
  const events = [...visit.audits].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id))
  let previousHash: string | null = null
  for (const event of events) {
    if (event.previousHash !== previousHash || event.eventHash !== sha256({
      stream: `order:${visit.id}`, actorId: event.actorId, action: event.action,
      payload: event.payload, previousHash, createdAt: event.createdAt.toISOString(),
    })) return []
    previousHash = event.eventHash
  }
  return events
}

function point(event?: Event): Point | null {
  const value = (event?.payload as { location?: unknown } | undefined)?.location as Point | undefined
  return value && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90 &&
    Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180 &&
    Number.isFinite(value.accuracyMeters) && value.accuracyMeters <= 200 && value.accuracyMeters >= 0 ? value : null
}
function percentile(values: number[], fraction: number) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.ceil(sorted.length * fraction) - 1]
}
function distanceKm(left: Point, right: Point) {
  const rad = Math.PI / 180, dLat = (right.latitude - left.latitude) * rad, dLon = (right.longitude - left.longitude) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(left.latitude * rad) * Math.cos(right.latitude * rad) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function suggestVisitBuffers(visits: CompletedVisit[]) {
  const complete: { visit: CompletedVisit; startedAt: Date; completedAt: Date; checkedInAt: Date | null; startPoint: Point | null; endPoint: Point | null; serviceKey: string; breedSize: string }[] = []
  for (const visit of visits) {
    const events = verifiedEvents(visit)
    const started = events.find(event => event.action === 'JOB_IN_PROGRESS')
    const finished = events.find(event => event.action === 'JOB_COMPLETED')
    const checked = events.find(event => event.action === 'JOB_CHECKED_IN')
    if (!started || !finished || finished.createdAt <= started.createdAt) continue
    const minutes = (finished.createdAt.getTime() - started.createdAt.getTime()) / 60000
    if (minutes < 10 || minutes > 720) continue
    const serviceKey = [...new Set(visit.quote.lines.map(line => line.serviceId))].sort().join(',')
    if (!serviceKey) continue
    complete.push({ visit, startedAt: started.createdAt, completedAt: finished.createdAt, checkedInAt: checked?.createdAt ?? null, startPoint: point(checked), endPoint: point(finished), serviceKey, breedSize: visit.pet?.breed?.size ?? 'UNKNOWN' })
  }
  const groups = new Map<string, typeof complete>()
  for (const row of complete) { const key = JSON.stringify([row.serviceKey, row.breedSize]); groups.set(key, [...(groups.get(key) ?? []), row]) }
  const duration = [...groups].flatMap(([, rows]) => {
    if (rows.length < 5) return []
    const observed = rows.map(row => (row.completedAt.getTime() - row.startedAt.getTime()) / 60000)
    return [{ serviceIds: rows[0].serviceKey.split(','), breedSize: rows[0].breedSize, sampleCount: rows.length, observedP80Minutes: Math.ceil(percentile(observed, 0.8)), suggestedDurationMinutes: Math.min(720, Math.ceil(percentile(observed, 0.8) / 5) * 5), sourceOrderIds: rows.map(row => row.visit.id).slice(0, 20) }]
  })
  const byTechnician = new Map<string, typeof complete>()
  for (const row of complete) byTechnician.set(row.visit.technicianId, [...(byTechnician.get(row.visit.technicianId) ?? []), row])
  const routeSamples: { minutes: number; distanceKm: number; fromId: string; toId: string }[] = []
  for (const rows of byTechnician.values()) {
    const ordered = rows.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
    for (let index = 1; index < ordered.length; index++) {
      const previous = ordered[index - 1], next = ordered[index]
      if (!previous.endPoint || !next.startPoint || !next.checkedInAt) continue
      const minutes = (next.checkedInAt.getTime() - previous.completedAt.getTime()) / 60000
      if (minutes < 3 || minutes > 180 || next.startedAt < previous.completedAt) continue
      const km = distanceKm(previous.endPoint, next.startPoint)
      if (km < 0.5 || km > 100) continue
      routeSamples.push({ minutes, distanceKm: Math.round(km * 10) / 10, fromId: previous.visit.id, toId: next.visit.id })
    }
  }
  const route = routeSamples.length >= 5 ? {
    sampleCount: routeSamples.length,
    observedP80GapMinutes: Math.ceil(percentile(routeSamples.map(row => row.minutes), 0.8)),
    suggestedIntervisitBufferMinutes: Math.ceil(percentile(routeSamples.map(row => row.minutes), 0.8) / 5) * 5,
    sourcePairs: routeSamples.slice(0, 20),
    limitation: 'Device-reported positions and server-recorded elapsed gaps include idle time. A map provider and dispatcher must verify any route estimate before changing availability.',
  } : null
  return { duration, route, excluded: visits.length - complete.length, policy: 'Suggestions use completed visits with intact audit chains and at least five observations. They never change bookings or availability automatically.' }
}
