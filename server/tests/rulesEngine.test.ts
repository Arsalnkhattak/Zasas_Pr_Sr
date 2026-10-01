import { RulesEngine } from '../src/modules/ocr/rulesEngine';

describe('RulesEngine - Unit Tests', () => {
  describe('CNIC Validator', () => {
    it('should validate and normalize standard Pakistani CNIC with hyphens', () => {
      const result = RulesEngine.validateCNIC('14301-8765432-1');
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('14301-8765432-1');
      expect(result.gender).toBe('Male'); // Last digit is 1 (odd)
    });

    it('should auto-format 13-digit raw CNIC without hyphens', () => {
      const result = RulesEngine.validateCNIC('1430187654322');
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('14301-8765432-2');
      expect(result.gender).toBe('Female'); // Last digit is 2 (even)
    });

    it('should reject invalid CNIC formats', () => {
      const result = RulesEngine.validateCNIC('12345-invalid-1');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject CNIC with improper length', () => {
      const result = RulesEngine.validateCNIC('14301-876543-1');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Academic Marks Validator', () => {
    it('should accurately calculate percentage and pass valid marks', () => {
      const result = RulesEngine.validateMarks(948, 1100);
      expect(result.isValid).toBe(true);
      expect(result.percentage).toBe(86.18);
      expect(result.warnings.length).toBe(0);
    });

    it('should reject when obtained marks exceed total marks', () => {
      const result = RulesEngine.validateMarks(1200, 1100);
      expect(result.isValid).toBe(false);
      expect(result.warnings[0]).toContain('cannot exceed total marks');
    });

    it('should reject negative marks or zero total marks', () => {
      const negResult = RulesEngine.validateMarks(-10, 1100);
      expect(negResult.isValid).toBe(false);

      const zeroTot = RulesEngine.validateMarks(500, 0);
      expect(zeroTot.isValid).toBe(false);
    });
  });

  describe('Date Sequence Validator', () => {
    it('should pass normal chronological academic progression', () => {
      const result = RulesEngine.validateDateSequence('2004-05-14', 2021, 2023);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBe(0);
    });

    it('should flag warning if Intermediate year is earlier than Matric', () => {
      const result = RulesEngine.validateDateSequence('2004-05-14', 2023, 2021);
      expect(result.isValid).toBe(false);
      expect(result.warnings.some((w) => w.includes('cannot be earlier'))).toBe(true);
    });
  });

  describe('Name Consistency Checker', () => {
    it('should report high match for identical names', () => {
      const match = RulesEngine.checkNameConsistency('Muhammad Usman Khan', 'Muhammad Usman Khan');
      expect(match.isConsistent).toBe(true);
      expect(match.score).toBe(100);
    });

    it('should detect and flag significant name discrepancies', () => {
      const match = RulesEngine.checkNameConsistency('Muhammad Usman Khan', 'Ali Raza', 0.8);
      expect(match.isConsistent).toBe(false);
      expect(match.warning).toBeDefined();
    });
  });
});
