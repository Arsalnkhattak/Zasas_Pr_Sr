import mongoose from 'mongoose';
import { StudentProfile, IStudentProfile } from './profile.model';
import { ExtractedField } from '../ocr/extractedField.model';
import { DocumentModel } from '../documents/document.model';
import { ApiError } from '../../utils/errors';
import { RulesEngine } from '../ocr/rulesEngine';

export interface ConfirmProfileDto {
  documentId: string;
  fields: Array<{
    fieldName: string;
    verifiedValue: string;
  }>;
}

export class ProfileService {
  async getProfile(userId: string): Promise<IStudentProfile | null> {
    return StudentProfile.findOne({ userId });
  }

  async updateExtractedField(
    fieldId: string,
    userId: string,
    userValue: string
  ) {
    const field = await ExtractedField.findOne({ _id: fieldId, userId });
    if (!field) {
      throw ApiError.notFound('Extracted field not found');
    }

    field.userValue = userValue;
    field.userVerified = true;
    field.isLowConfidence = false; // Resolved by user edit
    await field.save();

    return field;
  }

  async confirmDocumentAndSyncProfile(userId: string, data: ConfirmProfileDto) {
    const { documentId, fields } = data;

    const doc = await DocumentModel.findOne({ _id: documentId, userId });
    if (!doc) {
      throw ApiError.notFound('Document not found');
    }

    // 1. Update each extracted field as user verified
    for (const item of fields) {
      await ExtractedField.findOneAndUpdate(
        { documentId: doc._id, fieldName: item.fieldName },
        {
          userValue: item.verifiedValue,
          userVerified: true,
          isLowConfidence: false,
        }
      );
    }

    // 2. Mark document as verified
    doc.verified = true;
    await doc.save();

    // 3. Upsert StudentProfile
    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      profile = new StudentProfile({
        userId: new mongoose.Types.ObjectId(userId),
        verifiedDocuments: [],
      });
    }

    // Add document to verified list if not already present
    if (!profile.verifiedDocuments.some((id) => id.toString() === documentId)) {
      profile.verifiedDocuments.push(doc._id);
    }

    // Map fields depending on document type
    const fieldMap = new Map(fields.map((f) => [f.fieldName, f.verifiedValue]));

    if (doc.docType === 'cnic_front') {
      if (fieldMap.has('full_name')) profile.fullName = fieldMap.get('full_name')!;
      if (fieldMap.has('father_name')) profile.fatherName = fieldMap.get('father_name')!;
      if (fieldMap.has('cnic_number')) profile.cnicNumber = fieldMap.get('cnic_number')!;
      if (fieldMap.has('dob')) profile.dateOfBirth = fieldMap.get('dob')!;
      if (fieldMap.has('gender')) profile.gender = fieldMap.get('gender')!;
    } else if (doc.docType === 'cnic_back') {
      if (fieldMap.has('permanent_address')) profile.address = fieldMap.get('permanent_address')!;
    } else if (doc.docType === 'domicile') {
      if (fieldMap.has('district')) profile.domicileDistrict = fieldMap.get('district')!;
      if (fieldMap.has('tehsil')) profile.domicileTehsil = fieldMap.get('tehsil')!;
    } else if (doc.docType === 'matric_marksheet') {
      const tot = Number(fieldMap.get('total_marks')) || 1100;
      const obt = Number(fieldMap.get('obtained_marks')) || 0;
      const pct = tot > 0 ? Number(((obt / tot) * 100).toFixed(2)) : 0;

      profile.matric = {
        degree: 'matric',
        board: fieldMap.get('board') || 'BISE Kohat',
        rollNumber: fieldMap.get('roll_number') || '',
        passingYear: Number(fieldMap.get('passing_year')) || 2021,
        totalMarks: tot,
        obtainedMarks: obt,
        percentage: pct,
      };
    } else if (doc.docType === 'inter_marksheet') {
      const tot = Number(fieldMap.get('total_marks')) || 1100;
      const obt = Number(fieldMap.get('obtained_marks')) || 0;
      const pct = tot > 0 ? Number(((obt / tot) * 100).toFixed(2)) : 0;

      profile.intermediate = {
        degree: 'intermediate',
        board: fieldMap.get('board') || 'BISE Kohat',
        rollNumber: fieldMap.get('roll_number') || '',
        passingYear: Number(fieldMap.get('passing_year')) || 2023,
        totalMarks: tot,
        obtainedMarks: obt,
        percentage: pct,
        group: fieldMap.get('group') || 'Pre-Engineering',
      };
    }

    profile.isConfirmed = true;
    profile.confirmedAt = new Date();
    await profile.save();

    return profile;
  }
}

export const profileService = new ProfileService();
