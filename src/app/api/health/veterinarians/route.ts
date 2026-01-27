import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get unique veterinarian names from vaccination records
    const vaccinations = await db.vaccinationRecord.findMany({
      where: {
        veterinarian: {
          not: null,
        },
      },
      select: {
        veterinarian: true,
      },
      distinct: ['veterinarian'],
    })

    // Also get veterinarians from emergency contacts
    const emergencyVets = await db.emergencyContact.findMany({
      where: {
        isVeterinarian: true,
      },
      select: {
        name: true,
        vetClinicName: true,
      },
    })

    // Combine and deduplicate
    const vetNames = new Set<string>()

    vaccinations.forEach((v) => {
      if (v.veterinarian) vetNames.add(v.veterinarian)
    })

    emergencyVets.forEach((v) => {
      if (v.vetClinicName) {
        vetNames.add(`${v.name} - ${v.vetClinicName}`)
      } else {
        vetNames.add(v.name)
      }
    })

    const veterinarians = Array.from(vetNames).sort()

    return NextResponse.json(veterinarians)
  } catch (error) {
    console.error('Get veterinarians error:', error)
    return NextResponse.json({ error: 'Failed to fetch veterinarians' }, { status: 500 })
  }
}
