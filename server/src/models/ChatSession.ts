import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  evidence?: {
    toolName?: string;
    summary?: string;
    data?: any;
  };
  toolCalls?: any[];
  createdAt: Date;
}

export interface IChatSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IChatMessage[];
  contextState: {
    selectedPeriod?: string;
    accountFilter?: string;
    activeCategory?: string;
    previousIntent?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Financial Inquiry' },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: { type: String, required: true },
        evidence: { type: Schema.Types.Mixed },
        toolCalls: { type: [Schema.Types.Mixed] },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    contextState: {
      selectedPeriod: { type: String },
      accountFilter: { type: String },
      activeCategory: { type: String },
      previousIntent: { type: String },
    },
  },
  { timestamps: true }
);

export const ChatSession = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
