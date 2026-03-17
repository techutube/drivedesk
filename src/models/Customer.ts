import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  history: Array<{
    changedBy: mongoose.Types.ObjectId;
    at: Date;
    changes: Record<string, { from: any; to: any }>;
  }>;
  createdAt: Date;
}

const CustomerSchema: Schema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  history: [
    {
      changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      at: { type: Date, default: Date.now },
      changes: { type: Map, of: Schema.Types.Mixed },
    },
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
