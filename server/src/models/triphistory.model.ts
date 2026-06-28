import mongoose, { Schema, Document } from 'mongoose';

export interface ITripHistory extends Document {
  trip: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  modifiedAt: Date;
  changeSummary: string;
  previousItinerary: unknown[];
  newItinerary: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

const TripHistorySchema: Schema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    modifiedAt: { type: Date, default: Date.now },
    changeSummary: { type: String, required: true },
    previousItinerary: { type: [Schema.Types.Mixed], required: true },
    newItinerary: { type: [Schema.Types.Mixed], required: true },
  },
  {
    timestamps: true,
  }
);

export const TripHistory = mongoose.model<ITripHistory>('TripHistory', TripHistorySchema);
