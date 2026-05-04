import React from 'react';
import { Shield, FileText, Lock, Cookie, Scale } from 'lucide-react';

const Legal: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="container max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
                    <div className="bg-primary-600 p-8 text-white">
                        <Scale className="h-12 w-12 mb-4" />
                        <h1 className="text-3xl font-bold">Informations Légales</h1>
                        <p className="text-primary-100 mt-2">Dernière mise à jour : 27 Avril 2026</p>
                    </div>

                    <div className="p-8 space-y-12">
                        {/* 1. Mentions Légales */}
                        <section id="legal">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Mentions Légales</h2>
                            </div>
                            <div className="prose prose-blue max-w-none text-gray-600 space-y-4">
                                <p><strong>Éditeur du site :</strong> France Justice SAS, société au capital de 50 000 €, dont le siège social est situé au 1275 route de chateau neuf 26320 saint marcelle les valence.</p>
                                <p><strong>Directeur de la publication :</strong> Administrateur France Justice.</p>
                                <p><strong>Hébergement :</strong> Platform.sh / Railway.</p>
                                <p><strong>Contact :</strong>imam@orange.fr | +33607517416</p>
                            </div>
                        </section>

                        {/* 2. Politique de Confidentialité */}
                        <section id="privacy">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <Lock className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Politique de Confidentialité</h2>
                            </div>
                            <div className="prose prose-green max-w-none text-gray-600 space-y-4">
                                <p>France Justice s'engage à protéger vos données personnelles. Nous collectons uniquement les données nécessaires au bon fonctionnement de nos services juridiques.</p>
                                <ul className="list-disc pl-5">
                                    <li>Collecte de données : Nom, prénom, email, spécialité (avocats).</li>
                                    <li>Usage : Mise en relation, génération de documents IA.</li>
                                    <li>Partage : Aucune donnée n'est vendue à des tiers.</li>
                                    <li>Sécurité : Chiffrement SSL, protocoles JWT, isolation des données via RLS.</li>
                                </ul>
                            </div>
                        </section>

                        {/* 3. CGU */}
                        <section id="terms">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Conditions Générales d'Utilisation</h2>
                            </div>
                            <div className="prose prose-orange max-w-none text-gray-600 space-y-4">
                                <p>L'utilisation de la plateforme France Justice implique l'acceptation intégrale des présentes conditions d'utilisation.</p>
                                <p>La plateforme fournit des outils d'aide juridique basés sur l'IA, mais ne remplace en aucun cas les conseils directs d'un avocat humain. Les utilisateurs sont encouragés à contacter les avocats vérifiés via notre plateforme.</p>
                            </div>
                        </section>

                        {/* 4. Cookies */}
                        <section id="cookies">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Cookie className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Politique des Cookies</h2>
                            </div>
                            <div className="prose prose-purple max-w-none text-gray-600 space-y-4">
                                <p>Nous utilisons des cookies essentiels pour assurer la session utilisateur et la sécurité.</p>
                                <p>Google Analytics est utilisé de manière anonyme pour améliorer l'expérience utilisateur et les performances du site.</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Legal;
