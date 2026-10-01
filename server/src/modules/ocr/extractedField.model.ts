import mongoose, { Schema, Document } from 'mongoose';

export interface IExtractedField extends Document {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fieldName: string;
  fieldLabel: string;
  extractedValue: string;
  confidence: number; // 0 to 100
  isLowConfidence: boolean; // true if confidence < 85
  userVerified: boolean;
  userValue?: string;
  category: 'personal' | 'academic' | 'domicile' | 'general';
  createdAt: Date;
  updatedAt: Date;
}

const ExtractedFieldSchema: Schema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fieldName: { type: String, required: true },
    fieldLabel: { type: String, required: true },
    extractedValue: { type: String, default: '' },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    isLowConfidence: { type: Boolean, default: false },
    userVerified: { type: Boolean, default: false },
    userValue: { type: String },
    category: {
      type: String,
      enum: ['personal', 'academic', 'domicile', 'general'],
      default: 'general',
    },
  },
  {
    timestamps: true,
  }
);

ExtractedFieldSchema.index({ documentId: 1, fieldName: 1 });

export const ExtractedField = mongoose.model<IExtractedField>('ExtractedField', ExtractedFieldSchema);
