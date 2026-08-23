const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src/i18n/locales');

const newTranslations = {
  fr: {
    "home": {
      "ecosystem_citizen_title": "Compte Citoyen — Simplifiez toutes vos démarches juridiques",
      "ecosystem_citizen_badge": "Pour les Particuliers & Entreprises",
      "ecosystem_citizen_f1_t": "Assistant IA GÉNIA-L 2026",
      "ecosystem_citizen_f1_d": "Analyse instantanée de vos contrats, réponses personnalisées à vos questions de droit 24/7.",
      "ecosystem_citizen_f2_t": "Visioconférences & RDV Directs",
      "ecosystem_citizen_f2_d": "Consultations vidéo HD sécurisées de plus de 2 heures avec des avocats spécialisés.",
      "ecosystem_citizen_f3_t": "Salles de Classe Virtuelles",
      "ecosystem_citizen_f3_d": "Assistez aux séances vidéo en direct avec plus de 100 participants et accès aux résumés.",
      "ecosystem_citizen_f4_t": "Planning Annuel & Agenda",
      "ecosystem_citizen_f4_d": "Suivez le calendrier des masterclasses, programmes et actualités législatives.",
      "ecosystem_citizen_f5_t": "Générateur d'Actes & Devis",
      "ecosystem_citizen_f5_d": "Créez vos courriers juridiques et demandez des devis clairs et transparents aux avocats.",
      "ecosystem_citizen_f6_t": "Coffre-Fort Documentaire",
      "ecosystem_citizen_f6_d": "Stockage chiffré de tous vos documents et pièces justificatives.",

      "ecosystem_student_title": "Compte Étudiant en Droit — Excellence Académique & Réseau",
      "ecosystem_student_badge": "Pour les Étudiants en Droit & Écoles d'Avocats",
      "ecosystem_student_f1_t": "Masterclasses & Cours en Live",
      "ecosystem_student_f1_d": "Suivez les visioconférences dispensées par des Professeurs de Droit, Doctorants et Avocats.",
      "ecosystem_student_f2_t": "Discussions avec les Enseignants",
      "ecosystem_student_f2_d": "Posez vos questions et échangez en direct avec vos professeurs et avocats parrains.",
      "ecosystem_student_f3_t": "Centre de Revues Scientifiques",
      "ecosystem_student_f3_d": "Accès illimité aux articles de recherche et téléchargement de synthèses en PDF.",
      "ecosystem_student_f4_t": "IA GÉNIA-L & Analyse de Code",
      "ecosystem_student_f4_d": "Consultez les codes de loi commentés et réalisez des recherches jurisprudentielles ciblées.",
      "ecosystem_student_f5_t": "Planning Annuel Académique",
      "ecosystem_student_f5_d": "Consultez le calendrier complet des examens, concours et webinaires juristes.",
      "ecosystem_student_f6_t": "Profil Étudiant Vérifié",
      "ecosystem_student_f6_d": "Mise en avant auprès des cabinets d'avocats pour des stages et opportunités.",

      "ecosystem_prof_title": "Compte Professeur de Droit — Transmission & Rayonnement",
      "ecosystem_prof_badge": "Pour les Professeurs & Maîtres de Conférences",
      "ecosystem_prof_f1_t": "Animation de Visioconférences HD",
      "ecosystem_prof_f1_d": "Animez des amphithéâtres virtuels (+2h, >100 participants) avec enregistrement et support de cours.",
      "ecosystem_prof_f2_t": "Programmation du Planning Annuel",
      "ecosystem_prof_f2_d": "Publiez vos modules de cours et conférences au grand planning national interactif.",
      "ecosystem_prof_f3_t": "Publication de Revues Scientifiques",
      "ecosystem_prof_f3_d": "Soumettez vos articles et travaux de recherche directement accessibles au grand public.",
      "ecosystem_prof_f4_t": "Interaction & Accompagnement Étudiants",
      "ecosystem_prof_f4_d": "Échangez directement avec les étudiants et juristes en formation.",
      "ecosystem_prof_f5_t": "Supports de Cours Téléchargeables",
      "ecosystem_prof_f5_d": "Partagez des fichiers PDF et des exercices d'application pratiques.",
      "ecosystem_prof_f6_t": "Écosystème Académique Interconnecté",
      "ecosystem_prof_f6_d": "Collaborer avec les avocats au barreau et les doctorants-chercheurs.",

      "ecosystem_doc_title": "Compte Doctorant / Chercheur — Recherche & Enseignement",
      "ecosystem_doc_badge": "Pour les Doctorants & Chercheurs en Droit",
      "ecosystem_doc_f1_t": "Publication de Thèses & Synthèses",
      "ecosystem_doc_f1_d": "Publiez vos travaux de doctorat au centre de recherche juridique national.",
      "ecosystem_doc_f2_t": "Animation de Webinaires & Salles de Classe",
      "ecosystem_doc_f2_d": "Organisez des ateliers méthodologiques et des séminaires d'actualité juridique.",
      "ecosystem_doc_f3_t": "Insertion au Planning Annuel",
      "ecosystem_doc_f3_d": "Programmez vos conférences de recherche et colloques académiques.",
      "ecosystem_doc_f4_t": "Réseau Doctoral & Barreau",
      "ecosystem_doc_f4_d": "Échangez avec les professeurs de droit et les avocats sur vos domaines de recherche.",
      "ecosystem_doc_f5_t": "Assistant IA de Recherche GÉNIA-L",
      "ecosystem_doc_f5_d": "Synthetisez la doctrine française et internationale en un instant.",
      "ecosystem_doc_f6_t": "Exportation PDF & Archivage",
      "ecosystem_doc_f6_d": "Exportez vos publications au format officiel PDF de l'Académie.",

      "ecosystem_lawyer_title": "Compte Avocat — Solution d'Excellence pour votre Cabinet",
      "ecosystem_lawyer_badge": "Pour les Avocats au Barreau",
      "ecosystem_lawyer_f1_t": "Analyse IA de Pièces & Procédures",
      "ecosystem_lawyer_f1_d": "Gagnez du temps dans la rédaction de conclusions et le dépouillement de dossiers complexes.",
      "ecosystem_lawyer_f2_t": "Visioconférences & Salles de Classe",
      "ecosystem_lawyer_f2_d": "Organisez des consultations privées ou des réunions collectives de formation vidéo en direct.",
      "ecosystem_lawyer_f3_t": "Programmation du Planning Annuel",
      "ecosystem_lawyer_f3_d": "Planifiez vos séances, conférences et actualités sur le calendrier national public.",
      "ecosystem_lawyer_f4_t": "Publication de Revues Scientifiques",
      "ecosystem_lawyer_f4_d": "Publiez vos articles et thèses de recherche directement au centre scientifique national.",
      "ecosystem_lawyer_f5_t": "Gestion des Devis & Dossiers Clients",
      "ecosystem_lawyer_f5_d": "Émettez des devis en temps réel, suivez vos clients et vos honoraires sereinement.",
      "ecosystem_lawyer_f6_t": "Espace Cabinet Multi-Membres",
      "ecosystem_lawyer_f6_d": "Gérez vos collaborateurs, stagiaires et secrétariat dans un espace d'équipe sécurisé.",

      "visio_badge": "Salles de Classe Virtuelles & Visioconférences 2h+",
      "visio_title": "Des Consultations & Cours Vidéo HD en Direct 100% Sécurisés",
      "visio_desc": "Assistez à des cours collectifs de plus de 100 personnes ou bénéficiez d'une consultation individuelle en visio HD avec vos avocats. À la fin de chaque séance passée, la vidéo s'archive automatiquement laisse place à un résumé complet écrit ou vidéo.",
      "visio_bullet1": "Durée Illimitée (plus de 2 heures par session sans coupure).",
      "visio_bullet2": "Disparition automatique des séances passées au profit d'un résumé clair.",
      "visio_bullet3": "Interactivité totale avec chat, questions/réponses et tableau blanc.",
      "visio_cta": "Rejoindre le Catalogue des Visioconférences",
      "visio_summary_title": "📝 Résumé Automatique de Séance (IA)",
      "visio_summary_desc": "À la fin des 2h de direct, la salle s'archive. Retrouvez ici la synthèse écrite des points de droit abordés, les textes cités et les questions répondues.",

      "planning_title": "Planning Annuel, Mensuel & Hebdomadaire",
      "planning_desc": "Organisez vos cours, masterclasses et rendez-vous sur un calendrier dynamique interconnecté. Tous les événements passés sont archivés avec leur compte-rendu.",
      "planning_section_events": "Prochains Événements Inscrits",

      "reviews_title": "Revues Scientifiques & Publications PDF",
      "reviews_desc": "Espace d'expression académique réservé aux Professeurs de Droit, Avocats et Doctorants. Téléchargez et consultez les articles de doctrine juridique validés.",
      "reviews_section_pub": "Dernières Parutions Académiques",

      "ai_section_badge": "Intelligence Artificielle Avancée 2026",
      "ai_section_title": "GénIA-L : Votre Assistant Juridique IA 24/7",
      "ai_section_desc": "Posez vos questions en langage naturel, téléchargez vos documents contractuels et obtenez des réponses étayées sur le Code Civil, Code du Travail, Code de Commerce et la jurisprudence.",
      "ai_section_cta": "Tester GénIA-L Avocat"
    }
  },
  en: {
    "home": {
      "ecosystem_citizen_title": "Citizen Account — Simplify all your legal procedures",
      "ecosystem_citizen_badge": "For Individuals & Businesses",
      "ecosystem_citizen_f1_t": "GÉNIA-L 2026 AI Assistant",
      "ecosystem_citizen_f1_d": "Instant analysis of your contracts, personalized answers to your legal queries 24/7.",
      "ecosystem_citizen_f2_t": "Videoconferences & Direct Appointments",
      "ecosystem_citizen_f2_d": "Secure HD video consultations over 2 hours with specialized lawyers.",
      "ecosystem_citizen_f3_t": "Virtual Classrooms",
      "ecosystem_citizen_f3_d": "Attend live video sessions with over 100 participants and access written summaries.",
      "ecosystem_citizen_f4_t": "Annual Planning & Calendar",
      "ecosystem_citizen_f4_d": "Track masterclasses, academic schedules, and legislative updates.",
      "ecosystem_citizen_f5_t": "Document Generator & Quotes",
      "ecosystem_citizen_f5_d": "Generate legal letters and request transparent fee quotes from lawyers.",
      "ecosystem_citizen_f6_t": "Document Vault",
      "ecosystem_citizen_f6_d": "Encrypted storage for all your legal files and supporting evidence.",

      "ecosystem_student_title": "Law Student Account — Academic Excellence & Network",
      "ecosystem_student_badge": "For Law Students & Bar Schools",
      "ecosystem_student_f1_t": "Live Masterclasses & Courses",
      "ecosystem_student_f1_d": "Attend videoconferences hosted by Law Professors, Doctorate researchers, and Lawyers.",
      "ecosystem_student_f2_t": "Q&A with Lecturers",
      "ecosystem_student_f2_d": "Ask questions and interact directly with your mentors and professors.",
      "ecosystem_student_f3_t": "Scientific Reviews Center",
      "ecosystem_student_f3_d": "Unlimited access to legal research papers and PDF summaries.",
      "ecosystem_student_f4_t": "GÉNIA-L AI & Code Analysis",
      "ecosystem_student_f4_d": "Search annotated law codes and perform targeted case law research.",
      "ecosystem_student_f5_t": "Academic Annual Schedule",
      "ecosystem_student_f5_d": "Consult the complete calendar of exams, competitions, and legal webinars.",
      "ecosystem_student_f6_t": "Verified Student Profile",
      "ecosystem_student_f6_d": "Gain visibility with law firms for internships and career opportunities.",

      "ecosystem_prof_title": "Law Professor Account — Teaching & Leadership",
      "ecosystem_prof_badge": "For Professors & Lecturers",
      "ecosystem_prof_f1_t": "HD Virtual Amphitheaters",
      "ecosystem_prof_f1_d": "Host virtual amphitheaters (2h+, >100 attendees) with recording and course materials.",
      "ecosystem_prof_f2_t": "Annual Planning Management",
      "ecosystem_prof_f2_d": "Publish course modules and conferences to the interactive national calendar.",
      "ecosystem_prof_f3_t": "Publishing Scientific Reviews",
      "ecosystem_prof_f3_d": "Submit research articles directly accessible to the public and student network.",
      "ecosystem_prof_f4_t": "Student Mentorship & Live QA",
      "ecosystem_prof_f4_d": "Engage directly with students and trainees during live Q&A.",
      "ecosystem_prof_f5_t": "Downloadable Course Materials",
      "ecosystem_prof_f5_d": "Share PDF files, exercises, and practical case studies.",
      "ecosystem_prof_f6_t": "Interconnected Academic Ecosystem",
      "ecosystem_prof_f6_d": "Collaborate with bar lawyers and doctorate researchers.",

      "ecosystem_doc_title": "Doctorate / Researcher Account — Research & Education",
      "ecosystem_doc_badge": "For Doctorate Candidates & Researchers",
      "ecosystem_doc_f1_t": "Thesis & Summary Publications",
      "ecosystem_doc_f1_d": "Publish doctoral research to the national legal research database.",
      "ecosystem_doc_f2_t": "Webinars & Classroom Hosting",
      "ecosystem_doc_f2_d": "Organize methodology workshops and current affairs seminars.",
      "ecosystem_doc_f3_t": "Annual Calendar Integration",
      "ecosystem_doc_f3_d": "Schedule research conferences and academic symposia.",
      "ecosystem_doc_f4_t": "Doctoral & Bar Network",
      "ecosystem_doc_f4_d": "Exchange with law professors and practicing attorneys.",
      "ecosystem_doc_f5_t": "GÉNIA-L Research Assistant",
      "ecosystem_doc_f5_d": "Summarize French and international doctrine in seconds.",
      "ecosystem_doc_f6_t": "PDF Export & Archiving",
      "ecosystem_doc_f6_d": "Export publications with official Academy PDF formatting.",

      "ecosystem_lawyer_title": "Lawyer Account — Excellence Solution for your Law Firm",
      "ecosystem_lawyer_badge": "For Bar Association Attorneys",
      "ecosystem_lawyer_f1_t": "AI Evidence & Procedure Analysis",
      "ecosystem_lawyer_f1_d": "Save time writing legal briefs and sifting through complex case files.",
      "ecosystem_lawyer_f2_t": "Videoconferences & Masterclasses",
      "ecosystem_lawyer_f2_d": "Host private consultations or live group video masterclasses.",
      "ecosystem_lawyer_f3_t": "Annual Calendar Publishing",
      "ecosystem_lawyer_f3_d": "Schedule sessions and legal updates on the public national calendar.",
      "ecosystem_lawyer_f4_t": "Scientific Review Publications",
      "ecosystem_lawyer_f4_d": "Publish legal research papers directly to the national scientific hub.",
      "ecosystem_lawyer_f5_t": "Quote & Client Management",
      "ecosystem_lawyer_f5_d": "Issue real-time quotes, track clients, and manage fees securely.",
      "ecosystem_lawyer_f6_t": "Multi-Member Firm Workspace",
      "ecosystem_lawyer_f6_d": "Manage associates, paralegals, and trainees in a shared team space.",

      "visio_badge": "Virtual Classrooms & HD Videoconferences 2h+",
      "visio_title": "100% Secure Live HD Video Consultations & Classes",
      "visio_desc": "Attend group classes with over 100 attendees or book private HD video consultations. Past sessions automatically archive into comprehensive written summaries.",
      "visio_bullet1": "Unlimited Duration (over 2 hours per session without interruption).",
      "visio_bullet2": "Automatic archiving of past sessions into concise summaries.",
      "visio_bullet3": "Full interactivity with live chat, Q&A, and digital whiteboard.",
      "visio_cta": "Browse Videoconference Catalog",
      "visio_summary_title": "📝 Automated Session Summary (AI)",
      "visio_summary_desc": "At the end of the 2-hour live stream, the room archives automatically into written summaries, cited laws, and Q&A takeaways.",

      "planning_title": "Annual, Monthly & Weekly Planning",
      "planning_desc": "Organize your masterclasses and meetings on a dynamic interconnected calendar. Past events remain accessible with full reports.",
      "planning_section_events": "Upcoming Scheduled Events",

      "reviews_title": "Scientific Reviews & PDF Publications",
      "reviews_desc": "Academic publishing space for Law Professors, Attorneys, and Doctorate Researchers. Download certified doctrine papers.",
      "reviews_section_pub": "Latest Academic Publications",

      "ai_section_badge": "Advanced Legal AI 2026",
      "ai_section_title": "GénIA-L: Your 24/7 AI Legal Assistant",
      "ai_section_desc": "Ask queries in natural language, upload contract files, and receive detailed answers backed by Civil, Labor, and Commercial Codes.",
      "ai_section_cta": "Test GénIA-L Attorney"
    }
  },
  ar: {
    "home": {
      "ecosystem_citizen_title": "حساب المواطن — تبسيط جميع إجراءاتك القانونية",
      "ecosystem_citizen_badge": "للأفراد والشركات",
      "ecosystem_citizen_f1_t": "مساعد الذكاء الاصطناعي GénIA-L 2026",
      "ecosystem_citizen_f1_d": "تحليل فوري للعقود وإجابات مخصصة لأسئلتك القانونية على مدار 24/7.",
      "ecosystem_citizen_f2_t": "استشارات مرئية ومواعيد مباشرة",
      "ecosystem_citizen_f2_d": "استشارات فيديو عالية الدقة تمتد لاكثر من ساعتين مع محامين متخصصين.",
      "ecosystem_citizen_f3_t": "فصول افتراضية تفاعلية",
      "ecosystem_citizen_f3_d": "حضور جلسات بث مباشر مع أكثر من 100 مشارك والاطلاع على الملخصات.",
      "ecosystem_citizen_f4_t": "التخطيط السنوي والأجندة",
      "ecosystem_citizen_f4_d": "متابعة جدول الماستركلاس والبرامج والمستجدات التشريعية.",
      "ecosystem_citizen_f5_t": "مولد العقود والطلبات والتقديرات",
      "ecosystem_citizen_f5_d": "إنشاء الخطابات القانونية وطلب تقديرات أتعاب شفافة من المحامين.",
      "ecosystem_citizen_f6_t": "خزنة المستندات المشفرة",
      "ecosystem_citizen_f6_d": "حفظ مشفر لجميع الوثائق والملفات والمستندات الثبوتية.",

      "ecosystem_student_title": "حساب طالب القانون — التميز الأكاديمي والشبكة",
      "ecosystem_student_badge": "لطstudents القانون ومعاهد المحاماة",
      "ecosystem_student_f1_t": "ماستركلاس ودروس مباشرة",
      "ecosystem_student_f1_d": "متابعة المحاضرات المرئية المقدمة من طرف أساتذة القانون والدكاترة والمحامين.",
      "ecosystem_student_f2_t": "حوار مباشر مع الأساتذة",
      "ecosystem_student_f2_d": "طرح الأسئلة والتفاعل المباشر مع الأساتذة والمحامين المؤطرين.",
      "ecosystem_student_f3_t": "مركز المجلات العلمية",
      "ecosystem_student_f3_d": "وصول غير محدود للمقالات الأكاديمية وتحميل الملخصات بصيغة PDF.",
      "ecosystem_student_f4_t": "الذكاء الاصطناعي وتحليل القوانين",
      "ecosystem_student_f4_d": "البحث في القوانين المشروحة والاجتهادات القضائية بفرنسا ودولياً.",
      "ecosystem_student_f5_t": "الجدول الأكاديمي السنوي",
      "ecosystem_student_f5_d": "الاطلاع على جدول الامتحانات والمسابقات والندوات القانونية.",
      "ecosystem_student_f6_t": "ملف طالب معتمد",
      "ecosystem_student_f6_d": "ابراز كفاءتك لمكاتب المحاماة للحصول على فرص تدريب وتوظيف.",

      "ecosystem_prof_title": "حساب أستاذ القانون — التأطير والإشعاع الأكاديمي",
      "ecosystem_prof_badge": "للأساتذة والمحاضرين الجامعيين",
      "ecosystem_prof_f1_t": "إدارة المدرجات الافتراضية HD",
      "ecosystem_prof_f1_d": "إلقاء محاضرات التفاعلية (+2ساعة، >100 مشارك) مع التسجيل والتأطير.",
      "ecosystem_prof_f2_t": "برمجة التخطيط السنوي",
      "ecosystem_prof_f2_d": "نشر الدروس والندوات في الأجندة التفاعلية الوطنية.",
      "ecosystem_prof_f3_t": "نشر الأبحاث والمجلات العلمية",
      "ecosystem_prof_f3_d": "تقديم المقالات والدراسات العلمية للعموم وطلاب القانون.",
      "ecosystem_prof_f4_t": "التفاعل والسيطرة العلمية",
      "ecosystem_prof_f4_d": "الإجابة عن استفسارات الطلاب وتوجيه الباحثين.",
      "ecosystem_prof_f5_t": "ملفات ومطبوعات PDF للتحميل",
      "ecosystem_prof_f5_d": "مشاركة دروس وتمارين تطبيقية قابلة للتحميل.",
      "ecosystem_prof_f6_t": "منظومة أكاديمية متكاملة",
      "ecosystem_prof_f6_d": "التعاون مع المحامين والباحثين في سلك الدكتوراه.",

      "ecosystem_doc_title": "حساب الباحث والدكتوراه — البحث والتأطير",
      "ecosystem_doc_badge": "للباحثين في سلك الدكتوراه",
      "ecosystem_doc_f1_t": "نشر الأطروحات والملخصات",
      "ecosystem_doc_f1_d": "نشر بحوث الدكتوراه بالمركز الوطني للأبحاث القانونية.",
      "ecosystem_doc_f2_t": "تنظيم الورشات والندوات",
      "ecosystem_doc_f2_d": "إدارة ورشات المنهجية وندوات المستجدات التشريعية.",
      "ecosystem_doc_f3_t": "الإدراج في التخطيط السنوي",
      "ecosystem_doc_f3_d": "برمجة المؤتمرات والندوات العلمية بالجدول الوطني.",
      "ecosystem_doc_f4_t": "شبكة الدكتوراه والمحاماة",
      "ecosystem_doc_f4_d": "التواصل مع الأساتذة والمحامين في مجالات اختصاصك.",
      "ecosystem_doc_f5_t": "مساعد البحث الذكي GÉNIA-L",
      "ecosystem_doc_f5_d": "تجميع الفقه والاجتهادات القضائية في ثوانٍ معدودة.",
      "ecosystem_doc_f6_t": "تصدير الأبحاث بصيغة PDF",
      "ecosystem_doc_f6_d": "تصدير منشوراتك بالتنسيق الأكاديمي الرسمي.",

      "ecosystem_lawyer_title": "حساب المحامي — حلول التميز لمكتب المحاماة",
      "ecosystem_lawyer_badge": "للمحامين المقبولين لدى الهيئات",
      "ecosystem_lawyer_f1_t": "تحليل الوثائق والمساطر بالذكاء الاصطناعي",
      "ecosystem_lawyer_f1_d": "تسريع صياغة المذكرات وتفكيك الملفات المعقدة.",
      "ecosystem_lawyer_f2_t": "استشارات وقاعات افتراضية",
      "ecosystem_lawyer_f2_d": "عقد استشارات خاصة أو جلسات تدريب مرئية مباشرة.",
      "ecosystem_lawyer_f3_t": "برمجة التخطيط السنوي",
      "ecosystem_lawyer_f3_d": "جدولة جلساتك ومحاضراتك بالجدول الوطني العام.",
      "ecosystem_lawyer_f4_t": "نشر المقالات والبحوث",
      "ecosystem_lawyer_f4_d": "نشر المقالات الفقهية مباشرة بالمركز العلمي الوطني.",
      "ecosystem_lawyer_f5_t": "إدارة الأتعاب والملفات",
      "ecosystem_lawyer_f5_d": "إصدار التقديرات وتتبع الموكلين والأتعاب بأمان.",
      "ecosystem_lawyer_f6_t": "إدارة فريق المكتب",
      "ecosystem_lawyer_f6_d": "إدارة المحامين المساعدين والمتمرنين في مساحة عمل واحدة.",

      "visio_badge": "قاعات افتراضية واستشارات مرئية +2ساعة",
      "visio_title": "استشارات ومحاضرات فيديو آمنة 100% عالية الدقة",
      "visio_desc": "احضر دروساً جماعية لأكثر من 100 مشارك أو احجز استشارة مرئية فردية. بعد نهاية كل جلسة تتأرشف القاعة تلقائياً لتفسح المجال لملخص مكتوب شامل.",
      "visio_bullet1": "مدة غير محدودة (أكثر من ساعتين متواصلتين لكل جلسة).",
      "visio_bullet2": "أرشفة تلقائية للجلسات السابقة وتحويلها إلى ملخصات مركزة.",
      "visio_bullet3": "تفاعل كامل مع محادثة مباشرة وأسئلة وسبورة رقمية.",
      "visio_cta": "تصفح دليل الاستشارات المرئية",
      "visio_summary_title": "📝 الملخص التلقائي للجلسة (ذكاء اصطناعي)",
      "visio_summary_desc": "عند انتهاء الساعتين، تتأرشف القاعة ويظهر ملخص مكتوب للنقاط القانونية والقوانين المستشهد بها.",

      "planning_title": "التخطيط السنوي والشهري والأسبوعي",
      "planning_desc": "تنظيم الدروس والماستركلاس والمواعيد في أجندة تفاعلية متكاملة.",
      "planning_section_events": "الأحداث والندوات المبرمجة القادمة",

      "reviews_title": "المجلات العلمية والمنشورات الأكاديمية PDF",
      "reviews_desc": "مساحة النشر الأكاديمي المخصصة لأساتذة القانون والمحامين والباحثين.",
      "reviews_section_pub": "أحدث الإصدارات والأبحاث الأكاديمية",

      "ai_section_badge": "الذكاء الاصطناعي القانوني المتقدم 2026",
      "ai_section_title": "GénIA-L: مساعدك القانوني الذكي على مدار 24/7",
      "ai_section_desc": "اطرح أسئلتك بلغة طبيعية، ارفع العقود والوثائق واحصل على إجابات موثوقة معززة بالنصوص القانونية.",
      "ai_section_cta": "تجربة المحامي الذكي GénIA-L"
    }
  }
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

['fr', 'en', 'ar'].forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (newTranslations[lang]) {
    deepMerge(data, newTranslations[lang]);
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${lang}.json with new dynamic keys!`);
});

// Also mirror FR keys to ES, TR, KU, RU with safe fallbacks
['es', 'tr', 'ku', 'ru'].forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  deepMerge(data, newTranslations.en); // default to EN for extra languages
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Mirrored new dynamic keys to ${lang}.json!`);
});
