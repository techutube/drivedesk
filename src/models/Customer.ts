import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  createdAt: Date;
}

const CustomerSchema: Schema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
