import mongoose, { Schema, Document } from 'mongoose';

export interface ICar extends Document {
  name: string;
  variant: string;
  fuelType: 'Petrol' | 'Diesel' | 'EV' | 'CNG';
  transmission: 'Manual' | 'Automatic' | 'AMT' | 'DCA';
  exShowroomPrice: number;
  availableColors: string[];
  category: 'Hatchback' | 'Sedan' | 'SUV' | 'EV';
  carLengthMeters?: number;
  engineCapacityCC?: number;
  isSUV?: boolean;
}

const CarSchema: Schema = new Schema({
  name: { type: String, required: true },
  variant: { type: String, required: true },
  fuelType: { type: String, enum: ['Petrol', 'Diesel', 'EV', 'CNG'], required: true },
  transmission: { type: String, enum: ['Manual', 'Automatic', 'AMT', 'DCA'], required: true },
  exShowroomPrice: { type: Number, required: true },
  availableColors: [{ type: String }],
  category: { type: String, enum: ['Hatchback', 'Sedan', 'SUV', 'EV'], required: true },
  carLengthMeters: { type: Number },
  engineCapacityCC: { type: Number },
  isSUV: { type: Boolean, default: false }
});

export default mongoose.models.Car || mongoose.model<ICar>('Car', CarSchema);
