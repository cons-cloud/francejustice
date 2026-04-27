import React, { useState } from 'react';
import { FileText, Download, Save, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AuthModal } from '../components/ui/AuthModal';
import { generateLegalDocument } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';

interface GeneratorProps {
  skipAuthCheck?: boolean;
}

export const DocumentGenerator: React.FC<GeneratorProps> = ({ skipAuthCheck = false }) => {
  const { user, profile } = useAuth();
  const { toasts, success, error, removeToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  
  const [formData, setFormData] = useState({
    documentType: '',
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    incidentDate: '',
    incidentLocation: '',
    incidentDescription: '',
    witnesses: '',
    legalBasis: '',
    requestedActions: '',
    evidence: '',
    additionalInfo: '',
  });

  // Sync profile data when available
  React.useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: user?.email || prev.email
      }));
    }
  }, [profile, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isNextDisabled = () => {
    if (currentStep === 1) return !formData.documentType;
    if (currentStep === 2) return !formData.firstName || !formData.lastName || !formData.email;
    if (currentStep === 3) return !formData.incidentDescription;
    return false;
  };

  const nextStep = () => {
    if (currentStep < 5 && !isNextDisabled()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    if (!user && !skipAuthCheck) {
      setShowAuthModal(true);
      return;
    }
    setIsGenerating(true);
    try {
      const details = `
        Utilisateur: ${formData.firstName} ${formData.lastName}
        Incident: ${formData.incidentDescription} le ${formData.incidentDate} à ${formData.incidentLocation}
        Bases juridiques: ${formData.legalBasis}
        Actions: ${formData.requestedActions}
        Preuves: ${formData.evidence}
        Compléments: ${formData.additionalInfo}
      `;
      
      const content = await generateLegalDocument(formData.documentType, details);
      setGeneratedContent(content);
      success('Généré', 'Votre document a été généré par l\'IA.');
      setCurrentStep(6); // Step for result

      // Save to Supabase
      if (user) {
        const { error: saveError } = await supabase
          .from('documents')
          .insert([{
            name: `${formData.documentType} - ${new Date().toLocaleDateString()}`,
            type: 'legal_template',
            owner_id: user.id,
            metadata: { ...formData, content }
          }]);
        if (saveError) console.error('Error saving document:', saveError);
      }
    } catch (e: any) {
      error('Erreur', e.message || 'La génération a échoué.');
    } finally {
      setIsGenerating(false);
    }
  };

  const documentTypes = [
    { id: 'plainte-simple', title: 'Plainte simple', description: 'Déposer une plainte pour un délit ou un crime', icon: FileText },
    { id: 'pre-plainte', title: 'Pré-plainte en ligne', description: 'Démarche préalable avant dépôt de plainte', icon: FileText },
    { id: 'main-courante', title: 'Main courante', description: 'Consigner des faits sans porter plainte', icon: FileText },
    { id: 'recours-gracieux', title: 'Recours gracieux', description: 'Demande d\'annulation ou de modification d\'une décision', icon: FileText },
  ];

  const steps = [
    { number: 1, title: 'Type de document', description: 'Choisissez le type' },
    { number: 2, title: 'Vos informations', description: 'Renseignez vos coordonnées' },
    { number: 3, title: 'L\'incident', description: 'Décrivez les faits' },
    { number: 4, title: 'Détails juridiques', description: 'Précisez les aspects' },
    { number: 5, title: 'Finalisation', description: 'Vérifiez et générez' },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-secondary-900 mb-6">
              Quel type de document souhaitez-vous générer ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.id}
                    hover
                    className={`cursor-pointer transition-all duration-200 ${
                      formData.documentType === type.id
                        ? '!border-2 !border-primary-500 !bg-primary-50/50 scale-[1.02] shadow-md'
                        : '!border-2 !border-transparent hover:!border-secondary-200'
                    }`}
                    onClick={() => handleInputChange('documentType', type.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-primary-100 rounded-lg">
                          <Icon className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-secondary-900 mb-2">
                            {type.title}
                          </h4>
                          <p className="text-secondary-600">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-secondary-900 mb-6">
              Vos informations personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Prénom"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
              <Input
                label="Nom"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
              <Input
                label="Téléphone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
              <div className="md:col-span-2">
                <Input
                  label="Adresse"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              <Input
                label="Ville"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
              <Input
                label="Code postal"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-secondary-900 mb-6">
              Décrivez l'incident
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Date de l'incident"
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                />
                <Input
                  label="Lieu de l'incident"
                  value={formData.incidentLocation}
                  onChange={(e) => handleInputChange('incidentLocation', e.target.value)}
                />
              </div>
              <Textarea
                label="Description détaillée des faits"
                placeholder="Décrivez précisément ce qui s'est passé, les circonstances, les personnes impliquées..."
                value={formData.incidentDescription}
                onChange={(e) => handleInputChange('incidentDescription', e.target.value)}
                rows={6}
                required
              />
              <Textarea
                label="Témoins (si applicable)"
                placeholder="Nom, coordonnées et témoignage des témoins..."
                value={formData.witnesses}
                onChange={(e) => handleInputChange('witnesses', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-secondary-900 mb-6">
              Détails juridiques
            </h3>
            <div className="space-y-6">
              <Textarea
                label="Base juridique"
                placeholder="Articles de loi applicables, textes de référence..."
                value={formData.legalBasis}
                onChange={(e) => handleInputChange('legalBasis', e.target.value)}
                rows={4}
              />
              <Textarea
                label="Actions demandées"
                placeholder="Que souhaitez-vous obtenir ? (poursuites, dommages-intérêts, etc.)"
                value={formData.requestedActions}
                onChange={(e) => handleInputChange('requestedActions', e.target.value)}
                rows={4}
              />
              <Textarea
                label="Preuves et éléments"
                placeholder="Documents, photos, témoignages, éléments de preuve..."
                value={formData.evidence}
                onChange={(e) => handleInputChange('evidence', e.target.value)}
                rows={4}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-secondary-900 mb-6">
              Vérification et finalisation
            </h3>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
                    Récapitulatif
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <strong>Type de document :</strong> {documentTypes.find(t => t.id === formData.documentType)?.title}
                    </div>
                    <div>
                      <strong>Nom :</strong> {formData.firstName} {formData.lastName}
                    </div>
                    <div>
                      <strong>Email :</strong> {formData.email}
                    </div>
                    <div>
                      <strong>Date de l'incident :</strong> {formData.incidentDate}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Textarea
                label="Informations complémentaires"
                placeholder="Toute information supplémentaire que vous souhaitez ajouter..."
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                rows={4}
              />
              
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-warning-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-warning-800 mb-2">Important</h4>
                    <p className="text-warning-700 text-sm">
                      Vérifiez attentivement toutes les informations avant de générer le document. 
                      Une fois généré, vous pourrez le télécharger et l'imprimer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-secondary-900 mb-6">Votre document est prêt !</h3>
            <div className="p-6 bg-white border border-secondary-200 rounded-lg shadow-inner min-h-[400px] whitespace-pre-wrap font-serif text-secondary-800">
              {generatedContent}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(5)}>Modifier</Button>
              <Button onClick={() => window.print()}><Download className="h-4 w-4 mr-2" />Télécharger (PDF)</Button>
            </div>
          </div>
        );
    }
  };

  if (skipAuthCheck) {
    // Inline rendering for Dashboard (no full-page wrapper, no auth modal)
    return (
      <div className="space-y-6">
        {/* Progress Steps */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 ${
                    currentStep >= step.number
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-secondary-300 text-secondary-400'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className="text-xs font-medium text-secondary-900">{step.title}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-6 h-0.5 mx-3 ${
                      currentStep > step.number ? 'bg-primary-600' : 'bg-secondary-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
          {currentStep < 5 ? (
            <Button onClick={nextStep} disabled={isNextDisabled()} className="flex items-center">
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex space-x-4">
              <Button onClick={handleGenerate} disabled={isGenerating}>
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Génération...' : 'Générer le document'}
              </Button>
            </div>
          )}
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            Générateur de documents juridiques
          </h1>
          <p className="text-xl text-secondary-600 max-w-3xl">
            Créez facilement vos documents juridiques personnalisés en quelques étapes simples.
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-secondary-300 text-secondary-400'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div className="text-sm font-medium text-secondary-900">
                      {step.title}
                    </div>
                    <div className="text-xs text-secondary-500">
                      {step.description}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-8 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-primary-600' : 'bg-secondary-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
          
          {currentStep < 5 ? (
            <Button onClick={nextStep} disabled={isNextDisabled()} className="flex items-center">
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex space-x-4">
              <Button variant="outline" className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Génération...' : 'Générer le document'}
              </Button>
            </div>
          )}
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    </div>
  );
};

export default DocumentGenerator;
