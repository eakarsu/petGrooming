import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { sendSMS } from '@/lib/sms'
import { addDays, format } from 'date-fns'

/**
 * Checks for vaccinations due within the next `daysAhead` days and sends
 * reminder emails and SMS messages to the pet owners.
 *
 * Designed to be called by a cron job (e.g. Vercel Cron or an external scheduler).
 */
export async function checkUpcomingVaccinations(daysAhead = 7): Promise<{
  checked: number
  reminded: number
  emailSent: number
  smsSent: number
  failed: number
  errors: string[]
}> {
  const now = new Date()
  const cutoff = addDays(now, daysAhead)
  const errors: string[] = []
  let reminded = 0
  let emailSent = 0
  let smsSent = 0

  // Find vaccination records expiring within the next `daysAhead` days
  const records = await db.vaccinationRecord.findMany({
    where: {
      expirationDate: {
        gte: now,
        lte: cutoff,
      },
    },
    include: {
      pet: {
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  })

  for (const record of records) {
    const { pet } = record
    const { client } = pet

    if (!client) continue

    const dueDate = record.expirationDate
      ? format(record.expirationDate, 'MMMM d, yyyy')
      : 'soon'

    const messageText =
      `Hi ${client.firstName}, this is a reminder that ${pet.name}'s ` +
      `${record.vaccineName} vaccination is due on ${dueDate}. ` +
      `Please schedule an appointment with your veterinarian. — PetGroom Pro`

    const htmlBody =
      `<p>Dear ${client.firstName},</p>` +
      `<p>This is a friendly reminder that <strong>${pet.name}</strong>'s ` +
      `<strong>${record.vaccineName}</strong> vaccination is due on <strong>${dueDate}</strong>.</p>` +
      `<p>Please schedule an appointment with your veterinarian at your earliest convenience.</p>` +
      `<p>— The PetGroom Pro Team</p>`

    const channels: string[] = []
    const failures: string[] = []

    // Email
    const emailResult = await sendEmail(
      client.email,
      `Vaccination Reminder: ${pet.name}'s ${record.vaccineName} is due ${dueDate}`,
      htmlBody
    )
    if (emailResult.success) {
      channels.push('EMAIL')
      emailSent++
    } else {
      failures.push(`email: ${emailResult.error ?? 'send failed'}`)
    }

    // SMS (if phone available)
    if (client.phone) {
      const smsResult = await sendSMS(client.phone, messageText)
      if (smsResult.success) {
        channels.push('SMS')
        smsSent++
      } else {
        failures.push(`sms: ${smsResult.error ?? 'send failed'}`)
      }
    }

    // A reminder is only recorded when at least one channel actually delivered.
    if (channels.length === 0) {
      const msg = failures.join('; ')
      errors.push(`Pet ${pet.name} (${record.vaccineName}): ${msg}`)
      console.error('Vaccination reminder error:', msg)
      continue
    }

    try {
      await db.reminderHistory.create({
        data: {
          petId: pet.id,
          clientId: client.id,
          type: 'VACCINATION',
          message: messageText,
          sentVia: channels.length === 2 ? 'BOTH' : channels[0],
          sentAt: new Date(),
        },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Pet ${pet.name} (${record.vaccineName}): reminder delivered but history write failed: ${msg}`)
      console.error('Vaccination reminder history error:', msg)
      continue
    }

    reminded++

    if (failures.length > 0) {
      errors.push(`Pet ${pet.name} (${record.vaccineName}): delivered via ${channels.join(', ')}; ${failures.join('; ')}`)
    }
  }

  return { checked: records.length, reminded, emailSent, smsSent, failed: records.length - reminded, errors }
}
