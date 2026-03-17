import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Accessory from '@/models/Accessory';

export async function GET() {
  try {
    await connectToDatabase();
    const accessories = await Accessory.find({}).sort({ category: 1, name: 1 });
    return NextResponse.json(accessories);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const accessory = await Accessory.create(body);
    return NextResponse.json(accessory, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error creating accessory' }, { status: 400 });
  }
}
