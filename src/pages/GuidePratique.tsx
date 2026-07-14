import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { FileText, Shield, Scale, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n';

const GuidePratique: React.FC = () => {
  const { t } = useTranslation();

  const guides = [
    {
      title: t('guide.guide1_title', 'Déposer une plainte'),
      icon: FileText,
      content: t('guide.guide1_content', `1. Identifiez les faits (date, lieu, personnes impliquées)
2. Rassemblez les preuves (documents, photos, messages)
3. Rédigez votre plainte clairement
4. Déposez-la auprès des autorités compétentes`),
    },
    {
      title: t('guide.guide2_title', 'Comprendre vos droits'),
      icon: Scale,
      content: t('guide.guide2_content', `Chaque citoyen dispose de droits fondamentaux protégés par la loi.
Il est essentiel de connaître vos droits avant d'entamer toute procédure.`),
    },
    {
      title: t('guide.guide3_title', 'Se protéger juridiquement'),
      icon: Shield,
      content: t('guide.guide3_content', `Protégez-vous en gardant des preuves écrites,
en documentant chaque échange et en consultant un professionnel.`),
    },
    {
      title: t('guide.guide4_title', 'Erreurs à éviter'),
      icon: AlertTriangle,
      content: t('guide.guide4_content', `- Agir sans preuve
- Signer des documents sans lecture
- Ignorer les délais légaux
- Ne pas consulter un avocat`),
    },
  ];

  return (
    <div className="min-h-screen bg-secondary-50 py-16">
      <div className="container max-w-5xl mx-auto">

        <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6 text-center">
          {t('guide.title')}
        </h1>

        <p className="text-secondary-600 text-center mb-12">
          {t('guide.subtitle', 'Des conseils simples pour vous aider à comprendre et agir efficacement')}
        </p>

        <div className="grid gap-6">
          {guides.map((guide, index) => {
            const Icon = guide.icon;

            return (
              <Card key={index} hover>
                <CardHeader className="flex items-center gap-3">
                  <Icon className="text-primary-600" />
                  <CardTitle>{guide.title}</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-secondary-600 whitespace-pre-line">
                    {guide.content}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default GuidePratique;