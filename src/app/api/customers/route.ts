import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Customer from '@/models/Customer';

export async function GET() {
  try {
    await connectToDatabase();
    const customers = await Customer.find({}).sort({ createdAt: -1 });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const customer = await Customer.create(body);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error creating customer' }, { status: 400 });
  }
}
