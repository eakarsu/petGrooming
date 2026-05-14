import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addDays, subDays, differenceInDays } from 'date-fns'
import { sendEmail } from '@/lib/email'
import { sendSMS } from '@/lib/sms'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'pending'

    if (type === 'pending') {
      // Get pets that need grooming reminders based on breed frequency
      const pets = await db.pet.findMany({
        where: { isActive: true },
        include: {
          breed: true,
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          appointments: {
            where: { status: 'COMPLETED' },
            orderBy: { scheduledDate: 'desc' },
            take: 1,
          },
        },
      })

      const today = new Date()
      const reminders = pets
        .map(pet => {
          const lastAppointment = pet.appointments[0]
          const groomingFrequency = pet.breed.groomingFrequency || 42 // Default 6 weeks

          if (!lastAppointment) {
            return {
              pet,
              type: 'NEW_CLIENT',
              priority: 'medium',
              message: `${pet.name} hasn't had a grooming appointment yet.`,
              daysSinceLastVisit: null,
              daysOverdue: null,
            }
          }

          const daysSinceLastVisit = differenceInDays(today, lastAppointment.scheduledDate)
          const daysOverdue = daysSinceLastVisit - groomingFrequency

          if (daysOverdue > 14) {
            return {
              pet,
              type: 'OVERDUE',
              priority: 'high',
              message: `${pet.name} is ${daysOverdue} days overdue for grooming.`,
              daysSinceLastVisit,
              daysOverdue,
              lastAppointment,
            }
          } else if (daysOverdue > 0) {
            return {
              pet,
              type: 'DUE',
              priority: 'medium',
              message: `${pet.name} is due for grooming (${daysOverdue} days overdue).`,
              daysSinceLastVisit,
              daysOverdue,
              lastAppointment,
            }
          } else if (daysOverdue > -7) {
            return {
              pet,
              type: 'UPCOMING',
              priority: 'low',
              message: `${pet.name}'s next grooming is coming up in ${-daysOverdue} days.`,
              daysSinceLastVisit,
              daysOverdue,
              lastAppointment,
            }
          }

          return null
        })
        .filter(Boolean)
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return priorityOrder[a!.priority as keyof typeof priorityOrder] - 
                 priorityOrder[b!.priority as keyof typeof priorityOrder]
        })

      return NextResponse.json({ reminders })
    }

    // Get sent reminders from ReminderHistory
    if (type === 'sent') {
      const sentReminders = await db.reminderHistory.findMany({
        include: {
          pet: { select: { id: true, name: true } },
          client: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { sentAt: 'desc' },
        take: 50,
      })

      // Transform to match expected format
      const formattedReminders = sentReminders.map(r => ({
        id: r.id,
        pet: r.pet,
        client: r.client,
        type: r.type,
        message: r.message,
        sentVia: r.sentVia,
        reminderSentAt: r.sentAt,
      }))

      return NextResponse.json({ sentReminders: formattedReminders })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { petId, clientId, message, type } = body

    // Fetch client details for delivery
    const client = await db.client.findUnique({
      where: { id: clientId },
      select: { firstName: true, lastName: true, email: true, phone: true },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const deliveryResults: string[] = []

    // Send email reminder
    const emailResult = await sendEmail(
      client.email,
      `Reminder from PetGroom Pro`,
      `<p>Dear ${client.firstName},</p><p>${message}</p><p>— The PetGroom Pro Team</p>`
    )
    if (emailResult.success) deliveryResults.push('EMAIL')

    // Send SMS if phone is available
    let sentVia = 'EMAIL'
    if (client.phone) {
      const smsResult = await sendSMS(client.phone, message)
      if (smsResult.success) {
        deliveryResults.push('SMS')
        sentVia = deliveryResults.length > 1 ? 'BOTH' : 'SMS'
      }
    }

    // Save reminder to history
    const reminder = await db.reminderHistory.create({
      data: {
        petId,
        clientId,
        type: type || 'GENERAL',
        message,
        sentVia,
        sentAt: new Date(),
      },
      include: {
        pet: { select: { id: true, name: true } },
        client: { select: { firstName: true, lastName: true, email: true } },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Reminder sent via ${deliveryResults.join(' & ') || 'saved (delivery failed)'}`,
      reminder: {
        id: reminder.id,
        pet: reminder.pet,
        client: reminder.client,
        type: reminder.type,
        sentAt: reminder.sentAt,
      },
    })
  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    )
  }
}
