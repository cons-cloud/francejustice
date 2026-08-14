import React from 'react';
import { Shield, FileText, Lock, Cookie, Scale, MapPin, Mail, Phone } from 'lucide-react';
import { useTranslation } from '../i18n';

const Legal: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="container max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
                    {/* Header */}
                    <div className="bg-primary-600 p-8 text-white">
                        <Scale className="h-12 w-12 mb-4" />
                        <h1 className="text-3xl font-bold">{t('legal.title', 'Informations Légales & Conformité')}</h1>
                        <p className="text-primary-100 mt-2">{t('legal.last_update', 'Dernière mise à jour : 30 Juillet 2026')}</p>
                    </div>

                    <div className="p-8 space-y-12">
                        {/* 1. Mentions Légales */}
                        <section id="legal" className="scroll-mt-24">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{t('legal.notice_title', '1. Mentions Légales')}</h2>
                            </div>
                            <div className="prose prose-blue max-w-none text-gray-600 space-y-4 text-sm leading-relaxed">
                                <p>
                                    Conformément aux dispositions de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), il est précisé aux utilisateurs de la plateforme **France Justice** l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi.
                                </p>
                                
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800 mb-2">Éditeur de la plateforme</h3>
                                        <p className="font-semibold text-primary-700">France Justice SAS</p>
                                        <p>Société par Actions Simplifiée (SAS) au capital de 50 000 €</p>
                                        <p>RCS : Romans B 812 345 678</p>
                                        <p>TVA Intracommunautaire : FR 12 812 345 678</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 mb-2">Siège Social & Contact</h3>
                                        <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 1275 route de chateau neuf, 26320 Saint-Marcel-lès-Valence</p>
                                        <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> contact@francejustice.com</p>
                                        <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> +33 6 07 51 74 16</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-4">
                                    <p>
                                        <strong>Directeur de la publication :</strong> Le représentant légal de France Justice SAS.
                                    </p>
                                    <p>
                                        <strong>Hébergement de l'application :</strong>
                                        <br />
                                        La plateforme France Justice est propulsée et hébergée par :
                                        <span className="block pl-4 mt-1 text-slate-500">
                                            - **Railway App Inc** (93 S Jackson St, Seattle, WA 98104, USA)
                                            <br />
                                            - **Platform.sh SAS** (22 rue de Palestro, 75002 Paris, France)
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* 2. Politique de Confidentialité */}
                        <section id="privacy" className="scroll-mt-24">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <Lock className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{t('legal.privacy_title', '2. Politique de Confidentialité (RGPD)')}</h2>
                            </div>
                            <div className="prose prose-green max-w-none text-gray-600 space-y-4 text-sm leading-relaxed">
                                <p>
                                    France Justice accorde une importance primordiale à la confidentialité et à la sécurité de vos données à caractère personnel. Cette politique décrit comment nous collectons, utilisons, stockons et protégeons vos données conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
                                </p>

                                <h3 className="font-bold text-slate-800 text-base mt-4">2.1 Données collectées</h3>
                                <p>
                                    Nous collectons uniquement les données strictement nécessaires à l'exécution de nos services juridiques :
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>**Pour les citoyens** : Nom, prénom, date de naissance, adresse postale, historique de recherche juridique et documents téléchargés ou générés (ex: plaintes).</li>
                                    <li>**Pour les avocats** : Identité complète, coordonnées professionnelles, appartenance au barreau, numéro de licence professionnelle, spécialités juridiques, et documents d'habilitation (carte professionnelle).</li>
                                </ul>

                                <h3 className="font-bold text-slate-800 text-base mt-4">2.2 Finalités des traitements</h3>
                                <p>
                                    Le traitement de vos données est fondé sur l'exécution des conditions d'utilisation et poursuit les finalités suivantes :
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>La création et la gestion de votre compte utilisateur ou avocat.</li>
                                    <li>Le fonctionnement des modules d'intelligence artificielle (génération de plaintes et analyse de documents).</li>
                                    <li>La mise en relation qualifiée et la planification de rendez-vous entre citoyens et avocats.</li>
                                    <li>La sécurisation des transactions financières par le biais de notre prestataire de paiement sécurisé (Stripe).</li>
                                </ul>

                                <h3 className="font-bold text-slate-800 text-base mt-4">2.3 Durée de conservation & Destinataires</h3>
                                <p>
                                    Vos données sont conservées pendant toute la durée d'activation de votre compte. En cas d'inactivité prolongée pendant 3 ans, les données sont supprimées. Vos données ne sont en aucun cas vendues à des tiers et ne sont accessibles qu'aux services internes de France Justice et aux avocats que vous choisissez de solliciter.
                                </p>

                                <h3 className="font-bold text-slate-800 text-base mt-4">2.4 Vos Droits Informatiques et Libertés</h3>
                                <p>
                                    Vous disposez d'un droit d'accès, de rectification, de suppression (droit à l'oubli), de limitation du traitement, de portabilité et d'opposition sur vos données personnelles. Vous pouvez exercer ces droits à tout moment en envoyant un e-mail à : **support@francejustice.com**.
                                </p>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* 3. CGU */}
                        <section id="terms" className="scroll-mt-24">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{t('legal.terms_title', "3. Conditions Générales d'Utilisation")}</h2>
                            </div>
                            <div className="prose prose-orange max-w-none text-gray-600 space-y-4 text-sm leading-relaxed">
                                <p>
                                    Les présentes Conditions Générales d'Utilisation (CGU) encadrent l'accès et l'utilisation des services de France Justice. L'utilisation de notre site implique l'acceptation pleine et entière de ces CGU par l'utilisateur.
                                </p>
                                <p>
                                    **Responsabilité relative à l'Intelligence Artificielle :**
                                    <br />
                                    France Justice met à disposition des utilisateurs des outils d'IA avancés pour générer des projets de documents juridiques et de plaintes. Bien que nos modèles soient entraînés sur des bases de données juridiques officielles, **les documents générés par l'IA ne constituent en aucun cas un avis juridique final et ne sauraient remplacer l'assistance, la validation ou les conseils d'un avocat inscrit au barreau.**
                                </p>
                                <p>
                                    L'utilisateur est fortement invité à solliciter les services d'un avocat partenaire référencé sur la plateforme pour finaliser et valider tout acte juridique ou procédure contentieuse.
                                </p>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* 4. Cookies */}
                        <section id="cookies" className="scroll-mt-24">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Cookie className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{t('legal.cookies_title', '4. Politique des Cookies')}</h2>
                            </div>
                            <div className="prose prose-purple max-w-none text-gray-600 space-y-4 text-sm leading-relaxed">
                                <p>
                                    Afin de rendre votre navigation sur notre plateforme la plus agréable et sécurisée possible, France Justice utilise des traceurs et cookies de navigation.
                                </p>
                                
                                <h3 className="font-bold text-slate-800 text-base mt-4">Types de cookies utilisés :</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>**Cookies techniques et essentiels** : Ces cookies sont indispensables pour vous connecter à votre espace personnel (gestion des jetons d'accès Supabase), mémoriser vos préférences de navigation et sécuriser les formulaires. Ils ne peuvent pas être désactivés car ils garantissent le fonctionnement de base de l'application.</li>
                                    <li>**Cookies de mesure d'audience** : Nous utilisons des outils d'analyse d'audience (ex: Google Analytics de manière anonyme) pour mesurer la fréquentation de notre site et repérer les éventuels bugs afin d'améliorer l'expérience utilisateur.</li>
                                    <li>**Cookies tiers liés aux paiements** : Notre partenaire Stripe dépose des cookies à des fins de sécurisation et de prévention contre la fraude lors des transactions de devis ou d'abonnements.</li>
                                </ul>

                                 <h3 className="font-bold text-slate-800 text-base mt-4">Gestion et paramétrage :</h3>
                                <p>
                                    À votre première visite sur France Justice, un bandeau d'information vous permet d'accepter ou de refuser l'utilisation de cookies non indispensables. Vous pouvez configurer ou bloquer ces cookies à tout moment via les options de configuration de votre navigateur Internet.
                                </p>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* 5. Charte & Règlement Intérieur - ONG Police Citoyenne Europe */}
                        <section id="ong-police-citoyenne" className="scroll-mt-24">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                                    <Scale className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">5. Règlement Intérieur & Charte Éthique — ONG Police Citoyenne - Europe</h2>
                            </div>
                            <div className="prose prose-emerald max-w-none text-gray-600 space-y-6 text-sm leading-relaxed">
                                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
                                    <h3 className="text-lg font-bold text-emerald-900 mb-2">Préambule : Principes Fondamentaux de Fraternité et d'Égalité</h3>
                                    <p className="text-emerald-800 italic">
                                        L'Organisation est guidée par une conviction humaine absolue : l'être humain n'est pleinement accompli que lorsqu'il se rend utile à son frère.
                                    </p>
                                    <ul className="list-disc pl-5 mt-3 space-y-1.5 text-emerald-900 font-medium">
                                        <li><strong>Fraternité Universelle :</strong> Nous sommes tous frères et sœurs au sein d'une même humanité. Aucune distinction de couleur, de race, d'origine, de genre ou de religion ne sera tolérée.</li>
                                        <li><strong>Liberté et Égalité Judiciaire :</strong> Tous les êtres humains naissent libres et demeurent rigoureusement égaux devant la justice. Aucun titre de noblesse, rang social, mandat politique, fonction administrative ou fortune ne peut permettre d'y déroger.</li>
                                        <li><strong>Devoir de Redevabilité :</strong> Face à une accusation étayée d'abus de pouvoir, de discrimination ou de manquement grave, la transparence est obligatoire. Toute personne mise en cause, quel que soit son rang, a le devoir strict et absolu de s'expliquer.</li>
                                    </ul>
                                </div>

                                <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4">
                                    <h3 className="text-base font-bold text-amber-400">Article 1 : Le Serment d'Intégrité, de Droiture et d'Égalité Absolue</h3>
                                    <p className="text-xs text-slate-300 italic">
                                        Tout membre habilité à mener ou participer à une investigation, un audit ou une expertise prête et signe le serment suivant :
                                    </p>
                                    <blockquote className="border-l-4 border-amber-400 pl-4 py-1 text-slate-200 font-serif italic text-sm">
                                        « Je jure devant mes pairs et les institutions de mener mes missions avec une intégrité absolue, une droiture morale irréprochable et une stricte impartialité. Je m'engage à rechercher la vérité sans préjugé, à traiter de manière égale toute personne impliquée quel que soit son rang, et à respecter le secret professionnel le plus strict. Dans l'exercice de mes fonctions, je reconnais chaque individu comme un citoyen égal devant la loi : du Président de la République à l'ouvrier, aucune distinction sociale, de titre, de fortune ou de fonction ne saurait influencer mon enquête ou altérer ma quête d'équité. »
                                    </blockquote>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-base font-bold text-slate-900">Article 2 : Méthodologie, Droits de la Défense et Auditions</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li><strong>Le Droit à l'Explication :</strong> Lorsqu'un individu (ministre, magistrat, policier ou citoyen) fait l'objet d'une enquête, l'Organisation lui adresse une demande d'audition ou un questionnaire précis pour garantir la possibilité de s'expliquer de manière contradictoire.</li>
                                        <li><strong>La Neutralité Factuelle :</strong> Les rapports s'appuient uniquement sur des preuves matérielles, des témoignages vérifiés et des faits datés.</li>
                                        <li><strong>La Traçabilité Numérique :</strong> Cryptage et stockage des pièces confidentielles sur des serveurs sécurisés conformes aux règles RGPD.</li>
                                    </ul>

                                    <h3 className="text-base font-bold text-slate-900">Article 7 : Évolutivité et Révision du Règlement Intérieur</h3>
                                    <p>
                                        Afin de toujours coller aux réalités du terrain et de servir strictement l'intérêt supérieur des citoyens, le présent Règlement Intérieur pourra être modifié ou complété à tout moment sans aucune restriction par le Bureau Exécutif ou le Conseil d'administration.
                                    </p>
                                </div>

                                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200 space-y-3">
                                    <h3 className="text-base font-bold text-indigo-900">Protocole de Désignation des Délégations Nationales (Article X)</h3>
                                    <p className="text-indigo-800 text-xs">
                                        Chaque État membre est placé sous la responsabilité exclusive d'un Délégué National nommé selon un processus rigoureux en 4 étapes (Appel à candidatures & enquête d'intégrité, Grand Oral devant le Bureau Européen, Prestation du Serment National, Décret d'Ouverture pour 3 ans).
                                    </p>
                                </div>

                                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 space-y-4">
                                    <h3 className="text-base font-bold text-amber-900">Guide Déontologique de l'Enquêteur Citoyen</h3>
                                    <div className="space-y-2 text-xs text-amber-950">
                                        <p><strong>Chapitre 1 — Posture & Éthique :</strong> Impartialité totale, recherche à charge et à décharge, refus des conflits d'intérêts, dignité et courtoisie.</p>
                                        <p><strong>Chapitre 2 — Méthodologie :</strong> Administration de la preuve factuelle, vérification systématique des sources, respect du délai contradictoire de 15 jours.</p>
                                        <p><strong>Chapitre 3 — Secret Professionnel :</strong> Confidentialité absolue des pièces transmises, interdiction formelle des fuites dans la presse ou les réseaux sociaux, cryptage RGPD obligatoire.</p>
                                        <p><strong>Chapitre 4 — Sanctions :</strong> Suspension conservatoire, entretien disciplinaire et exclusion définitive en cas de manquement.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Legal;
