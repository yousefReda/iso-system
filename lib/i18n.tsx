'use client';
// نظام الترجمة — إنجليزي افتراضي مع تبديل كامل للعربية (RTL)
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuditType, ClientStatus, NCStatus } from '@/lib/types';

export type Lang = 'en' | 'ar';

const dict: Record<string, [string, string]> = {
  // [en, ar]
  app_name: ['ISO CERT INTERNATIONAL', 'ISO CERT INTERNATIONAL'],
  app_sub: ['Certification Management System', 'نظام إدارة شهادات الأيزو'],
  // nav
  nav_overview: ['OVERVIEW', 'نظرة عامة'],
  nav_clients_sec: ['CLIENTS', 'العملاء'],
  nav_audits_sec: ['AUDITS', 'التدقيق'],
  nav_auditors_sec: ['AUDITORS', 'المدققون'],
  nav_system_sec: ['SYSTEM', 'النظام'],
  dashboard: ['Dashboard', 'الرئيسية'],
  statistics: ['Statistics', 'الإحصائيات'],
  clients: ['Clients', 'العملاء'],
  audit_files: ['Client Audit Files', 'ملفات التدقيق للعملاء'],
  certificates: ['Certificates', 'الشهادات'],
  audits: ['Audits', 'التدقيقات'],
  nc_tracker: ['NC Tracker', 'عدم المطابقة'],
  auditors: ['Auditors', 'المدققون'],
  auditor_files: ['Auditor Files', 'ملفات المدققين'],
  forms: ['Forms', 'النماذج'],
  settings: ['Settings', 'الإعدادات'],
  sign_out: ['Sign out', 'تسجيل الخروج'],
  system_admin: ['System Administrator', 'مدير النظام'],
  // header
  search_client: ['Search clients...', 'بحث عن عميل...'],
  notifications: ['Notifications', 'الإشعارات'],
  mark_all_read: ['Mark all read', 'تحديد الكل كمقروء'],
  no_notifications: ['No notifications', 'لا إشعارات'],
  toggle_dark: ['Toggle dark mode', 'تبديل الوضع الليلي'],
  toggle_lang: ['العربية', 'English'],
  home: ['Home', 'الرئيسية'],
  // login
  email: ['Email', 'البريد الإلكتروني'],
  password: ['Password', 'كلمة المرور'],
  sign_in: ['Sign in', 'تسجيل الدخول'],
  forgot_password: ['Forgot password?', 'نسيت كلمة المرور؟'],
  login_error: ['Invalid credentials, please try again', 'بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى'],
  apply_cert: ['Apply for ISO Certification', 'قدّم على شهادة أيزو'],
  // dashboard
  dash_sub: ['Certification body activity overview', 'نظرة عامة على نشاط جهة المنح'],
  active_clients: ['Active Clients', 'عملاء معتمدون'],
  upcoming_audits: ['Upcoming Audits', 'تدقيقات قادمة'],
  open_ncs: ['Open NCs', 'عدم مطابقات مفتوحة'],
  expiring_90: ['Expiring in 90 days', 'شهادات تنتهي خلال 90 يوماً'],
  valid_certs: ['Valid certificates', 'شهادات سارية'],
  needs_follow: ['Needs follow-up', 'تتطلب متابعة'],
  monthly_audits: ['Monthly Audits', 'التدقيقات الشهرية'],
  standards_dist: ['Standards Distribution', 'توزيع المواصفات'],
  monthly_ncs: ['Monthly Non-Conformities', 'عدم المطابقات الشهرية'],
  recent_activity: ['Recent Activity', 'آخر الأنشطة'],
  upcoming_audits_tbl: ['Upcoming Audits', 'التدقيقات القادمة'],
  client: ['Client', 'العميل'],
  type: ['Type', 'النوع'],
  date: ['Date', 'التاريخ'],
  lead_auditor: ['Lead Auditor', 'قائد الفريق'],
  no_upcoming: ['No upcoming audits', 'لا توجد تدقيقات قادمة'],
  new_client: ['New Client', 'عميل جديد'],
  calculator: ['Audit Days Calculator', 'حاسبة الأيام'],
  // clients
  clients_registered: ['clients registered', 'عميل مسجل'],
  search_name_number: ['Search by name or client number...', 'بحث بالاسم أو رقم العميل...'],
  all_statuses: ['All statuses', 'كل الحالات'],
  status: ['Status', 'الحالة'],
  standards: ['Standards', 'المواصفات'],
  employees: ['Employees', 'الموظفون'],
  cert_expiry: ['Cert. Expiry', 'انتهاء الشهادة'],
  actions: ['Actions', 'إجراءات'],
  view: ['View', 'عرض'],
  edit: ['Edit', 'تعديل'],
  no_matching_clients: ['No matching clients', 'لا يوجد عملاء مطابقون'],
  try_adjust: ['Try adjusting the search or add a new client', 'جرّب تعديل البحث أو أضف عميلاً جديداً'],
  showing: ['Showing', 'عرض'],
  of: ['of', 'من'],
  previous: ['Previous', 'السابق'],
  next: ['Next', 'التالي'],
  // client detail
  data_tab: ['Details', 'بيانات'],
  audits_tab: ['Audits', 'التدقيق'],
  forms_tab: ['Forms', 'النماذج'],
  files_tab: ['Attachments', 'المرفقات'],
  nc_tab: ['Non-Conformity', 'عدم المطابقة'],
  log_tab: ['History', 'السجل'],
  address: ['Address', 'العنوان'],
  city: ['City', 'المدينة'],
  contact_person: ['Contact Person', 'جهة الاتصال'],
  phone: ['Phone', 'الهاتف'],
  sites_shifts: ['Sites / Shifts', 'المواقع / الورديات'],
  integrated_audit: ['Integrated Audit', 'تدقيق متكامل'],
  iaf_codes: ['IAF Codes', 'أكواد IAF'],
  risk_level: ['Risk Level', 'مستوى المخاطر'],
  accreditation: ['Accreditation', 'الاعتماد'],
  issue_date: ['Issue Date', 'تاريخ الإصدار'],
  scope: ['Certification Scope', 'نطاق الاعتماد'],
  exclusions: ['Exclusions', 'الاستثناءات'],
  yes: ['Yes', 'نعم'],
  no: ['No', 'لا'],
  upload_site_photo: ['Upload site photo', 'رفع صورة للموقع'],
  attach_audit_file: ['Attach audit file', 'إرفاق ملف تدقيق'],
  client_file_empty: ['Client file is empty', 'ملف العميل فارغ'],
  upload_first: ['Upload the first file', 'رفع أول ملف'],
  upload_hint: ['Upload site photos and audit files to document the client file', 'ارفع صور الموقع وملفات التدقيق لتوثيق ملف العميل'],
  site_photo: ['Site photo', 'صورة موقع'],
  audit_file: ['Audit file', 'ملف تدقيق'],
  document: ['Document', 'مستند'],
  no_audits_yet: ['No audits yet', 'لا توجد تدقيقات بعد'],
  no_ncs: ['No non-conformity reports', 'لا توجد تقارير عدم مطابقة'],
  clean_record: ['Clean record 🎉', 'سجل نظيف 🎉'],
  no_logs: ['No logs yet', 'لا سجلات بعد'],
  generate_new_form: ['Generate new form', 'توليد نموذج جديد'],
  no_forms_client: ['No forms generated for this client', 'لا نماذج مولدة لهذا العميل'],
  open_forms_center: ['Open Forms Center', 'فتح مركز النماذج'],
  deadline: ['Deadline', 'الموعد النهائي'],
  closed_on: ['Closed', 'أُغلق'],
  completed: ['Completed', 'مكتمل'],
  planned: ['Planned', 'مخطط'],
  audits_count: ['Audits', 'تدقيقات'],
  open_nc_count: ['Open NC', 'NC مفتوح'],
  // wizard
  company_info: ['Company Info', 'بيانات الشركة'],
  standards_codes: ['Standards & Codes', 'المواصفات والأكواد'],
  review_calc: ['Review & Calculate', 'المراجعة والحساب'],
  company_name_en: ['Company Name (English) *', 'اسم الشركة (بالإنجليزية) *'],
  company_name_ar: ['Arabic Name', 'الاسم بالعربية'],
  position: ['Position', 'المنصب'],
  employees_req: ['Number of Employees *', 'عدد الموظفين *'],
  sites_count: ['Number of Sites', 'عدد المواقع'],
  shifts_count: ['Number of Shifts', 'عدد الورديات'],
  required_standards: ['Required Standards *', 'المواصفات المطلوبة *'],
  integrated_hint: ['Integrated audit — 20% MD11 reduction for multiple standards', 'تدقيق متكامل — خصم MD11 بنسبة 20% عند اختيار أكثر من مواصفة'],
  inc_dec_factors: ['Increase / Decrease Factors (documentation)', 'عوامل الزيادة والنقصان (توثيقي)'],
  inc_dec_hint: ['For documentation only — final decision rests with the human reviewer', 'للتوثيق فقط — القرار النهائي بيد المراجع البشري'],
  increase: ['Increase', 'زيادة'],
  decrease: ['Decrease', 'نقصان'],
  md5_input: ['Proposed MD5 reduction (0–20%)', 'خصم MD5 المقترح (0–20%)'],
  review_data: ['Review Data', 'مراجعة البيانات'],
  company: ['Company', 'الشركة'],
  integrated: ['Integrated', 'متكامل'],
  audit_days_calc: ['Audit Days Calculation', 'حساب أيام التدقيق'],
  calculate: ['Calculate', 'احسب'],
  before_reductions: ['Before reductions', 'قبل الخصومات'],
  total_reduction: ['Total reduction', 'إجمالي الخصم'],
  final_days: ['Final days', 'الأيام النهائية'],
  stage1: ['Stage 1', 'المرحلة 1'],
  stage2: ['Stage 2', 'المرحلة 2'],
  surveillance: ['Surveillance', 'المراقبة'],
  recert: ['Recertification', 'إعادة الاعتماد'],
  day: ['days', 'يوم'],
  press_calculate: ['Press "Calculate" to compute audit days per IAF MD5/MD9/MD11', 'اضغط "احسب" لعرض أيام التدقيق وفق IAF MD5/MD9/MD11'],
  save_client: ['Save Client', 'حفظ العميل'],
  back: ['Back', 'السابق'],
  // forms
  forms_center: ['Forms Center', 'مركز النماذج'],
  forms_sub: ['Official ISO-F06 forms — auto-filled from client data', 'النماذج الرسمية ISO-F06 — تعبئة تلقائية من بيانات العميل'],
  select_client_autofill: ['— Select a client for auto-fill —', '— اختر عميلاً للتعبئة التلقائية —'],
  select_client: ['— Select client —', '— اختر العميل —'],
  generate: ['Generate', 'توليد'],
  draft: ['Draft', 'مسودة'],
  printed: ['Printed', 'مطبوع'],
  not_generated: ['Not generated', 'غير مولد'],
  auto_fill: ['Auto-fill', 'تعبئة تلقائية'],
  save: ['Save', 'حفظ'],
  saved: ['Saved', 'تم الحفظ'],
  print_pdf: ['Print PDF', 'طباعة PDF'],
  form_yellow_hint: ['Select a client above then press "Auto-fill" — yellow cells are variables filled from the database', 'اختر عميلاً من الأعلى ثم اضغط "تعبئة تلقائية" — الخانات الصفراء هي المتغيرات وتُملأ من قاعدة البيانات'],
  signature: ['Signature', 'التوقيع'],
  unknown_form: ['Unknown form', 'نموذج غير معروف'],
  // audits
  audit_ops: ['audit operations', 'عملية تدقيق'],
  all: ['All', 'الكل'],
  in_progress: ['In progress', 'قيد التنفيذ'],
  no_audits: ['No audits', 'لا توجد تدقيقات'],
  audit_plan: ['Audit Plan', 'خطة التدقيق'],
  audit_results: ['Audit Results', 'نتائج التدقيق'],
  no_agenda: ['No agenda recorded for this audit', 'لا توجد أجندة مسجلة لهذا التدقيق'],
  audit_team: ['Audit Team', 'فريق التدقيق'],
  day_n: ['Day', 'اليوم'],
  clause: ['Clause', 'البند'],
  comment: ['Comment', 'التعليق'],
  create_checklist: ['Create checklist (Clauses 4–10)', 'إنشاء قائمة التحقق (البنود 4–10)'],
  no_results_yet: ['No results yet — create the checklist to start', 'لا نتائج بعد — أنشئ قائمة التحقق للبدء'],
  evidence_notes: ['Evidence and notes...', 'الأدلة والملاحظات...'],
  ncr_created: ['non-conformities auto-created — open NC tracker to follow up', 'عدم مطابقة أُنشئت تلقائياً — افتح متتبع NC للمتابعة'],
  observations: ['Observations', 'ملاحظات'],
  conform: ['Conform', 'مطابق'],
  audit_label: ['Audit', 'تدقيق'],
  // nc
  nc_sub: ['Drag cards between columns to update status', 'اسحب البطاقات بين الأعمدة لتحديث الحالة'],
  open_count: ['open', 'مفتوح'],
  no_cards: ['No cards — drop here', 'لا بطاقات — اسحب هنا'],
  // auditors
  auditors_calendar: ['Auditors & Calendar', 'المدققون والتقويم'],
  auditors_sub: ['Click any day to book an auditor — certification and conflicts checked instantly', 'اضغط على أي يوم لحجز مدقق — يتم فحص الاعتماد والتعارض فورياً'],
  add_auditor: ['Add Auditor', 'إضافة مدقق'],
  auditor_name: ['Auditor Name', 'اسم المدقق'],
  role: ['Role', 'الدور'],
  lead_auditor_role: ['Lead Auditor', 'قائد فريق'],
  auditor_role: ['Auditor', 'مدقق'],
  technical_expert: ['Technical Expert', 'خبير فني'],
  reviewer: ['Reviewer', 'مراجع'],
  certified_standards: ['Certified Standards', 'المواصفات المعتمد عليها'],
  certified_iafs: ['Certified IAF Codes (comma separated)', 'أكواد IAF المعتمدة (مفصولة بفواصل)'],
  color: ['Color', 'اللون'],
  booking: ['Book Auditor', 'حجز مدقق'],
  auditor: ['Auditor', 'المدقق'],
  standard: ['Standard', 'المواصفة'],
  from: ['From', 'من'],
  to: ['To', 'إلى'],
  checking: ['Checking...', 'جارٍ الفحص...'],
  cert_on_standard: ['Certified for the standard', 'معتمد على المواصفة'],
  cert_on_iaf: ['Certified for IAF Code', 'معتمد على IAF Code'],
  no_date_conflict: ['No date conflicts', 'لا يوجد تعارض بالمواعيد'],
  ok_can_assign: ['✓ OK — can be assigned', '✓ OK — يمكن التعيين'],
  not_ok: ['✗ NOT OK', '✗ NOT OK'],
  confirm_booking: ['Confirm booking', 'تأكيد الحجز'],
  save_anyway: ['Save despite warning', 'حفظ رغم التحذير'],
  prev_month: ['Previous month', 'الشهر السابق'],
  next_month: ['Next month', 'الشهر التالي'],
  select: ['— Select —', '— اختر —'],
  files: ['Files', 'ملفات'],
  upload_file: ['Upload file', 'رفع ملف'],
  cv: ['CV', 'سيرة ذاتية'],
  certificate_doc: ['Certificate', 'شهادة'],
  contract: ['Contract', 'عقد'],
  no_files: ['No files uploaded', 'لا ملفات مرفوعة'],
  // certificates page
  certs_sub: ['Issued certificates and their validity', 'الشهادات الصادرة وصلاحيتها'],
  cert_number: ['Certificate No.', 'رقم الشهادة'],
  valid: ['Valid', 'سارية'],
  expiring_soon: ['Expiring soon', 'تنتهي قريباً'],
  expired: ['Expired', 'منتهية'],
  suspended: ['Suspended', 'معلّقة'],
  view_certificate: ['View Certificate', 'عرض الشهادة'],
  no_certs: ['No certificates issued yet', 'لا شهادات صادرة بعد'],
  // audit files page
  audit_files_sub: ['Audit files and site photos per client', 'ملفات التدقيق وصور المواقع لكل عميل'],
  auditor_files_sub: ['Auditor documents: CVs, certificates, contracts', 'مستندات المدققين: سير ذاتية، شهادات، عقود'],
  open_client_file: ['Open client file', 'فتح ملف العميل'],
  // statistics
  stats_sub: ['Detailed performance analytics', 'تحليلات الأداء التفصيلية'],
  clients_by_status: ['Clients by Status', 'العملاء حسب الحالة'],
  nc_by_status: ['NCs by Status', 'عدم المطابقات حسب الحالة'],
  auditor_workload: ['Auditor Workload (bookings)', 'أعباء المدققين (حجوزات)'],
  total_clients: ['Total Clients', 'إجمالي العملاء'],
  total_audits: ['Total Audits', 'إجمالي التدقيقات'],
  total_ncs: ['Total NCs', 'إجمالي عدم المطابقات'],
  total_auditors: ['Active Auditors', 'المدققون النشطون'],
  // settings
  settings_sub: ['System and AI assistant settings', 'إعدادات النظام والمساعد الذكي'],
  ai_assistant: ['AI Assistant (Claude API)', 'المساعد الذكي (Claude API)'],
  ai_hint: ['Without a key the assistant runs in a simple local mode. Add a Claude API key from', 'بدون مفتاح يعمل المساعد بوضع محلي مبسط. أضف مفتاح Claude API من'],
  ai_hint2: ['to enable full understanding and command execution.', 'لتفعيل الفهم الحر الكامل وتنفيذ الأوامر.'],
  api_key: ['Claude API Key', 'مفتاح Claude API'],
  key_saved: ['✓ Key saved — assistant runs in full Claude mode', '✓ يوجد مفتاح محفوظ — المساعد يعمل بوضع Claude الكامل'],
  model: ['Model', 'الموديل'],
  company_data: ['Company Data', 'بيانات الشركة'],
  company_name: ['Company Name', 'اسم الشركة'],
  website: ['Website', 'الموقع الإلكتروني'],
  database: ['Database', 'قاعدة البيانات'],
  save_settings: ['Save Settings', 'حفظ الإعدادات'],
  users_admins: ['Users & Permissions', 'المستخدمون والصلاحيات'],
  users_hint: ['Create users and assign roles. Admins have full control.', 'أنشئ مستخدمين وحدد أدوارهم. الأدمن له تحكم كامل.'],
  add_user: ['Add User', 'إضافة مستخدم'],
  full_name: ['Full Name', 'الاسم الكامل'],
  admin: ['Admin', 'أدمن'],
  viewer_role: ['Viewer', 'مشاهد'],
  create_user: ['Create User', 'إنشاء المستخدم'],
  user_created: ['User created successfully', 'تم إنشاء المستخدم بنجاح'],
  delete: ['Delete', 'حذف'],
  admin_only: ['Admin access required', 'هذه الصلاحية للأدمن فقط'],
  confirm_delete_user: ['Delete this user?', 'حذف هذا المستخدم؟'],
  // register (public)
  register_title: ['Apply for ISO Certification', 'طلب اعتماد شهادة أيزو'],
  register_sub: ['Application Request For Quotation — ISO-F06-01', 'طلب عرض سعر للاعتماد — ISO-F06-01'],
  register_success: ['Your application was submitted successfully! Our team will contact you shortly.', 'تم إرسال طلبك بنجاح! سيتواصل معك فريقنا قريباً.'],
  register_ref: ['Your reference number', 'رقم الطلب المرجعي'],
  submit_application: ['Submit Application', 'إرسال الطلب'],
  back_to_login: ['Back to login', 'العودة لتسجيل الدخول'],
  entity_name: ['Entity Name *', 'اسم المنشأة *'],
  activities_desc: ['Describe your organization activities (Scope) *', 'صف أنشطة منشأتك (النطاق) *'],
  main_activity: ['Main Activity (IAF) *', 'النشاط الرئيسي (IAF) *'],
  // ai chat
  ai_title: ['ISO Smart Assistant', 'مساعد ISO الذكي'],
  ai_connected: ['Connected to the live database', 'متصل بقاعدة البيانات مباشرة'],
  ai_close: ['Close assistant', 'إغلاق المساعد'],
  ai_open: ['Open smart assistant', 'فتح المساعد الذكي'],
  ai_placeholder: ['Type your message...', 'اكتب رسالتك...'],
  ai_send: ['Send', 'إرسال'],
  ai_thinking: ['Thinking...', 'جارٍ التفكير...'],
  chip_new_client: ['New client', 'عميل جديد'],
  chip_add_nc: ['Add NC', 'إضافة NC'],
  chip_calc: ['Calculate days', 'احسب الأيام'],
  chip_stats: ['Statistics', 'إحصائيات'],
  ai_error: ['Sorry, a connection error occurred. Try again.', 'عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.'],
};

