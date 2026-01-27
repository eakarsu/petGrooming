import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const packages = await db.servicePackage.findMany({
      where: { isActive: true },
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                baseDuration: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { price: 'asc' },
    })

    const packagesWithSavings = packages.map(pkg => {
      const regularPrice = pkg.services.reduce(
        (sum, s) => sum + s.service.basePrice,
        0
      )
      const savings = regularPrice - pkg.price
      const savingsPercent = regularPrice > 0 ? (savings / regularPrice) * 100 : 0

      return {
        ...pkg,
        regularPrice,
        savings,
        savingsPercent: Math.round(savingsPercent),
        totalDuration: pkg.services.reduce(
          (sum, s) => sum + s.service.baseDuration,
          0
        ),
      }
    })

    return NextResponse.json(packagesWithSavings)
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, serviceIds } = body

    const pkg = await db.servicePackage.create({
      data: {
        name,
        description,
        price,
        services: {
          create: serviceIds.map((serviceId: string) => ({ serviceId })),
        },
      },
      include: {
        services: { include: { service: true } },
      },
    })

    return NextResponse.json(pkg)
  } catch (error) {
    console.error('Error creating package:', error)
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    )
  }
}
