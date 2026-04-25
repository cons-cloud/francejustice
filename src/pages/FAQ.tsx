import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { ChevronDown } from 'lucide-react';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Comment fonctionne la plateforme ?',
      answer:
        'Notre plateforme utilise l’intelligence artificielle pour analyser vos situations juridiques et vous orienter vers les meilleures solutions.',
    },
    {
      question: 'Est-ce que mes données sont sécurisées ?',
      answer:
        'Oui, toutes vos données sont chiffrées et protégées conformément aux normes RGPD.',
    },
    {
      question: 'Puis-je parler à un avocat ?',
      answer:
        'Oui, vous pouvez être mis en relation avec des avocats qualifiés selon votre besoin.',
    },
    {
      question: 'Les services sont-ils gratuits ?',
      answer:
        'Une partie des services est gratuite, mais certaines fonctionnalités avancées peuvent être payantes.',
    },
    {
      question: 'Comment créer un document juridique ?',
      answer:
        'Il suffit de remplir un formulaire et notre système génère automatiquement un document prêt à être utilisé.',
    },
  ];

  return (
    <div className="min-h-screen bg-secondary-50 py-16">
      <div className="container max-w-4xl mx-auto">

        <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 text-center mb-10">
          Foire aux questions (FAQ)
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