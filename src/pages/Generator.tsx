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
import { useTranslation } from '../i18n';

interface GeneratorProps {
  skipAuthCheck?: boolean;
}

export const DocumentGenerator: React.FC<GeneratorProps> = ({ skipAuthCheck = false }) => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
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
      success(t('generator.generated_title', 'Généré'), t('generator.generated_desc', 'Votre document a été généré par l\'IA.'));
      setCurrentStep(6); // Step for result

      // Save to Supabase
      if (user) {
        const { error: saveError } = await supabase
          .from('documents_just')
          .insert([{
            name: `${formData.documentType} - ${new Date().toLocaleDateString()}`,
            type: 'legal_template',
            owner_id: user.id,
            created_at: new Date().toISOString(),
            metadata: { ...formData, content }
          }]);
        if (saveError) console.error('Error saving document:', saveError);
      }
    } catch (e: any) {
      error(t('common.error'), e.message || t('generator.failed', 'La génération a échoué.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const documentTypes = [
    { id: 'plainte-simple', title: t('generator.type_plainte', 'Plainte simple'), description: t('generator.type_plainte_desc', 'Déposer une plainte auprès du Procureur de la République'), icon: FileText },
    { id: 'pre-plainte', title: t('generator.type_preplainte', 'Pré-plainte en ligne'), description: t('generator.type_preplainte_desc', 'Démarche préalable officielle avant convocation'), icon: FileText },
    { id: 'main-courante', title: t('generator.type_maincourante', 'Main courante'), description: t('generator.type_maincourante_desc', 'Consigner officiellement des faits sans plainte'), icon: FileText },
    { id: 'signalement-ong-police-citoyenne', title: t('generator.type_signalement', 'Fiche de Signalement — ONG Police Citoyenne Europe'), description: t('generator.type_signalement_desc', 'Formulaire officiel d\'ouverture d\'enquête opposable aux Ministères et Cours d\'Appel'), icon: FileText },
    { id: 'recours-gracieux', title: t('generator.type_recours', 'Recours gracieux & Administratif'), description: t('generator.type_recours_desc', "Demande d'annulation ou de révision d'une décision"), icon: FileText },
    { id: 'contrat-prestation', title: t('generator.type_prestation', 'Contrat de Prestation / Convention'), description: t('generator.type_prestation_desc', "Rédaction d'un accord commercial ou convention d'honoraires"), icon: FileText },
    { id: 'conclusions-anonymisees', title: t('generator.type_conclusions', 'Conclusions & Actes Judiciaires Anonymisés'), description: t('generator.type_conclusions_desc', 'Trame de conclusions avec occultation RGPD automatique des données'), icon: FileText },
  ];

  const steps = [
    { number: 1, title: t('generator.step1_title', 'Type de document'), description: t('generator.step1_desc', 'Choisissez le type') },
    { number: 2, title: t('generator.step2_title', 'Vos informations'), description: t('generator.step2_desc', 'Renseignez vos coordonnées') },
    { number: 3, title: t('generator.step3_title', "L'incident"), description: t('generator.step3_desc', 'Décrivez les faits') },
    { number: 4, title: t('generator.step4_title', 'Détails juridiques'), description: t('generator.step4_desc', 'Précisez les aspects') },
    { number: 5, title: t('generator.step5_title', 'Finalisation'), description: t('generator.step5_desc', 'Vérifiez et générez') },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {t('generator.select_doc_type', 'Quel type de document souhaitez-vous générer ?')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.documentType === type.id;
                return (
                  <Card
                    key={type.id}
                    className={`relative cursor-pointer transition-all duration-300 rounded-2xl p-1 ${
                      isSelected
                        ? 'border-2 border-cyan-600 bg-cyan-50/90 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10 scale-[1.01]'
                        : 'border border-slate-200 hover:border-cyan-400 hover:bg-slate-50/80 bg-white'
                    }`}
                    onClick={() => handleInputChange('documentType', type.id)}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 bg-cyan-600 text-white rounded-full p-1 shadow-md">
                        <CheckCircle className="h-5 w-5 fill-white text-cyan-600" />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl transition-colors ${isSelected ? 'bg-cyan-600 text-white' : 'bg-cyan-50 text-cyan-700'}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="pr-6">
                          <h4 className={`text-lg font-bold mb-1 ${isSelected ? 'text-cyan-950' : 'text-slate-900'}`}>
                            {type.title}
                          </h4>
                          <p className={`text-sm leading-relaxed ${isSelected ? 'text-cyan-900/80 font-medium' : 'text-slate-600'}`}>
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
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {t('generator.personal_info', 'Vos informations personnelles')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('register.first_name')}
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
              <Input
                label={t('register.last_name')}
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
              <Input
                label={t('register.email')}
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
              <Input
                label={t('register.phone')}
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
              <div className="md:col-span-2">
                <Input
                  label={t('dashboard.address')}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              <Input
                label={t('generator.city_label', 'Ville')}
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
              <Input
                label={t('generator.postal_code_label', 'Code postal')}
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {t('generator.describe_incident', "Décrivez l'incident")}
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('generator.incident_date', "Date de l'incident")}
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                />
                <Input
                  label={t('generator.incident_location', "Lieu de l'incident")}
                  value={formData.incidentLocation}
                  onChange={(e) => handleInputChange('incidentLocation', e.target.value)}
                />
              </div>
              <Textarea
                label={t('generator.facts_desc', 'Description détaillée des faits')}
                placeholder={t('generator.facts_placeholder', "Décrivez précisément ce qui s'est passé, les circonstances, les personnes impliquées...")}
                value={formData.incidentDescription}
                onChange={(e) => handleInputChange('incidentDescription', e.target.value)}
                rows={6}
                required
              />
              <Textarea
                label={t('generator.witnesses_label', 'Témoins (si applicable)')}
                placeholder={t('generator.witnesses_placeholder', 'Nom, coordonnées et témoignage des témoins...')}
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
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {t('generator.legal_details', 'Détails juridiques')}
            </h3>
            <div className="space-y-6">
              <Textarea
                label={t('generator.legal_basis_label', 'Base juridique')}
                placeholder={t('generator.legal_basis_placeholder', 'Articles de loi applicables, textes de référence...')}
                value={formData.legalBasis}
                onChange={(e) => handleInputChange('legalBasis', e.target.value)}
                rows={4}
              />
              <Textarea
                label={t('generator.actions_label', 'Actions demandées')}
                placeholder={t('generator.actions_placeholder', 'Que souhaitez-vous obtenir ? (poursuites, dommages-intérêts, etc.)')}
                value={formData.requestedActions}
                onChange={(e) => handleInputChange('requestedActions', e.target.value)}
                rows={4}
              />
              <Textarea
                label={t('generator.evidence_label', 'Preuves et éléments')}
                placeholder={t('generator.evidence_placeholder', 'Documents, photos, témoignages, éléments de preuve...')}
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
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {t('generator.final_verify', 'Vérification et finalisation')}
            </h3>
            <div className="space-y-6">
              <Card className="bg-slate-50/80 border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-900 text-lg">
                    <CheckCircle className="h-5 w-5 text-cyan-600 mr-2" />
                    {t('generator.summary_label', 'Récapitulatif')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-slate-700">
                    <div>
                      <strong className="text-slate-900">{t('generator.doc_type_bold', 'Type de document :')}</strong> {documentTypes.find(t => t.id === formData.documentType)?.title}
                    </div>
                    <div>
                      <strong className="text-slate-900">{t('generator.name_bold', 'Nom :')}</strong> {formData.firstName} {formData.lastName}
                    </div>
                    <div>
                      <strong className="text-slate-900">{t('generator.email_bold', 'Email :')}</strong> {formData.email}
                    </div>
                    <div>
                      <strong className="text-slate-900">{t('generator.date_bold', "Date de l'incident :")}</strong> {formData.incidentDate}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Textarea
                label={t('generator.additional_info_label', 'Informations complémentaires')}
                placeholder={t('generator.additional_info_placeholder', 'Toute information supplémentaire que vous souhaitez ajouter...')}
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                rows={4}
              />
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">{t('search.warning_title')}</h4>
                    <p className="text-amber-800 text-sm">
                      {t('generator.warning_desc', "Vérifiez attentivement toutes les informations avant de générer le document. Une fois généré, vous pourrez le télécharger et l'imprimer.")}
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
            <h3 className="text-2xl font-bold text-slate-900 mb-6">{t('generator.ready', 'Votre document est prêt !')}</h3>
            <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-xl min-h-[400px] whitespace-pre-wrap font-serif text-slate-900 leading-relaxed ring-1 ring-slate-900/5">
              {generatedContent}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(5)}>{t('common.edit')}</Button>
              <Button onClick={() => window.print()} className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20">
                <Download className="h-4 w-4 mr-2" />
                {t('common.download')} (PDF)
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (skipAuthCheck) {
    return (
      <div className="space-y-6">
        {/* Progress Steps */}
        <Card className="border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors ${
                    currentStep >= step.number
                      ? 'bg-cyan-600 border-cyan-600 text-white'
                      : 'border-slate-300 text-slate-400 bg-white'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className={`text-xs font-semibold ${currentStep >= step.number ? 'text-slate-900' : 'text-slate-500'}`}>{step.title}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-6 h-0.5 mx-3 ${
                      currentStep > step.number ? 'bg-cyan-600' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="flex items-center border-slate-200 text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.previous')}
          </Button>
          {currentStep < 5 ? (
            <Button onClick={nextStep} disabled={isNextDisabled()} className="flex items-center bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20 disabled:opacity-50">
              {t('common.next')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex space-x-4">
              <Button onClick={handleGenerate} disabled={isGenerating} className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20">
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? t('generator.generating', 'Génération...') : t('generator.generate')}
              </Button>
            </div>
          )}
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-white to-slate-50 text-slate-900">
      <div className="container py-8 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100/80 text-cyan-800 border border-cyan-200 mb-3">
            <FileText className="w-3.5 h-3.5" />
            Générateur d'actes certifiés
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            {t('generator.title')}
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            {t('generator.subtitle')}
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8 border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep >= step.number
                      ? 'bg-cyan-600 border-cyan-600 text-white shadow-md shadow-cyan-600/20'
                      : 'border-slate-300 text-slate-400 bg-white'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{step.number}</span>
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div className={`text-sm font-bold ${currentStep >= step.number ? 'text-slate-900' : 'text-slate-500'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {step.description}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-8 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-cyan-600' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="mb-8 border border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-6 sm:p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.previous')}
          </Button>
          
          {currentStep < 5 ? (
            <Button onClick={nextStep} disabled={isNextDisabled()} className="flex items-center bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20 disabled:opacity-50">
              {t('common.next')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex space-x-4">
              <Button variant="outline" className="flex items-center border-slate-200 text-slate-700 hover:bg-slate-50">
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating} className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20">
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? t('generator.generating', 'Génération...') : t('generator.generate')}
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
