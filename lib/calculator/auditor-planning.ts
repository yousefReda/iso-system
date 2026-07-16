// التحقق من أهلية المدقق وكشف تعارض المواعيد

export interface PlanningBooking {
  auditor_id: string;
  start_date: string;
  end_date: string;
  client_name?: string;
}

export interface AssignmentCheckInput {
  auditor: {
    id: string;
    name: string;
    certified_standards: string[];
    certified_iaf_codes: string[];
  };
  standardCode: string;
  iafCode: string;
  startDate: string;
  endDate: string;
  existingBookings: PlanningBooking[];
}

export interface AssignmentCheckResult {
  isCertifiedStandard: boolean;
  isCertifiedIaf: boolean;
  hasDateConflict: boolean;
  conflictWith: string | null;
  finalStatus: 'OK' | 'NOT_OK';
  reasons: string[];
}

export function checkAuditorAssignment(input: AssignmentCheckInput): AssignmentCheckResult {
  const { auditor, standardCode, iafCode, startDate, endDate, existingBookings } = input;
  const reasons: string[] = [];

  const isCertifiedStandard = auditor.certified_standards.includes(standardCode);
  if (!isCertifiedStandard) {
    reasons.push(`المدقق ${auditor.name} غير معتمد على مواصفة ${standardCode}`);
  }

  const isCertifiedIaf = auditor.certified_iaf_codes.includes(iafCode);
  if (!isCertifiedIaf) {
    reasons.push(`المدقق ${auditor.name} غير معتمد على IAF Code ${iafCode}`);
  }

  // تعارض التواريخ: startA <= endB AND endA >= startB
  const s = new Date(startDate).getTime();
  const e = new Date(endDate).getTime();
  const conflict = existingBookings.find((b) => {
    if (b.auditor_id !== auditor.id) return false;
    const bs = new Date(b.start_date).getTime();
    const be = new Date(b.end_date).getTime();
    return s <= be && e >= bs;
  });
  const hasDateConflict = Boolean(conflict);
  if (conflict) {
    reasons.push(
      `تعارض مواعيد: المدقق محجوز من ${conflict.start_date} إلى ${conflict.end_date}${conflict.client_name ? ` لعميل ${conflict.client_name}` : ''}`
    );
  }

  const finalStatus = isCertifiedStandard && isCertifiedIaf && !hasDateConflict ? 'OK' : 'NOT_OK';
  return {
    isCertifiedStandard,
    isCertifiedIaf,
    hasDateConflict,
    conflictWith: conflict?.client_name ?? null,
    finalStatus,
    reasons,
  };
}
