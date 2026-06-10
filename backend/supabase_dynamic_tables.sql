-- =============================================================================
-- SETUP COMPLET : Tables dynamiques pour JustLaw
-- À exécuter dans l'éditeur SQL Supabase :
-- https://supabase.com/dashboard/project/zchhijltemvrsthdaxex/sql
-- =============================================================================

-- ─── 1. TABLE LAW_CODES_JUST ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.law_codes_just (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id     TEXT NOT NULL,               -- ex: 'penal', 'civil'
  code_name   TEXT NOT NULL,               -- ex: 'Code Pénal'
  short_name  TEXT NOT NULL,               -- ex: 'CP'
  color       TEXT NOT NULL DEFAULT 'text-secondary-700',
  bg_color    TEXT NOT NULL DEFAULT 'bg-secondary-50 border-secondary-200',
  description TEXT NOT NULL DEFAULT '',
  chapter_id  TEXT NOT NULL,               -- ex: 'cp-1'
  chapter_title TEXT NOT NULL,
  article_number TEXT NOT NULL,            -- ex: 'Art. 111-1'
  article_title  TEXT NOT NULL,
  article_content TEXT NOT NULL,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime
ALTER TABLE public.law_codes_just REPLICA IDENTITY FULL;

-- RLS
ALTER TABLE public.law_codes_just ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read law_codes_just" ON public.law_codes_just FOR SELECT USING (true);
CREATE POLICY "Authenticated insert law_codes_just" ON public.law_codes_just FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── 2. TABLE PROCEDURES_JUST ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.procedures_just (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proc_id         TEXT NOT NULL UNIQUE,    -- ex: 'divorce-consentement'
  title           TEXT NOT NULL,
  category        TEXT NOT NULL,           -- civil, penal, famille, travail, administratif, societe
  difficulty      TEXT NOT NULL DEFAULT 'Moyen', -- Facile, Moyen, Difficile
  total_duration  TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  steps           JSONB NOT NULL DEFAULT '[]',   -- array of step objects
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime
ALTER TABLE public.procedures_just REPLICA IDENTITY FULL;

-- RLS
ALTER TABLE public.procedures_just ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read procedures_just" ON public.procedures_just FOR SELECT USING (true);
CREATE POLICY "Authenticated insert procedures_just" ON public.procedures_just FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── 3. SEED : CODES DE LOI ──────────────────────────────────────────────────

INSERT INTO public.law_codes_just (code_id, code_name, short_name, color, bg_color, description, chapter_id, chapter_title, article_number, article_title, article_content, tags)
VALUES
-- CODE PÉNAL
('penal','Code Pénal','CP','text-red-700','bg-red-50 border-red-200','Infractions, délits, crimes et leurs sanctions',
 'cp-1','Titre I – Des infractions en général','Art. 111-1','Classification des infractions',
 'Les infractions pénales sont classées, suivant leur gravité, en crimes, délits et contraventions.',
 ARRAY['classification','crime','délit','contravention']),

('penal','Code Pénal','CP','text-red-700','bg-red-50 border-red-200','Infractions, délits, crimes et leurs sanctions',
 'cp-1','Titre I – Des infractions en général','Art. 112-1','Principe de légalité',
 'Sont seuls punissables les faits constitutifs d''une infraction à la date à laquelle ils ont été commis.',
 ARRAY['légalité','principe','peine']),

('penal','Code Pénal','CP','text-red-700','bg-red-50 border-red-200','Infractions, délits, crimes et leurs sanctions',
 'cp-1','Titre I – Des infractions en général','Art. 121-1','Responsabilité personnelle',
 'Nul n''est responsable pénalement que de son propre fait.',
 ARRAY['responsabilité','personnel']),

('penal','Code Pénal','CP','text-red-700','bg-red-50 border-red-200','Infractions, délits, crimes et leurs sanctions',
 'cp-1','Titre I – Des infractions en général','Art. 122-1','Irresponsabilité ou atténuation',
 'N''est pas pénalement responsable la personne qui était atteinte, au moment des faits, d''un trouble mental ayant aboli son discernement ou le contrôle de ses actes.',
 ARRAY['irresponsabilité','trouble mental','discernement']),

('penal','Code Pénal','CP','text-red-700','bg-red-50 border-red-200','Infractions, délits, crimes et leurs sanctions',
 'cp-1','Titre I – Des infractions en général','Art. 122-5','Légitime défense',
 'N''est pas pénalement responsable la personne qui, devant une atteinte injustifiée envers elle-même ou autrui, accomplit, dans le même temps, un acte commandé par la nécessité de la légitime défense d''elle-même ou d''autrui.',
 ARRAY['légitime défense','auto-défense']),

('penal','Code Pénal','CP','text-red-700','bg-red-50 border-red-200','Infractions, délits, crimes et leurs sanctions',
 'cp-2','Titre II – Des atteintes à la personne humaine','Art. 221-1','Meurtre',
 'Le fait de donner volontairement la mort à autrui constitue un meurtre. Il est puni de trente ans de réclusion criminelle.',
 ARRAY['meurtre','homicide','réclusion']),

('penal','Code Pénal','CP','text-red-700','bg-red-50 border-red-200','Infractions, délits, crimes et leurs sanctions',
 'cp-2','Titre II – Des atteintes à la personne humaine','Art. 222-1','Torture et actes de barbarie',
 'Le fait de soumettre une personne à des tortures ou à des actes de barbarie est puni de quinze ans de réclusion criminelle.',
 ARRAY['torture','barbarie','violence']),

('penal','Code Pénal','CP','text-red-700','bg-red-50 border-red-200','Infractions, délits, crimes et leurs sanctions',
 'cp-2','Titre II – Des atteintes à la personne humaine','Art. 222-33','Harcèlement sexuel',
 'Le harcèlement sexuel est le fait d''imposer à une personne, de façon répétée, des propos ou comportements à connotation sexuelle ou sexiste.',
 ARRAY['harcèlement','sexuel','travail']),

('penal','Code Pénal','CP','text-red-700','bg-red-50 border-red-200','Infractions, délits, crimes et leurs sanctions',
 'cp-3','Titre III – Des atteintes aux biens','Art. 311-1','Vol',
 'Le vol est la soustraction frauduleuse de la chose d''autrui. Il est puni de trois ans d''emprisonnement et de 45 000 euros d''amende.',
 ARRAY['vol','soustraction','fraude']),

('penal','Code Pénal','CP','text-red-700','bg-red-50 border-red-200','Infractions, délits, crimes et leurs sanctions',
 'cp-3','Titre III – Des atteintes aux biens','Art. 313-1','Escroquerie',
 'L''escroquerie est le fait, soit par l''usage d''un faux nom ou d''une fausse qualité, soit par l''abus d''une qualité vraie, soit par l''emploi de manœuvres frauduleuses, de tromper une personne physique ou morale.',
 ARRAY['escroquerie','fraude','tromperie']),

-- CODE CIVIL
('civil','Code Civil','CC','text-blue-700','bg-blue-50 border-blue-200','Relations entre personnes privées, contrats, propriété',
 'cc-1','Livre I – Des personnes','Art. 9','Droit au respect de la vie privée',
 'Chacun a droit au respect de sa vie privée. Les juges peuvent, sans préjudice de la réparation du dommage subi, prescrire toutes mesures propres à empêcher ou faire cesser une atteinte à l''intimité de la vie privée.',
 ARRAY['vie privée','respect','intimité']),

('civil','Code Civil','CC','text-blue-700','bg-blue-50 border-blue-200','Relations entre personnes privées, contrats, propriété',
 'cc-2','Livre III – Des différentes manières dont on acquiert la propriété','Art. 1103','Force obligatoire des contrats',
 'Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits.',
 ARRAY['contrat','obligation','loi']),

('civil','Code Civil','CC','text-blue-700','bg-blue-50 border-blue-200','Relations entre personnes privées, contrats, propriété',
 'cc-2','Livre III – Des différentes manières dont on acquiert la propriété','Art. 1104','Bonne foi',
 'Les contrats doivent être négociés, formés et exécutés de bonne foi. Cette disposition est d''ordre public.',
 ARRAY['bonne foi','contrat','ordre public']),

('civil','Code Civil','CC','text-blue-700','bg-blue-50 border-blue-200','Relations entre personnes privées, contrats, propriété',
 'cc-2','Livre III – Des différentes manières dont on acquiert la propriété','Art. 1128','Conditions de validité du contrat',
 'Sont nécessaires à la validité d''un contrat : le consentement des parties, leur capacité de contracter, un contenu licite et certain.',
 ARRAY['validité','consentement','capacité']),

('civil','Code Civil','CC','text-blue-700','bg-blue-50 border-blue-200','Relations entre personnes privées, contrats, propriété',
 'cc-2','Livre III – Des différentes manières dont on acquiert la propriété','Art. 1240','Responsabilité civile délictuelle',
 'Tout fait quelconque de l''homme, qui cause à autrui un dommage, oblige celui par la faute duquel il est arrivé à le réparer.',
 ARRAY['responsabilité','dommage','réparation','faute']),

('civil','Code Civil','CC','text-blue-700','bg-blue-50 border-blue-200','Relations entre personnes privées, contrats, propriété',
 'cc-2','Livre III – Des différentes manières dont on acquiert la propriété','Art. 544','Droit de propriété',
 'La propriété est le droit de jouir et disposer des choses de la manière la plus absolue, pourvu qu''on n''en fasse pas un usage prohibé par les lois ou par les règlements.',
 ARRAY['propriété','droit','jouissance']),

-- DROIT DE LA FAMILLE
('famille','Droit de la Famille','Fam.','text-pink-700','bg-pink-50 border-pink-200','Mariage, divorce, filiation, succession, autorité parentale',
 'fam-1','Le Mariage','Art. 146 CC','Consentement au mariage',
 'Il n''y a pas de mariage lorsqu''il n''y a point de consentement.',
 ARRAY['consentement','mariage','validité']),

('famille','Droit de la Famille','Fam.','text-pink-700','bg-pink-50 border-pink-200','Mariage, divorce, filiation, succession, autorité parentale',
 'fam-1','Le Mariage','Art. 212 CC','Devoirs des époux',
 'Les époux se doivent mutuellement respect, fidélité, secours, assistance.',
 ARRAY['devoir','époux','fidélité','respect']),

('famille','Droit de la Famille','Fam.','text-pink-700','bg-pink-50 border-pink-200','Mariage, divorce, filiation, succession, autorité parentale',
 'fam-2','Le Divorce','Art. 229 CC','Cas de divorce',
 'Le divorce peut être prononcé en cas : de consentement mutuel, d''acceptation du principe de la rupture du mariage, d''altération définitive du lien conjugal, ou de faute.',
 ARRAY['divorce','causes','rupture']),

('famille','Droit de la Famille','Fam.','text-pink-700','bg-pink-50 border-pink-200','Mariage, divorce, filiation, succession, autorité parentale',
 'fam-2','Le Divorce','Art. 270 CC','Prestation compensatoire',
 'Le divorce met fin au devoir de secours entre époux. L''un des époux peut être tenu de verser à l''autre une prestation destinée à compenser, autant qu''il est possible, la disparité que la rupture du mariage crée dans les conditions de vie respectives.',
 ARRAY['prestation compensatoire','disparité','divorce']),

('famille','Droit de la Famille','Fam.','text-pink-700','bg-pink-50 border-pink-200','Mariage, divorce, filiation, succession, autorité parentale',
 'fam-3','Filiation et Autorité parentale','Art. 371-1 CC','Autorité parentale',
 'L''autorité parentale est un ensemble de droits et de devoirs ayant pour finalité l''intérêt de l''enfant. Elle appartient aux parents jusqu''à la majorité ou l''émancipation de l''enfant.',
 ARRAY['autorité parentale','enfant','droits']),

-- DROIT ADMINISTRATIF
('administratif','Droit Administratif','DA','text-amber-700','bg-amber-50 border-amber-200','Relations entre l''administration et les administrés',
 'da-1','Actes administratifs et procédure','L. 231-1 CRPA','Silence de l''administration',
 'Le silence gardé pendant deux mois par l''autorité administrative sur une demande vaut décision d''acceptation, sauf dans les cas où lois ou décrets en disposent autrement.',
 ARRAY['silence','administration','acceptation','deux mois']),

('administratif','Droit Administratif','DA','text-amber-700','bg-amber-50 border-amber-200','Relations entre l''administration et les administrés',
 'da-1','Actes administratifs et procédure','L. 311-1 CRPA','Droit d''accès aux documents',
 'Les autorités sont tenues de communiquer les documents administratifs qu''elles détiennent aux personnes qui en font la demande.',
 ARRAY['accès','documents','communication','CADA']),

-- DROIT COMMERCIAL
('commerce','Droit Commercial','Com.','text-emerald-700','bg-emerald-50 border-emerald-200','Sociétés, commerçants, fonds de commerce, procédures collectives',
 'com-1','Les Commerçants et Actes de Commerce','Art. L. 121-1 Ccom','Définition du commerçant',
 'Sont commerçants ceux qui exercent des actes de commerce et en font leur profession habituelle.',
 ARRAY['commerçant','profession','actes de commerce']),

('commerce','Droit Commercial','Com.','text-emerald-700','bg-emerald-50 border-emerald-200','Sociétés, commerçants, fonds de commerce, procédures collectives',
 'com-2','Les Sociétés Commerciales','Art. L. 223-1 Ccom','SARL – Définition',
 'La société à responsabilité limitée est instituée par une ou plusieurs personnes qui ne supportent les pertes qu''à concurrence de leurs apports. Le capital social est divisé en parts sociales.',
 ARRAY['SARL','responsabilité','capital','parts sociales']),

('commerce','Droit Commercial','Com.','text-emerald-700','bg-emerald-50 border-emerald-200','Sociétés, commerçants, fonds de commerce, procédures collectives',
 'com-3','Procédures Collectives','Art. L. 620-1 Ccom','Sauvegarde',
 'Il est institué une procédure de sauvegarde ouverte sur demande d''un débiteur qui, sans être en cessation des paiements, justifie de difficultés de nature à le conduire à la cessation des paiements.',
 ARRAY['sauvegarde','cessation paiements','difficultés']),

('commerce','Droit Commercial','Com.','text-emerald-700','bg-emerald-50 border-emerald-200','Sociétés, commerçants, fonds de commerce, procédures collectives',
 'com-3','Procédures Collectives','Art. L. 640-1 Ccom','Liquidation judiciaire',
 'Il est institué une procédure de liquidation judiciaire ouverte à tout débiteur en cessation des paiements dont le redressement est manifestement impossible.',
 ARRAY['liquidation','judiciaire','redressement impossible']);

-- ─── 4. SEED : PROCÉDURES ─────────────────────────────────────────────────────

INSERT INTO public.procedures_just (proc_id, title, category, difficulty, total_duration, description, steps)
VALUES
('divorce-consentement', 'Divorce par consentement mutuel', 'famille', 'Moyen', '3 à 6 mois',
 'Procédure de divorce à l''amiable entre deux époux d''accord sur toutes les conséquences de leur séparation, sans passage obligatoire devant le juge aux affaires familiales.',
 '[
   {"step":1,"title":"Consultation d''un avocat (chacun)","description":"Chaque époux doit mandater son propre avocat. Les deux avocats travailleront à la rédaction d''une convention de divorce.","duration":"1 à 2 semaines","tips":"Choisissez un avocat spécialisé en droit de la famille. Chaque conjoint DOIT avoir son propre avocat."},
   {"step":2,"title":"Rédaction de la convention de divorce","description":"Les avocats rédigent conjointement la convention qui définit les conséquences du divorce.","duration":"2 à 8 semaines","tips":"Rassemblez tous les documents : titres de propriété, relevés de comptes, contrat de mariage."},
   {"step":3,"title":"Envoi du projet de convention aux époux","description":"Les avocats envoient à chaque époux le projet de convention par LRAR. Un délai de réflexion de 15 jours minimum est obligatoire.","duration":"15 jours minimum","warning":"Ce délai de 15 jours est impératif et non négociable. Sans lui, la convention est nulle."},
   {"step":4,"title":"Signature de la convention","description":"Après le délai de réflexion, les deux époux et leurs avocats se réunissent pour signer la convention.","duration":"1 jour","tips":"Vérifiez minutieusement chaque clause avant de signer."},
   {"step":5,"title":"Dépôt chez le notaire","description":"Les avocats déposent la convention chez un notaire dans les 7 jours suivant la signature.","duration":"7 jours après signature","tips":"Le notaire est désigné d''un commun accord."},
   {"step":6,"title":"Transcription sur les actes d''état civil","description":"Le greffier du tribunal judiciaire transcrit le divorce sur les actes de naissance et de mariage.","duration":"1 à 3 mois","tips":"Le divorce prend officiellement effet lors de la transcription."}
 ]'::jsonb),

('licenciement-contestation', 'Contester un licenciement abusif', 'travail', 'Moyen', '6 mois à 2 ans',
 'Procédure pour contester un licenciement sans cause réelle et sérieuse devant le Conseil de Prud''hommes.',
 '[
   {"step":1,"title":"Vérification du motif de licenciement","description":"Analysez la lettre de licenciement : elle doit être motivée et les motifs doivent être réels et sérieux.","duration":"Immédiat","warning":"Vous avez 12 mois à compter de la notification du licenciement pour saisir les prud''hommes."},
   {"step":2,"title":"Consultation d''un avocat ou défenseur syndical","description":"Consultez un avocat en droit du travail. Apportez : contrat, bulletins de salaire, lettre de licenciement.","duration":"1 à 2 semaines"},
   {"step":3,"title":"Tentative de conciliation préalable","description":"Saisine du Conseil de Prud''hommes par requête. Une audience de conciliation est organisée.","duration":"2 à 4 mois","tips":"La conciliation peut éviter une longue procédure."},
   {"step":4,"title":"Bureau de jugement","description":"En l''absence de conciliation, le dossier est renvoyé devant le Bureau de Jugement.","duration":"6 à 18 mois","tips":"Rassemblez toutes les preuves : emails, témoignages, documents RH."},
   {"step":5,"title":"Audience de plaidoirie et décision","description":"Les conseillers prud''homaux rendent leur décision.","duration":"1 à 3 mois après audience","tips":"Le barème Macron plafonne les indemnités. Vérifiez le montant selon votre ancienneté."},
   {"step":6,"title":"Appel éventuel","description":"Chaque partie peut faire appel dans les 30 jours.","duration":"1 à 2 ans supplémentaires","warning":"L''appel suspend l''exécution du jugement en première instance."}
 ]'::jsonb),

('plainte-penale', 'Porter plainte et suivre une procédure pénale', 'penal', 'Moyen', '6 mois à 3 ans',
 'Démarches pour déposer une plainte pénale et suivre la procédure jusqu''au jugement.',
 '[
   {"step":1,"title":"Dépôt de plainte","description":"Déposez votre plainte au commissariat, à la gendarmerie, ou directement auprès du Procureur de la République.","duration":"1 jour","tips":"Gardez une copie de votre plainte et notez le numéro de procédure."},
   {"step":2,"title":"Enquête préliminaire","description":"La police ou la gendarmerie mène l''enquête sous la direction du Procureur.","duration":"2 mois à 2 ans","warning":"Vous pouvez être informé de l''avancement en contactant le greffe du parquet."},
   {"step":3,"title":"Décision du Parquet","description":"Le Procureur décide : classement sans suite, alternative aux poursuites, ou renvoi en jugement.","duration":"3 à 12 mois","tips":"En cas de classement sans suite, vous pouvez vous constituer partie civile."},
   {"step":4,"title":"Audience de jugement","description":"Le tribunal correctionnel ou la Cour d''Assises statue. En tant que victime partie civile, vous pouvez demander des dommages et intérêts.","duration":"1 journée à plusieurs semaines","warning":"Préparez vos demandes de dommages-intérêts avec justificatifs."},
   {"step":5,"title":"Exécution de la peine et indemnisation","description":"Si condamné, l''auteur subit sa peine. Le SARVI ou le FGTI peut vous indemniser rapidement.","duration":"Variable","tips":"Contactez le FGTI pour une indemnisation rapide."}
 ]'::jsonb),

('creation-societe', 'Créer une société (SAS ou SARL)', 'societe', 'Moyen', '2 à 6 semaines',
 'Étapes pour constituer et immatriculer une société commerciale (SAS, SARL ou EURL) en France.',
 '[
   {"step":1,"title":"Choix de la forme juridique","description":"SAS/SASU : grande liberté statutaire, adapté pour lever des fonds. SARL/EURL : cadre réglementé, adapté aux PME familiales.","duration":"1 à 3 jours"},
   {"step":2,"title":"Rédaction des statuts","description":"Les statuts sont l''acte constitutif de la société. Faites-les rédiger par un avocat ou expert-comptable.","duration":"1 à 2 semaines","warning":"Des statuts mal rédigés peuvent créer de graves problèmes entre associés."},
   {"step":3,"title":"Dépôt du capital social","description":"Les apports en numéraire sont déposés sur un compte bancaire bloqué au nom de la société en formation.","duration":"1 à 5 jours","tips":"Capital minimum : 1€ pour SAS et SARL."},
   {"step":4,"title":"Publication d''un avis de constitution","description":"Un avis légal doit être publié dans un Journal d''Annonces Légales habilité du département du siège social.","duration":"1 à 3 jours"},
   {"step":5,"title":"Dépôt du dossier d''immatriculation","description":"Déposez votre dossier sur le guichet-entreprises.fr.","duration":"3 à 10 jours","tips":"Le guichet unique (INPI) a remplacé le CFE depuis 2023."},
   {"step":6,"title":"Réception du Kbis","description":"Après vérification par le greffe, la société reçoit son extrait Kbis et son numéro SIRET.","duration":"5 à 15 jours ouvrés","tips":"Débloquez ensuite le compte bancaire avec le Kbis et le numéro SIRET."}
 ]'::jsonb),

('recours-administratif', 'Contester une décision administrative', 'administratif', 'Moyen', '6 mois à 2 ans',
 'Procédure pour contester une décision administrative défavorable devant le tribunal administratif.',
 '[
   {"step":1,"title":"Recours gracieux ou hiérarchique","description":"Avant tout recours contentieux, adressez un recours gracieux à l''auteur de la décision ou hiérarchique à son supérieur.","duration":"2 mois (délai de réponse)","tips":"Le silence de l''administration vaut refus après 2 mois."},
   {"step":2,"title":"Recours contentieux devant le Tribunal Administratif","description":"Déposez une requête introductive d''instance devant le tribunal administratif compétent.","duration":"1 mois pour rédiger","warning":"Le délai de 2 mois est impératif. Passé ce délai, votre recours est irrecevable."},
   {"step":3,"title":"Instruction contradictoire","description":"Le tribunal communique votre requête à l''administration défenderesse qui doit répondre.","duration":"6 à 18 mois","tips":"L''assistance d''un avocat n''est pas toujours obligatoire mais fortement recommandée."},
   {"step":4,"title":"Jugement","description":"Le tribunal statue : annulation ou réformation de la décision, injonction à l''administration.","duration":"1 à 3 mois après audience"},
   {"step":5,"title":"Appel et Cassation","description":"Appel devant la Cour Administrative d''Appel dans les 2 mois. Pourvoi en cassation devant le Conseil d''État en cas d''erreur de droit.","duration":"1 à 3 ans supplémentaires"}
 ]'::jsonb),

('injonction-payer', 'Recouvrer une créance (injonction de payer)', 'civil', 'Facile', '1 à 3 mois',
 'Procédure simplifiée et rapide pour recouvrer une créance certaine, liquide et exigible.',
 '[
   {"step":1,"title":"Vérification de la créance","description":"La créance doit être : certaine, liquide (montant défini), exigible (délai de paiement dépassé).","duration":"1 à 3 jours"},
   {"step":2,"title":"Mise en demeure préalable","description":"Envoyez une mise en demeure par LRAR au débiteur. Elle lui accorde un dernier délai pour payer.","duration":"8 à 15 jours","tips":"Mentionnez que vous saisirez la justice en cas de non-paiement."},
   {"step":3,"title":"Requête en injonction de payer","description":"Déposez une requête au greffe du tribunal judiciaire. La procédure est non contradictoire.","duration":"1 à 2 semaines","tips":"La requête peut être déposée sans avocat jusqu''à 10 000€."},
   {"step":4,"title":"Ordonnance portant injonction de payer","description":"Si la requête est fondée, le juge rend une ordonnance d''injonction de payer.","duration":"2 à 4 semaines","warning":"En cas de rejet, vous pouvez assigner le débiteur en procédure ordinaire."},
   {"step":5,"title":"Apposition de la formule exécutoire","description":"Si aucune opposition n''est formée dans le délai d''1 mois, demandez au greffe l''apposition de la formule exécutoire.","duration":"1 à 2 semaines","tips":"Transmettez le titre exécutoire à un huissier pour procéder aux saisies."}
 ]'::jsonb);

-- ─── 5. ACTIVER LA RÉPLICATION REALTIME ──────────────────────────────────────
-- Dans Supabase, activer les publications Realtime pour toutes les tables
-- Supabase active automatiquement supabase_realtime pour les tables RLS
-- Pour s''assurer que law_codes_just et procedures_just sont dans la publication :
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.law_codes_just;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.procedures_just;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.formations_just;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.outils_just;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ─── VÉRIFICATION ─────────────────────────────────────────────────────────────
SELECT 'law_codes_just' AS table_name, COUNT(*) AS rows FROM public.law_codes_just
UNION ALL
SELECT 'procedures_just', COUNT(*) FROM public.procedures_just
UNION ALL
SELECT 'formations_just', COUNT(*) FROM public.formations_just
UNION ALL
SELECT 'outils_just', COUNT(*) FROM public.outils_just;
