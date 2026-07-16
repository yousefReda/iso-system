import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { calculateAuditDays } from '@/lib/calculator/audit-calculator';
import type { AuditRule } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { employees, sites, isIntegrated, selectedStandards, md5ReductionPercent, increasePercent, clientId, save } = body;

  if (!employees || !Array.isArray(selectedStandards) || selectedStandards.length === 0) {
    return NextResponse.json({ error: 'عدد الموظفين والمواصفات مطلوبة' }, { status: 400 });
  }

  const { data: rules, error } = await supabase.from('audit_rules').select('*').order('employees_min');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = calculateAuditDays({
    employees: Number(employees),
    sites: Number(sites ?? 1),
    isIntegrated: Boolean(isIntegrated),
    selectedStandards,
    md5ReductionPercent: Number(md5ReductionPercent ?? 0),
    increasePercent: Number(increasePercent ?? 0),
    rules: rules as AuditRule[],
  });

  let calculationId: string | null = null;
  if (save) {
    const { data: calc } = await supabase
      .from('audit_calculations')
      .insert({
        client_id: clientId ?? null,
        standards_breakdown: result.standardsBreakdown,
        total_before_reduction: result.totalBeforeReduction,
        md5_reduction_percent: result.md5ReductionPercent,
        md9_reduction_percent: result.md9ReductionPercent,
        md11_reduction_percent: result.md11ReductionPercent,
        increase_percent: result.increasePercent,
        final_initial_audit_days: result.finalInitialAuditDays,
        rounded_final_audit_days: result.roundedFinalAuditDays,
        stage1_days: result.stage1Days,
        stage2_days: result.stage2Days,
        surveillance_days: result.surveillanceDays,
        recert_days: result.recertDays,
        increase_decrease_notes: body.increaseDecreaseNotes ?? [],
      })
      .select('id')
      .single();
    calculationId = calc?.id ?? null;
  }

  return NextResponse.json({ ...result, calculationId });
}
