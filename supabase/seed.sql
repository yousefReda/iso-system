-- ISO CERT INTERNATIONAL — Seed data (البيانات المرجعية من حاسبة الإكسل المعتمدة)
-- نفّذ بعد schema.sql

insert into standards (code, name_ar, name_en, reference_standard) values
('ISO 9001','نظام إدارة الجودة','Quality Management System','IAF MD 5'),
('ISO 14001','نظام الإدارة البيئية','Environmental Management System','IAF MD 5'),
('ISO 45001','نظام إدارة الصحة والسلامة المهنية','Occupational Health & Safety','IAF MD 5'),
('ISO 13485','نظام إدارة جودة الأجهزة الطبية','Medical Devices QMS','IAF MD 9'),
('ISO 22301','نظام إدارة استمرارية الأعمال','Business Continuity','IAF MD 5'),
('ISO 50001','نظام إدارة الطاقة','Energy Management','ISO 50003')
on conflict (code) do nothing;

insert into iaf_codes (code, description_en, description_ar) values
('28','Construction','المقاولات والبناء'),
('37','Education','التعليم'),
('34','Engineering services','الخدمات الهندسية'),
('32','Financial intermediation; real estate; renting','الوساطة المالية والعقارات والتأجير'),
('33','Information technology','تقنية المعلومات'),
('35','Other services','خدمات أخرى'),
('1.7','Parts or Services','قطع غيار أو خدمات'),
('36','Public administration','الإدارة العامة'),
('31','Transport, storage and communication','النقل والتخزين والاتصالات'),
('29','Wholesale and retail trade; Repair of motor vehicles','تجارة الجملة والتجزئة وإصلاح المركبات')
on conflict (code) do nothing;

insert into audit_rules (employees_min, employees_max, base_audit_days, risk_level) values
(1,5,1.5,'Low'),(6,10,2,'Low'),(11,25,3,'Low'),(26,45,4,'Medium'),(46,65,5,'Medium'),
(66,85,6,'Medium'),(86,125,7,'Medium'),(126,175,8,'High'),(176,275,9,'High'),(276,425,10,'High'),
(426,625,11,'High'),(626,875,12,'High'),(876,1175,13,'High'),(1176,1550,14,'High');

insert into reduction_factors (factor_type, description_ar, description_en, weight_percent, is_fixed) values
('MD5','العميل غير مسؤول عن التصميم أو عناصر أخرى غير مشمولة بالنطاق (الجودة فقط)','Client is not design responsible (QMS only)',4.3,false),
('MD5','موقع صغير جداً بالنسبة لعدد العاملين','Very small site for number of personnel',4.3,false),
('MD5','نضج نظام الإدارة','Maturity of management system',4.3,false),
('MD5','معرفة مسبقة بنظام إدارة العميل','Prior knowledge of the client management system',4.3,false),
('MD5','جاهزية العميل للاعتماد','Client preparedness for certification',4.3,false),
('MD5','مستوى أتمتة عالٍ','High level of automation',4.3,false),
('MD5','عاملون خارج الموقع يمكن تدقيق التزامهم عبر السجلات','Staff working off location auditable through records',4.3,false),
('MD9','نطاق المنظمة لا يشمل التصنيع','Scope does not include manufacturing',6.7,false),
('MD9','تقليص نطاق منتجات المصنّع منذ آخر تدقيق','Reduction of product range since last audit',6.7,false),
('MD9','تقليص عمليات التصميم/الإنتاج منذ آخر تدقيق','Reduction of design/production process since last audit',6.7,false),
('MD9','خصم ثابت: نطاق ISO 13485 قطع غيار/خدمات فقط','Fixed: ISO 13485 scope limited to Parts or Services only',20,true);

insert into md11_integration_factors (description_ar, description_en, weight_percent) values
('منظومة توثيق متكاملة تشمل تعليمات العمل','Integrated documentation set including work instructions',2.85),
('مراجعات إدارة تراعي استراتيجية العمل الشاملة','Management reviews consider overall business strategy',2.85),
('نهج متكامل للتدقيق الداخلي','Integrated approach to internal audits',2.85),
('نهج متكامل للسياسة والأهداف','Integrated approach to policy and objectives',2.85),
('نهج متكامل لعمليات النظام','Integrated approach to system processes',2.85),
('نهج متكامل لآليات التحسين','Integrated approach to improvement mechanisms',2.85),
('دعم ومسؤوليات إدارية متكاملة','Integrated management support and responsibilities',2.9);

insert into increase_decrease_rules (rule_type, description_ar, description_en, weight_percent) values
('increase','لوجستيات معقدة أو أكثر من مبنى/موقع عمل','Complex logistics / more than one building or location',5),
('increase','عاملون يتحدثون أكثر من لغة (حاجة لمترجم)','Staff speaking more than one language',5),
('increase','موقع كبير جداً بالنسبة لعدد العاملين','Very large site for number of employees',5),
('increase','درجة تنظيم/مخاطر عالية في القطاع','High degree of regulation / high risk sector',5),
('increase','عمليات مسندة للغير تتطلب وقت تدقيق إضافي','Outsourced processes requiring additional audit time',5),
('decrease','معرفة مسبقة بنظام المنظمة','Prior knowledge of organization system',5),
('decrease','جاهزية العميل للاعتماد','Client preparedness for certification',5),
('decrease','مستوى أتمتة عالٍ','High level of automation',5),
('decrease','أنشطة متكررة منخفضة المخاطر','Low risk repetitive activities',5),
('decrease','عاملون خارج الموقع يمكن تدقيقهم عن بعد','Off-location staff auditable remotely',5);

