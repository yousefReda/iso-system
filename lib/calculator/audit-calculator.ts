// محرك حاسبة أيام التدقيق — وفق IAF MD5 / MD9 / MD11
// مطابق لمنطق ملف ISO_CERT_AUDIT_CALCULATOR الأصلي

import type { AuditRule, StandardBreakdown } from '@/lib/types';

export interface CalculatorInput {
  employees: number;
  sites: number;
  isIntegrated: boolean;
  selectedStandards: string[];
  md5ReductionPercent?: number; // 0..20 يدخلها المستخدم
  increasePercent?: number; // عوامل الزيادة (توثيقي، 0 افتراضياً)
  rules: AuditRule[];
}

export interface CalculatorResult {
  standardsBreakdown: StandardBreakdown[];
  totalBeforeReduction: number;
  md5ReductionPercent: number;
  md9ReductionPercent: number;
  md11ReductionPercent: number;
  totalReductionPercent: number;
  increasePercent: number;
  finalInitialAuditDays: number;
  roundedFinalAuditDays: number;
  stage1Days: number;
  stage2Days: number;
  surveillanceDays: number;
  recertDays: number;
  riskLevel: string;
}

// تقريب لأقرب نصف يوم بحد أدنى 0.5
const roundHalf = (v: number) => Math.max(0.5, Math.round(v * 2) / 2);

export function referenceFor(standard: string): string {
  if (standard === 'ISO 13485') return 'IAF MD 9';
  if (standard === 'ISO 50001') return 'ISO 50003';
  return 'IAF MD 5';
}

export function calculateAuditDays(input: CalculatorInput): CalculatorResult {
  const { employees, isIntegrated, selectedStandards, rules } = input;

  // الخطوة 1: أيام الأساس لكل مواصفة حسب شريحة الموظفين
  const rule =
    rules.find((r) => employees >= r.employees_min && employees <= r.employees_max) ??
    rules[rules.length - 1];
  const baseDays = rule ? Number(rule.base_audit_days) : 0;
  const riskLevel = rule?.risk_level ?? 'Low';

  const standardsBreakdown: StandardBreakdown[] = selectedStandards.map((s) => ({
    standard: s,
    complexity: riskLevel,
    baseDays,
    reference: referenceFor(s),
  }));

  // الخطوة 2: الإجمالي قبل الخصومات
  const totalBeforeReduction = standardsBreakdown.reduce((sum, b) => sum + b.baseDays, 0);

  // الخطوة 3: خصم MD5 (0-20%)
  const md5 = Math.min(20, Math.max(0, input.md5ReductionPercent ?? 0));

  // الخطوة 4: خصم MD9 ثابت 20% إذا شملت المواصفات ISO 13485
  const md9 = selectedStandards.includes('ISO 13485') ? 20 : 0;

  // الخطوة 5: خصم MD11 للتدقيق المتكامل (أكثر من مواصفة)
  const md11 = isIntegrated && selectedStandards.length > 1 ? 20 : 0;

  // الخطوة 6: إجمالي الخصومات + عوامل الزيادة
  const increasePercent = Math.max(0, input.increasePercent ?? 0);
  const totalReductionPercent = Math.min(100, md5 + md9 + md11);
  const finalInitialAuditDays =
    totalBeforeReduction * (1 - totalReductionPercent / 100) * (1 + increasePercent / 100);

  // الخطوة 7: التقريب لأقرب نصف يوم
  const roundedFinalAuditDays =
    totalBeforeReduction > 0 ? roundHalf(finalInitialAuditDays) : 0;

  // الخطوة 8: توزيع المراحل — Stage1=30% / Stage2=70% / SUR=⅓ / RC=⅔
  const stage1Days = totalBeforeReduction > 0 ? roundHalf(roundedFinalAuditDays * 0.3) : 0;
  const stage2Days = totalBeforeReduction > 0 ? Math.max(0.5, roundedFinalAuditDays - stage1Days) : 0;
  const surveillanceDays = totalBeforeReduction > 0 ? roundHalf(roundedFinalAuditDays / 3) : 0;
  const recertDays = totalBeforeReduction > 0 ? roundHalf((roundedFinalAuditDays * 2) / 3) : 0;

  return {
    standardsBreakdown,
    totalBeforeReduction,
    md5ReductionPercent: md5,
    md9ReductionPercent: md9,
    md11ReductionPercent: md11,
    totalReductionPercent,
    increasePercent,
    finalInitialAuditDays: Math.round(finalInitialAuditDays * 100) / 100,
    roundedFinalAuditDays,
    stage1Days,
    stage2Days,
    surveillanceDays,
    recertDays,
    riskLevel,
  };
}
