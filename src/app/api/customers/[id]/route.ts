import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Customer from '@/models/Customer';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const customer = await Customer.findById(resolvedParams.id);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const resolvedParams = await params;
    const updatedCustomer = await Customer.findByIdAndUpdate(resolvedParams.id, body, { new: true });
    
    if (!updatedCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedCustomer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating customer' }, { status: 400 });
  }
}