-- المدققون الـ 19 (من قاعدة بيانات المدققين المعتمدة)
insert into auditors (name, role, certified_standards, certified_iaf_codes, iso13485_notes, color) values
('ASEM SANAD','lead_auditor','["ISO 9001","ISO 14001","ISO 45001","ISO 13485","ISO 50001","ISO 22301"]','["01","03","04","05","06","07","12","13","14","15","19","28","29","30","31","33","34","35","37","38"]','Parts or services; Non-active medical devices','#1B3A6B'),
('AMIRA ABDELHADY','lead_auditor','["ISO 9001","ISO 14001","ISO 45001","ISO 13485","ISO 50001","ISO 22301"]','["06","07","12","13","28","29","31","33","34","35"]','Parts or services','#2E5FA3'),
('ASHRAF ELSAYED','auditor','["ISO 9001","ISO 14001","ISO 13485"]','["03","15","28","31","33","34","35"]','Parts or services','#E8A020'),
('ASMAA AMR','reviewer','["ISO 9001","ISO 45001","ISO 13485"]','["10","12","13","14","16","28","31","33","34","35"]','A1.7 Parts or services','#1A7A4A'),
('OSAMA ALADLI','lead_auditor','["ISO 9001","ISO 14001","ISO 45001","ISO 13485","ISO 50001","ISO 22301"]','["03","05","06","07","12","13","14","15","28","29","31","33","34","35"]','Parts or services','#C0392B'),
('TAREK AL-SHARABI','auditor','["ISO 9001","ISO 14001","ISO 45001","ISO 50001","ISO 22301"]','["03","05","06","07","12","14","15","16","28","29","31","33","34","35"]',null,'#7C3AED'),
('ISLAM ABDELAAL','auditor','["ISO 9001","ISO 14001","ISO 45001","ISO 13485"]','["03","05","06","07","12","13","15","18","28","31","33","34","35"]','Parts or services','#0891B2'),
('MOHAMED EL-SAWY','auditor','["ISO 9001","ISO 14001","ISO 45001","ISO 13485"]','["13","14","15","17","18","19","28","29","31","33","34","35","37","38"]','Parts or services','#DB2777'),
('DOAA MOHAMED AHMED','auditor','["ISO 9001","ISO 13485"]','["03","04","05","16","28","31","33","34","35"]','IVD; Parts or services; Non-active medical devices','#65A30D'),
('ASMAA SHAWKY MAKLAD','auditor','["ISO 9001","ISO 13485"]','["03","14","28","31","34","35"]','A1.7 Parts or services','#EA580C'),
('EHDAA SHAWKY MAKLAD','auditor','["ISO 9001","ISO 13485"]','["03","14","28","31","34","35"]','A1.7 Parts or services','#0D9488'),
('MONA NOSSIER','lead_auditor','["ISO 9001","ISO 14001","ISO 45001","ISO 50001","ISO 22301"]','["03","04","12","13","14","16","17","28","31","34","35"]',null,'#4F46E5'),
('HAGAR IBRAHIM ELSAYED','auditor','["ISO 9001","ISO 14001","ISO 45001"]','["03","06","12","13","15","28","29","31","33","34","35"]',null,'#B45309'),
('FATMA MOHAMMED SAQR','auditor','["ISO 9001","ISO 14001","ISO 45001"]','["03","07","12","13","16","28","33","34","35","38"]',null,'#9333EA'),
('IBRAHIM AHMED HAMMAD','lead_auditor','["ISO 9001","ISO 14001","ISO 45001","ISO 13485"]','["01","03","04","05","06","07","12","13","14","15","17","18","19","28","29","31","33","34","35","37","38"]','Parts or services; Non-active medical devices','#0F766E'),
('FATMA ALI SHREEF ELZALAL','auditor','["ISO 9001","ISO 14001","ISO 45001"]','["01","03","07","12","13","28","30","31","33","34","35"]',null,'#BE123C'),
('IMAN IBRAHIM ELSAYED','auditor','["ISO 9001"]','["03","04","28","34","35"]',null,'#1D4ED8'),
('SALAH HAFEZ','auditor','[]','[]',null,'#78716C'),
('MAMOUN ABO SHAHIN','technical_expert','[]','[]','Technical Expert','#A16207');

insert into app_settings (key, value) values
('company_name','ISO CERT INTERNATIONAL'),
('company_website','https://iso-cert.uk/'),
('anthropic_api_key',''),
('ai_model','claude-sonnet-4-5')
on conflict (key) do nothing;
