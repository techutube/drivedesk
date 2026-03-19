import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch(e) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    // Quick role check for filtering
    const token = req.headers.get('cookie')?.split('auth_token=')[1]?.split(';')[0];
    const decoded = token ? decodeJwt(token) : null;
    
    let filter = {};
    if (decoded) {
      if (decoded.role === 'Manager') {
        // Manager sees their team
        const directReports = await User.find({ reportsTo: decoded.userId }).select('_id');
        const directIds = directReports.map(m => m._id);
        const indirectReports = await User.find({ reportsTo: { $in: directIds } }).select('_id');
        const indirectIds = indirectReports.map(m => m._id);
        filter = { 
          $or: [
            { _id: decoded.userId },
            { reportsTo: decoded.userId },
            { reportsTo: { $in: directIds } }
          ]
        };
      } else if (decoded.role === 'Team Lead') {
        filter = { 
          $or: [
            { _id: decoded.userId },
            { reportsTo: decoded.userId }
          ]
        };
      }
      // Admins see all
    }

    const users = await User.find(filter, { passwordHash: 0 })
      .populate('reportsTo', 'name')
      .sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password, role, reportsTo } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Role-based authorization for creation
    const token = req.headers.get('cookie')?.split('auth_token=')[1]?.split(';')[0];
    const decoded = token ? decodeJwt(token) : null;
    
    if (role === 'Super Admin' || role === 'Admin') {
      if (!decoded || decoded.role !== 'Super Admin') {
        return NextResponse.json({ error: 'Only Super Admins can create new Admins or Super Admins.' }, { status: 403 });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Direct password save for prototype. Use bcrypt in production.
    const user = await User.create({
      name,
      email,
      passwordHash: password, 
      role: role || 'Salesperson',
      reportsTo: reportsTo || undefined
    });

    const { passwordHash: _, ...userResponse } = user.toObject();

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
