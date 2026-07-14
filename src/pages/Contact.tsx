import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { useTranslation } from "../i18n";

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('contact_messages_just')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message
          }
        ]);

      if (dbError) throw dbError;

      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary-50 min-h-screen py-12">
      <Modal
        isOpen={submitted}
        onClose={() => setSubmitted(false)}
        title={t('contact.success')}
      >
        <div className="text-center py-6">
          <div className="mx-auto h-16 w-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
          <h3 className="text-2xl font-bold text-secondary-900 mb-2">{t('contact.success')}</h3>
          <p className="text-secondary-600 mb-6">
            {t('contact.success_desc', 'Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais sur votre adresse email.')}
          </p>
          <Button className="w-full" onClick={() => setSubmitted(false)}>
            {t('common.close')}
          </Button>
        </div>
      </Modal>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">{t('contact.title')}</h1>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-100">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-900">{t('contact.email_title')}</h3>
                    <p className="text-secondary-500">contact@lawjustlaw.com</p>
                    <p className="text-secondary-500">support@lawjustlaw.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-100">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-secondary-50 text-secondary-600 rounded-xl">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-900">{t('contact.phone_title')}</h3>
                    <p className="text-secondary-500">+33607517416</p>
                    <p className="text-secondary-500">{t('contact.hours', 'Lundi - Vendredi, 9h - 18h')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-100">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-900">{t('contact.address_title')}</h3>
                    <p className="text-secondary-500">1275 route de chateau neuf 26320 saint marcelle les valence</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-secondary-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-secondary-700 uppercase tracking-wider ml-1">{t('contact.name')}</label>
                      <Input
                        name="name"
                        placeholder="Ahmed Alaoui"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-secondary-700 uppercase tracking-wider ml-1">{t('contact.email')}</label>
                      <Input
                        type="email"
                        name="email"
                        placeholder="ahmed@exemple.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-secondary-700 uppercase tracking-wider ml-1">{t('contact.subject')}</label>
                    <Input
                      name="subject"
                      placeholder={t('contact.subject_placeholder', 'Question sur le divorce, héritage...')}
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-secondary-700 uppercase tracking-wider ml-1">{t('contact.message')}</label>
                    <textarea
                      name="message"
                      rows={5}
                      placeholder={t('contact.message_placeholder', 'Décrivez votre situation ici...')}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full flex rounded-2xl border border-secondary-200 bg-white px-4 py-3 text-secondary-900 shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-lg font-bold shadow-lg shadow-primary-500/20"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <Send className="w-5 h-5 mr-3 animate-pulse" />
                        {t('contact.sending', 'Envoi en cours...')}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Send className="w-5 h-5 mr-3" />
                        {t('contact.submit')}
                      </span>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;