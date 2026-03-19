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
      if (decoded.role === 'Owner' || decoded.role === 'Admin' || decoded.role === 'Super Admin') {
        filter = {};
      } else if (decoded.role === 'GM') {
        // GM sees GSMs reporting to them, their TLs, and Sales Associates
        const gsms = await User.find({ reportsTo: decoded.userId }).select('_id');
        const gsmIds = gsms.map(u => u._id);
        const tls = await User.find({ reportsTo: { $in: gsmIds } }).select('_id');
        const tlIds = tls.map(u => u._id);
        filter = { 
          $or: [
            { _id: decoded.userId },
            { reportsTo: decoded.userId }, // Direct GSMs
            { reportsTo: { $in: gsmIds } }, // TLs under those GSMs
            { reportsTo: { $in: tlIds } }   // Sales Associates under those TLs
          ]
        };
      } else if (decoded.role === 'GSM') {
        // GSM sees TLs reporting to them, and Sales Associates under them
        const tls = await User.find({ reportsTo: decoded.userId }).select('_id');
        const tlIds = tls.map(u => u._id);
        filter = { 
          $or: [
            { _id: decoded.userId },
            { reportsTo: decoded.userId }, // Direct TLs
            { reportsTo: { $in: tlIds } }    // Sales Associates under those TLs
          ]
        };
      } else if (decoded.role === 'Sales Manager') {
        // Sales Manager sees their reports (Sales Associates)
        filter = { 
          $or: [
            { _id: decoded.userId },
            { reportsTo: decoded.userId }
          ]
        };
      } else {
        // Sales Associate, F&I Manager, etc. see only themselves
        filter = { _id: decoded.userId };
      }
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
    
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role: currentUserRole } = decoded;
    let isAllowed = false;

    if (currentUserRole === 'Super Admin') {
      isAllowed = true;
    } else if (currentUserRole === 'Admin') {
      isAllowed = role !== 'Super Admin';
    } else if (currentUserRole === 'Owner') {
      isAllowed = !['Super Admin', 'Admin'].includes(role);
    } else if (currentUserRole === 'GM') {
      isAllowed = role === 'GSM';
    } else if (currentUserRole === 'GSM') {
      isAllowed = role === 'Sales Manager';
    } else if (currentUserRole === 'Sales Manager') {
      isAllowed = role === 'Team Lead';
    } else if (currentUserRole === 'Team Lead') {
      isAllowed = role === 'Sales Associate';
    }

    if (!isAllowed) {
      return NextResponse.json({ 
        error: `As a ${currentUserRole}, you are not authorized to create a ${role}.` 
      }, { status: 403 });
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
      role: role || 'Sales Associate',
      reportsTo: reportsTo || (['GM', 'GSM', 'Sales Manager', 'Team Lead'].includes(currentUserRole) ? decoded.userId : undefined)
    });

    const { passwordHash: _, ...userResponse } = user.toObject();

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
