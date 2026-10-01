export interface ValidationResult {
  isValid: boolean;
  warnings: Array<{ field: string; message: string }>;
  normalizedValues: Record<string, any>;
}

export class RulesEngine {
  /**
   * Validates Pakistani CNIC format (XXXXX-XXXXXXX-X)
   */
  static validateCNIC(cnic: string): { isValid: boolean; normalized?: string; gender?: string; error?: string } {
    if (!cnic) return { isValid: false, error: 'CNIC is required' };

    // Clean any spaces or non-digit/non-hyphen characters
    const cleaned = cnic.replace(/[^\d-]/g, '');

    // Allow raw 13 digits without hyphens and auto-format
    let formatted = cleaned;
    if (/^\d{13}$/.test(cleaned)) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12)}`;
    }

    const cnicRegex = /^[1-7]\d{4}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(formatted)) {
      return {
        isValid: false,
        error: 'Invalid CNIC format. Expected format: 12345-1234567-1 (13 digits)',
      };
    }

    // Last digit determines gender in Pakistani NADRA CNIC: odd = Male, even = Female
    const lastDigit = parseInt(formatted.slice(-1), 10);
    const inferredGender = lastDigit % 2 === 1 ? 'Male' : 'Female';

    return { isValid: true, normalized: formatted, gender: inferredGender };
  }

  /**
   * Validates academic marks logic
   */
  static validateMarks(
    obtained: number | string,
    total: number | string
  ): { isValid: boolean; percentage: number; warnings: string[] } {
    const obt = typeof obtained === 'string' ? parseFloat(obtained) : obtained;
    const tot = typeof total === 'string' ? parseFloat(total) : total;
    const warnings: string[] = [];

    if (isNaN(obt) || isNaN(tot)) {
      return { isValid: false, percentage: 0, warnings: ['Obtained or total marks are not valid numbers'] };
    }

    if (tot <= 0) {
      warnings.push('Total marks must be greater than zero');
      return { isValid: false, percentage: 0, warnings };
    }

    if (obt < 0) {
      warnings.push('Obtained marks cannot be negative');
      return { isValid: false, percentage: 0, warnings };
    }

    if (obt > tot) {
      warnings.push(`Obtained marks (${obt}) cannot exceed total marks (${tot})`);
      return { isValid: false, percentage: 0, warnings };
    }

    const percentage = Number(((obt / tot) * 100).toFixed(2));
    return { isValid: true, percentage, warnings };
  }

  /**
   * Validates plausible date sequence (e.g. DOB vs Matric year vs Intermediate year)
   */
  static validateDateSequence(
    dobStr?: string,
    matricYear?: number | string,
    interYear?: number | string
  ): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const currentYear = new Date().getFullYear();

    const mYear = matricYear ? Number(matricYear) : null;
    const iYear = interYear ? Number(interYear) : null;

    if (mYear && (mYear < 1990 || mYear > currentYear)) {
      warnings.push(`Matric passing year ${mYear} appears out of range`);
    }

    if (iYear && (iYear < 1992 || iYear > currentYear)) {
      warnings.push(`Intermediate passing year ${iYear} appears out of range`);
    }

    if (mYear && iYear && iYear < mYear) {
      warnings.push(`Intermediate passing year (${iYear}) cannot be earlier than Matric year (${mYear})`);
    }

    if (mYear && iYear && iYear - mYear < 1) {
      warnings.push(`Intermediate is typically completed at least 2 years after Matric (difference: ${iYear - mYear} yr)`);
    }

    if (dobStr) {
      const birthDate = new Date(dobStr);
      if (!isNaN(birthDate.getTime())) {
        const birthYear = birthDate.getFullYear();
        if (mYear && mYear - birthYear < 13) {
          warnings.push(`Age at Matric graduation (${mYear - birthYear} yrs) is unusually low`);
        }
      }
    }

    return { isValid: warnings.length === 0, warnings };
  }

  /**
   * Checks string similarity for name consistency across documents using Levenshtein distance
   */
  static stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.trim().toLowerCase();
    const s2 = str2.trim().toLowerCase();

    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    const track = Array(s2.length + 1)
      .fill(null)
      .map(() => Array(s1.length + 1).fill(null));

    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const distance = track[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - distance / maxLength;
  }

  /**
   * Checks name consistency across documents
   */
  static checkNameConsistency(
    nameInCnic: string,
    nameInMarksheet: string,
    threshold = 0.8
  ): { isConsistent: boolean; score: number; warning?: string } {
    if (!nameInCnic || !nameInMarksheet) {
      return { isConsistent: true, score: 1.0 };
    }

    const score = this.stringSimilarity(nameInCnic, nameInMarksheet);
    if (score < threshold) {
      return {
        isConsistent: false,
        score: Math.round(score * 100),
        warning: `Candidate name discrepancy detected between documents ("${nameInCnic}" vs "${nameInMarksheet}"). Match: ${Math.round(score * 100)}%`,
      };
    }

    return { isConsistent: true, score: Math.round(score * 100) };
  }
}
