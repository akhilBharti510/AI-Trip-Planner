import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity {
  time?: string;
  activity: string;
  description?: string;
  location?: string;
  cost?: number;
}

export interface IDayPlan {
  dayNumber: number;
  activities: IActivity[];
}

export interface ITrip extends Document {
  user: mongoose.Types.ObjectId;
  destination: string;
  startDate: Date;
  endDate: Date;
  durationInDays: number;
  budgetLimit: number;
  companions: string;
  interests: string[];
  itinerary: IDayPlan[];
  budgetEstimation?: mongoose.Types.ObjectId;
  hotelSuggestions: mongoose.Types.ObjectId[];
  isSaved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema({
  time: { type: String, trim: true },
  activity: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  location: { type: String, trim: true },
  cost: { type: Number, default: 0 },
});

const DayPlanSchema = new Schema({
  dayNumber: { type: Number, required: true },
  activities: [ActivitySchema],
});

const TripSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    destination: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    durationInDays: { type: Number, required: true },
    budgetLimit: { type: Number, required: true },
    companions: { type: String, required: true, trim: true },
    interests: { type: [String], default: [] },
    itinerary: [DayPlanSchema],
    budgetEstimation: { type: Schema.Types.ObjectId, ref: 'Budget' },
    hotelSuggestions: [{ type: Schema.Types.ObjectId, ref: 'Hotel' }],
    isSaved: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Compound index for user trips sorted by creation
TripSchema.index({ user: 1, createdAt: -1 });

export const Trip = mongoose.model<ITrip>('Trip', TripSchema);
