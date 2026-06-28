import mongoose, { Schema, Document } from 'mongoose';

export interface IHotel extends Document {
  trip: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  pricePerNight: number;
  rating?: number;
  address?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HotelSchema: Schema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    pricePerNight: { type: Number, required: true },
    rating: { type: Number, min: 0, max: 5 },
    address: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

export const Hotel = mongoose.model<IHotel>('Hotel', HotelSchema);
