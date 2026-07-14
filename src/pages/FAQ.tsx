import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../i18n';

const FAQ: React.FC = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: t('faq.q1', 'Comment fonctionne la plateforme ?'),
      answer: t('faq.a1', "Notre plateforme utilise l'intelligence artificielle pour analyser vos situations juridiques et vous orienter vers les meilleures solutions."),
    },
    {
      question: t('faq.q2', 'Est-ce que mes données sont sécurisées ?'),
      answer: t('faq.a2', 'Oui, toutes vos données sont chiffrées et protégées conformément aux normes RGPD.'),
    },
    {
      question: t('faq.q3', 'Puis-je parler à un avocat ?'),
      answer: t('faq.a3', 'Oui, vous pouvez être mis en relation avec des avocats qualifiés selon votre besoin.'),
    },
    {
      question: t('faq.q4', 'Les services sont-ils gratuits ?'),
      answer: t('faq.a4', "Une partie des services est gratuite, mais certaines fonctionnalités avancées peuvent être payantes."),
    },
    {
      question: t('faq.q5', 'Comment créer un document juridique ?'),
      answer: t('faq.a5', 'Il suffit de remplir un formulaire et notre système génère automatiquement un document prêt à être utilisé.'),
    },
  ];

  return (
    <div className="min-h-screen bg-secondary-50 py-16">
      <div className="container max-w-4xl mx-auto">

        <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 text-center mb-10">
          {t('faq.title')}
        </h1>

        <div className="space-y-4">

          {faqs.map((faq, index) => (
            <Card key={index} hover>
              <CardContent>
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full flex justify-between items-center text-left"
                >
                  <span className="font-semibold text-secondary-900">
                    {faq.question}
                  </span>

                  <ChevronDown
                    className={`transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openIndex === index && (
                  <p className="mt-3 text-secondary-600">
                    {faq.answer}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

        </div>

      </div>
    </div>
  );
};

export default FAQ;