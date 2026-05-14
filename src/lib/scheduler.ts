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
  errors: string[]
}> {
  const now = new Date()
  const cutoff = addDays(now, daysAhead)
  const errors: string[] = []
  let reminded = 0

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

    try {
      // Email
      await sendEmail(
        client.email,
        `Vaccination Reminder: ${pet.name}'s ${record.vaccineName} is due ${dueDate}`,
        htmlBody
      )

      // SMS (if phone available)
      if (client.phone) {
        await sendSMS(client.phone, messageText)
      }

      // Log to ReminderHistory
      await db.reminderHistory.create({
        data: {
          petId: pet.id,
          clientId: client.id,
          type: 'VACCINATION',
          message: messageText,
          sentVia: client.phone ? 'BOTH' : 'EMAIL',
          sentAt: new Date(),
        },
      })

      reminded++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Pet ${pet.name} (${record.vaccineName}): ${msg}`)
      console.error('Vaccination reminder error:', msg)
    }
  }

  return { checked: records.length, reminded, errors }
}
