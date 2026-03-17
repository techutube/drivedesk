import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();
    const { isActive, role } = body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive, role },
      { new: true, select: '-passwordHash' }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
