import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Car from '@/models/Car';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const resolvedParams = await params;
    const updatedCar = await Car.findByIdAndUpdate(resolvedParams.id, body, { new: true });
    
    if (!updatedCar) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedCar);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating car' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const deletedCar = await Car.findByIdAndDelete(resolvedParams.id);
    
    if (!deletedCar) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Car deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting car' }, { status: 400 });
  }
}
