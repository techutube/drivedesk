import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import User from '@/models/User';
import Car from '@/models/Car';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded: any = verifyToken(token);
    
    await connectToDatabase();
    
    // Compile simple dashboard stats based on role
    const stats: any = {};
    
    if (decoded.role === 'Super Admin') {
      stats.totalUsers = await User.countDocuments();
      stats.totalCars = await Car.countDocuments();
      stats.totalQuotations = await Quotation.countDocuments();
      
      const revenueAggr = await Quotation.aggregate([
        { $match: { status: 'Approved' } },
        { $group: { _id: null, totalSales: { $sum: "$pricing.finalOnRoadPrice" } } }
      ]);
      stats.totalSalesRevenue = revenueAggr.length > 0 ? revenueAggr[0].totalSales : 0;
      
    } else if (decoded.role === 'Sales Manager') {
      stats.totalPending = await Quotation.countDocuments({ status: 'Pending Approval' });
      stats.totalApproved = await Quotation.countDocuments({ status: 'Approved' });
      stats.totalRejected = await Quotation.countDocuments({ status: 'Rejected' });
      
    } else if (decoded.role === 'Sales Associate') {
      stats.myTotalQuotations = await Quotation.countDocuments({ salesperson: decoded.userId });
      stats.myPending = await Quotation.countDocuments({ salesperson: decoded.userId, status: 'Pending Approval' });
      stats.myApproved = await Quotation.countDocuments({ salesperson: decoded.userId, status: 'Approved' });
      stats.myRejected = await Quotation.countDocuments({ salesperson: decoded.userId, status: 'Rejected' });
    }

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
