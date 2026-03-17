import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();

    // Get current user for history tracking
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded: any = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const existingCustomer = await Customer.findById(id);
    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Detect changes
    const changes: Record<string, { from: any; to: any }> = {};
    const relevantFields = ['name', 'phone', 'email', 'address', 'city', 'state'];
    
    let hasChanges = false;
    for (const field of relevantFields) {
      const oldValue = existingCustomer[field];
      const newValue = body[field];
      
      if (newValue !== undefined && oldValue !== newValue) {
        changes[field] = { from: oldValue, to: newValue };
        existingCustomer[field] = newValue;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      // Add to history
      existingCustomer.history.push({
        changedBy: decoded.userId,
        at: new Date(),
        changes: changes
      });
      await existingCustomer.save();
    }

    return NextResponse.json(existingCustomer);
  } catch (error: any) {
    console.error('Update Customer Error:', error);
    return NextResponse.json({ error: error.message || 'Error updating customer' }, { status: 400 });
  }
}
