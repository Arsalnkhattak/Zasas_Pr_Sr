import mongoose, { Schema, Document } from 'mongoose';

export type DocumentType =
  | 'cnic_front'
  | 'cnic_back'
  | 'domicile'
  | 'matric_marksheet'
  | 'inter_marksheet'
  | 'other';

export type DocumentStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

export interface IDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  docType: DocumentType;
  originalName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  verified: boolean;
  errorMessage?: string;
  validationWarnings: Array<{ field: string; message: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    docType: {
      type: String,
      enum: ['cnic_front', 'cnic_back', 'domicile', 'matric_marksheet', 'inter_marksheet', 'other'],
      required: true,
      index: true,
    },
    originalName: { type: String, required: true },
    storageKey: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded',
      index: true,
    },
    verified: { type: Boolean, default: false },
    errorMessage: { type: String },
    validationWarnings: [
      {
        field: { type: String },
        message: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
