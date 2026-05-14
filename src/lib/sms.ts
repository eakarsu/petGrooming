import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio credentials not configured — SMS skipped')
    return { success: false, error: 'Twilio not configured' }
  }

  // Normalize phone number: ensure it starts with +
  const normalizedTo = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`

  try {
    const client = twilio(accountSid, authToken)
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: normalizedTo,
    })

    return { success: true, sid: message.sid }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Failed to send SMS:', message)
    return { success: false, error: message }
  }
}