const AUDIT_TYPES: Record<AuditType, [string, string]> = {
  Stage1: ['Stage 1', 'المرحلة الأولى'],
  Stage2: ['Stage 2', 'المرحلة الثانية'],
  SUR1: ['Surveillance 1', 'مراقبة أولى'],
  SUR2: ['Surveillance 2', 'مراقبة ثانية'],
  RC: ['Recertification', 'إعادة اعتماد'],
};
const CLIENT_STATUSES: Record<ClientStatus, [string, string]> = {
  active: ['Certified', 'معتمد'],
  pending: ['Pending', 'قيد الاعتماد'],
  suspended: ['Suspended', 'معلّق'],
  expired: ['Expired', 'منتهي'],
};
const NC_STATUSES: Record<NCStatus, [string, string]> = {
  open: ['Open', 'مفتوح'],
  response_received: ['Response Received', 'استلام الرد'],
  under_review: ['Under Review', 'قيد المراجعة'],
  closed: ['Closed', 'مغلق'],
};

interface I18nCtx {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  tAuditType: (x: AuditType) => string;
  tClientStatus: (x: ClientStatus) => string;
  tNCStatus: (x: NCStatus) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lang') as Lang | null;
      if (saved === 'ar' || saved === 'en') setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch {}
  };

  const idx = lang === 'en' ? 0 : 1;
  const value: I18nCtx = {
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    setLang,
    t: (key) => dict[key]?.[idx] ?? key,
    tAuditType: (x) => AUDIT_TYPES[x]?.[idx] ?? x,
    tClientStatus: (x) => CLIENT_STATUSES[x]?.[idx] ?? x,
    tNCStatus: (x) => NC_STATUSES[x]?.[idx] ?? x,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
