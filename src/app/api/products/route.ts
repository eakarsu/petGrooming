import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    const category = searchParams.get('category')

    const where: any = {}
    if (activeOnly) where.isActive = true
    if (category) where.category = category

    const products = await db.product.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const product = await db.product.create({
      data: {
        name: body.name,
        description: body.description,
        sku: body.sku,
        category: body.category,
        price: body.price,
        cost: body.cost,
        quantity: body.quantity || 0,
        reorderLevel: body.reorderLevel || 5,
        isActive: body.isActive !== false,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
