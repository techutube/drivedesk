import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Quotation from '@/models/Quotation';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const quotation = await Quotation.findById(id)
      .populate('customer')
      .populate('car')
      .populate('accessories')
      .populate('salesperson', 'name email');
      
    if (!quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    return NextResponse.json(quotation);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// For updating status (Manager Approval) or general edits
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id } = await params;
    
    // In a real app we'd recalculate pricing if accessories/discounts changed via PUT as well.
    // For this prototype, assuming PUT just updates status or manager comments if those are the only fields provided.
    
    const updatedQuotation = await Quotation.findByIdAndUpdate(
      id, 
      { $set: body }, 
      { new: true }
    ).populate('customer car');
    
    if (!updatedQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedQuotation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating quotation' }, { status: 400 });
  }
}
