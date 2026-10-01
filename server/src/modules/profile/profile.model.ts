import mongoose, { Schema, Document } from 'mongoose';

export interface IAcademicRecord {
  degree: 'matric' | 'intermediate';
  board: string;
  rollNumber: string;
  passingYear: number;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  group?: string; // Pre-Medical, Pre-Engineering, ICS, Arts, etc.
}

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  fatherName: string;
  cnicNumber: string;
  dateOfBirth?: string;
  gender?: string;
  domicileDistrict?: string;
  domicileTehsil?: string;
  address?: string;
  phone?: string;
  matric?: IAcademicRecord;
  intermediate?: IAcademicRecord;
  verifiedDocuments: mongoose.Types.ObjectId[];
  isConfirmed: boolean;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicRecordSchema = new Schema(
  {
    degree: { type: String, enum: ['matric', 'intermediate'], required: true },
    board: { type: String, default: '' },
    rollNumber: { type: String, default: '' },
    passingYear: { type: Number },
    totalMarks: { type: Number, default: 1100 },
    obtainedMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    group: { type: String, default: '' },
  },
  { _id: false }
);

const StudentProfileSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    fullName: { type: String, default: '' },
    fatherName: { type: String, default: '' },
    cnicNumber: { type: String, default: '', index: true },
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: '' },
    domicileDistrict: { type: String, default: 'Kohat' },
    domicileTehsil: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    matric: AcademicRecordSchema,
    intermediate: AcademicRecordSchema,
    verifiedDocuments: [{ type: Schema.Types.ObjectId, ref: 'Document' }],
    isConfirmed: { type: Boolean, default: false },
    confirmedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const StudentProfile = mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
