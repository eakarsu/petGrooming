import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addDays } from 'date-fns'
import { sendSMS } from '@/lib/sms'
import { sendEmail } from '@/lib/email'

/**
 * Two-way vaccine + medication reminder agent.
 *
 * 1) Scans VaccinationRecord for vaccinations expiring in the next 30 days.
 * 2) Scans Prescription for ACTIVE prescriptions ending in 7 days.
 * 3) Creates VaccineReminderJob rows so reminders aren't sent twice.
 * 4) Sends SMS via Twilio + email via Resend with a confirmation link.
 *
 * Auth: requires CRON_SECRET header to match env CRON_SECRET (or any caller in dev).
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const vaccineCutoff = addDays(now, 30)
  const medCutoff = addDays(now, 7)

  let vaccineCreated = 0
  let medCreated = 0
  let sent = 0
  const errors: string[] = []

  // Vaccinations
  const vaccs = await db.vaccinationRecord.findMany({
    where: { expirationDate: { gte: now, lte: vaccineCutoff } },
    include: { pet: { include: { client: true } } },
  })
  for (const v of vaccs) {
    const exists = await db.vaccineReminderJob.findFirst({
      where: { vaccinationId: v.id, status: { in: ['PENDING', 'SENT'] } },
    })
    if (exists) continue
    await db.vaccineReminderJob.create({
      data: {
        petId: v.petId,
        vaccinationId: v.id,
        reminderType: 'VACCINE',
        scheduledFor: now,
        status: 'PENDING',
      },
    })
    vaccineCreated++
  }

  // Medications
  const meds = await db.prescription.findMany({
    where: { status: 'ACTIVE' },
    include: { pet: { include: { client: true } } },
  })
  for (const p of meds) {
    // duration string parsing — best-effort
    const durDays = parseInt(p.duration?.match(/\d+/)?.[0] || '0', 10)
    if (!durDays) continue
    const ends = addDays(new Date(p.prescribedDate), durDays)
    if (ends < now || ends > medCutoff) continue
    const exists = await db.vaccineReminderJob.findFirst({
      where: { prescriptionId: p.id, status: { in: ['PENDING', 'SENT'] } },
    })
    if (exists) continue
    await db.vaccineReminderJob.create({
      data: {
        petId: p.petId,
        prescriptionId: p.id,
        reminderType: 'MEDICATION',
        scheduledFor: now,
        status: 'PENDING',
      },
    })
    medCreated++
  }

  // Dispatch PENDING jobs (max 50 per run)
  const pending = await db.vaccineReminderJob.findMany({
    where: { status: 'PENDING', scheduledFor: { lte: now } },
    take: 50,
  })

  for (const job of pending) {
    try {
      const pet = await db.pet.findUnique({
        where: { id: job.petId },
        include: { client: true },
      })
      if (!pet?.client) {
        await db.vaccineReminderJob.update({ where: { id: job.id }, data: { status: 'FAILED' } })
        continue
      }
      const isVaccine = job.reminderType === 'VACCINE'
      const subject = isVaccine
        ? `${pet.name}'s vaccination is due soon`
        : `${pet.name}'s medication course is ending`
      const text = isVaccine
        ? `Hi ${pet.client.firstName}, ${pet.name}'s vaccination is due. Reply YES to book, NO to skip.`
        : `Hi ${pet.client.firstName}, ${pet.name}'s prescription is ending. Reply YES for refill, NO to stop.`

      if (pet.client.phone) {
        await sendSMS(pet.client.phone, text)
      }
      if (pet.client.email) {
        await sendEmail(pet.client.email, subject, `<p>${text}</p>`)
      }
      await db.vaccineReminderJob.update({
        where: { id: job.id },
        data: { status: 'SENT', sentAt: now },
      })
      sent++
    } catch (e) {
      await db.vaccineReminderJob.update({
        where: { id: job.id },
        data: { status: 'FAILED' },
      })
      errors.push(e instanceof Error ? e.message : String(e))
    }
  }

  return NextResponse.json({
    success: true,
    vaccineJobsCreated: vaccineCreated,
    medJobsCreated: medCreated,
    sent,
    errors,
    timestamp: now.toISOString(),
  })
}

/** POST: handle inbound SMS/email confirmations (YES/NO). */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { from, message, jobId } = body as { from?: string; message?: string; jobId?: string }
  if (!from || !message) return NextResponse.json({ error: 'from and message required' }, { status: 400 })

  let job = jobId ? await db.vaccineReminderJob.findUnique({ where: { id: jobId } }) : null
  if (!job) {
    // Find latest SENT job by client phone
    const client = await db.client.findFirst({ where: { phone: from } })
    if (client) {
      job = await db.vaccineReminderJob.findFirst({
        where: {
          status: 'SENT',
          pet: { is: { clientId: client.id } } as never,
        } as never,
        orderBy: { sentAt: 'desc' },
      })
    }
  }
  if (!job) return NextResponse.json({ error: 'No matching reminder job' }, { status: 404 })

  const reply = message.trim().toUpperCase()
  const newStatus = reply.startsWith('Y') ? 'CONFIRMED' : reply.startsWith('N') ? 'DECLINED' : 'SENT'
  await db.vaccineReminderJob.update({
    where: { id: job.id },
    data: { status: newStatus, confirmedAt: new Date(), confirmationReply: message },
  })
  return NextResponse.json({ success: true, status: newStatus })
}
