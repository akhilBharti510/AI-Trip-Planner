import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  explanation?: string;
  timestamp: Date;
}

export interface IAIChat extends Document {
  user: mongoose.Types.ObjectId;
  trip: mongoose.Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema({
  role: { type: String, required: true, enum: ['user', 'assistant'] },
  content: { type: String, required: true },
  explanation: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const AIChatSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

export const AIChat = mongoose.model<IAIChat>('AIChat', AIChatSchema);
