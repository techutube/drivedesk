import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Car from '@/models/Car';

export async function GET() {
  try {
    await connectToDatabase();
    const cars = await Car.find({}).sort({ name: 1, variant: 1 });
    return NextResponse.json(cars);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    // In production, validate user role here (must be Admin) via jwt/middleware
    
    const car = await Car.create(body);
    return NextResponse.json(car, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error creating car' }, { status: 400 });
  }
}
