import mongoose, { Schema, Document } from 'mongoose';

export interface IAccessory extends Document {
  name: string;
  price: number;
  category: string;
  applicableModels?: string[];
}

const AccessorySchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  applicableModels: [{ type: String }]
});

export default mongoose.models.Accessory || mongoose.model<IAccessory>('Accessory', AccessorySchema);
