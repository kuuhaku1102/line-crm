import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const form = await prisma.form.findUnique({
      where: { id: params.id },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(form)
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { label, fieldType, options, required } = body

    if (!label || !fieldType) {
      return NextResponse.json(
        { error: 'label and fieldType are required' },
        { status: 400 }
      )
    }

    // Get max sortOrder
    const lastField = await prisma.formField.findFirst({
      where: { formId: params.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const nextSortOrder = (lastField?.sortOrder || 0) + 1

    const field = await prisma.formField.create({
      data: {
        formId: params.id,
        label,
        fieldType,
        options: options ? JSON.stringify(options) : null,
        required: required || false,
        sortOrder: nextSortOrder,
      },
    })

    return NextResponse.json(field, { status: 201 })
  } catch (error) {
    console.error('Error creating form field:', error)
    return NextResponse.json(
      { error: 'Failed to create field' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const fieldId = searchParams.get('fieldId')

    if (!fieldId) {
      return NextResponse.json(
        { error: 'fieldId is required' },
        { status: 400 }
      )
    }

    await prisma.formField.delete({
      where: { id: fieldId },
    })

    return NextResponse.json({ message: 'Field deleted' })
  } catch (error) {
    console.error('Error deleting form field:', error)
    return NextResponse.json(
      { error: 'Failed to delete field' },
      { status: 500 }
    )
  }
}
