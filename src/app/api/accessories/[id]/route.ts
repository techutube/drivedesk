import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Accessory from '@/models/Accessory';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const resolvedParams = await params;
    const updatedAcc = await Accessory.findByIdAndUpdate(resolvedParams.id, body, { new: true });
    
    if (!updatedAcc) {
      return NextResponse.json({ error: 'Accessory not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedAcc);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating accessory' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const deletedAcc = await Accessory.findByIdAndDelete(resolvedParams.id);
    
    if (!deletedAcc) {
      return NextResponse.json({ error: 'Accessory not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Accessory deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting accessory' }, { status: 400 });
  }
}
