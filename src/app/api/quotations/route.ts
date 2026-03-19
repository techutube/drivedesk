import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import Accessory from '@/models/Accessory';
import Car from '@/models/Car';
import Customer from '@/models/Customer';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// Helper to calculate pricing
async function calculatePricing(carId: string, accessoryIds: string[], charges: any, discounts: any, exchangeValue: number) {
  const car = await Car.findById(carId);
  const exShowroom = car ? car.exShowroomPrice : 0;
  
  let accessoriesTotal = 0;
  if (accessoryIds && accessoryIds.length > 0) {
    const accs = await Accessory.find({ _id: { $in: accessoryIds } });
    accessoriesTotal = accs.reduce((sum, acc) => sum + acc.price, 0);
  }

  const chargesTotal = 
    (charges?.registration || 0) + 
    (charges?.insurance || 0) + 
    (charges?.handling || 0) + 
    (charges?.fastag || 0) + 
    (charges?.extendedWarranty || 0);

  const subTotal = exShowroom + accessoriesTotal + chargesTotal;
  
  // Simple GST calculation logic (Assumed ~28% overall average for illustration, though in reality it varies by car category in India)
  // To keep it simple, we'll store GST explicitly or bake it into ex-showroom for now. Let's assume ex-showroom includes GST for simplicity,
  // or add a flat % if needed. We'll just set it to 0 as part of subTotal for this implementation unless requested otherwise.
  const gstTotal = Math.round(subTotal * 0.28); 

  const discountTotal = 
    (discounts?.dealer || 0) + 
    (discounts?.exchangeBonus || 0) + 
    (discounts?.corporate || 0) + 
    (discounts?.festival || 0) + 
    (discounts?.managerSpecial || 0);

  const finalOnRoadPrice = subTotal + gstTotal - discountTotal - (exchangeValue || 0);

  return {
    exShowroom,
    accessoriesTotal,
    chargesTotal,
    subTotal,
    gstTotal,
    discountTotal,
    exchangeValue: exchangeValue || 0,
    finalOnRoadPrice
  };
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    // Explicitly reference models to ensure they are registered in Mongoose
    // This prevents "MissingSchemaError: Schema hasn't been registered for model" errors in Next.js HMR
    const _models = [Quotation, Accessory, Car, Customer, User]; 

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    let userFilter = {};
    if (token) {
      const decoded: any = verifyToken(token);
      if (decoded) {
        if (decoded.role === 'Owner' || decoded.role === 'Admin' || decoded.role === 'Super Admin' || decoded.role === 'F&I Manager') {
          // These roles see everything
          userFilter = {};
        } else if (decoded.role === 'GM') {
          // GM sees all results from GSMs, TLs and Sales Associates in their subtree
          const gsms = await User.find({ reportsTo: decoded.userId }).select('_id');
          const gsmIds = gsms.map(u => u._id);
          const tls = await User.find({ reportsTo: { $in: gsmIds } }).select('_id');
          const tlIds = tls.map(u => u._id);
          const associates = await User.find({ reportsTo: { $in: tlIds } }).select('_id');
          const associateIds = associates.map(u => u._id);
          
          userFilter = { salesperson: { $in: [decoded.userId, ...gsmIds, ...tlIds, ...associateIds] } };
        } else if (decoded.role === 'GSM') {
          // GSM sees TLs and Associates in their subtree
          const tls = await User.find({ reportsTo: decoded.userId }).select('_id');
          const tlIds = tls.map(u => u._id);
          const associates = await User.find({ reportsTo: { $in: tlIds } }).select('_id');
          const associateIds = associates.map(u => u._id);
          
          userFilter = { salesperson: { $in: [decoded.userId, ...tlIds, ...associateIds] } };
        } else if (decoded.role === 'Sales Manager') {
          // Sales Manager sees their associates
          const associates = await User.find({ reportsTo: decoded.userId }).select('_id');
          const associateIds = associates.map(u => u._id);
          userFilter = { salesperson: { $in: [decoded.userId, ...associateIds] } };
        } else {
          // Sales Associate sees only their own
          userFilter = { salesperson: decoded.userId };
        }
      }
    }

    const quotations = await Quotation.find(userFilter)
      .populate('customer', 'name phone')
      .populate('car', 'name variant')
      .populate('salesperson', 'name')
      .sort({ createdAt: -1 });
      
    return NextResponse.json(quotations);
  } catch (error) {
    console.error("GET Quotations Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded: any = verifyToken(token);
    
    const body = await req.json();
    
    // Generate unique Quotation Number (e.g., QUOTE-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Quotation.countDocuments({ quotationNumber: { $regex: `^QUOTE-${dateStr}` } });
    const qNumber = `QUOTE-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const exchangeVal = body.exchangeVehicle?.expectedValue || 0;
    
    const pricing = await calculatePricing(
      body.car, 
      body.accessories, 
      body.charges, 
      body.discounts,
      exchangeVal
    );

    const quotation = await Quotation.create({
      ...body,
      quotationNumber: qNumber,
      salesperson: decoded.userId,
      pricing,
      status: body.status || 'Draft'
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    console.error("POST Quotation Error:", error);
    return NextResponse.json({ error: error.message || 'Error creating quotation' }, { status: 400 });
  }
}
