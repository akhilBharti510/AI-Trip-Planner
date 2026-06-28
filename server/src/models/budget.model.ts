import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  trip: mongoose.Types.ObjectId;
  flights: number;
  hotels: number;
  food: number;
  transport: number;
  activities: number;
  miscellaneous: number;
  total: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema: Schema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    flights: { type: Number, required: true, default: 0 },
    hotels: { type: Number, required: true, default: 0 },
    food: { type: Number, required: true, default: 0 },
    transport: { type: Number, required: true, default: 0 },
    activities: { type: Number, required: true, default: 0 },
    miscellaneous: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'INR' },
  },
  {
    timestamps: true,
  }
);

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
