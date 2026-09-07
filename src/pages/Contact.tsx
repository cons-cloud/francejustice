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
    <div className="bg-gradient-to-b from-cyan-50/60 via-white to-slate-50 text-slate-900 min-h-screen py-16">
      <Modal
        isOpen={submitted}
        onClose={() => setSubmitted(false)}
        title={t('contact.success')}
      >
        <div className="text-center py-6">
          <div className="mx-auto h-16 w-16 bg-cyan-50 border border-cyan-200 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-cyan-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('contact.success')}</h3>
          <p className="text-slate-600 mb-6">
            {t('contact.success_desc', 'Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais sur votre adresse email.')}
          </p>
          <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-xl shadow-md shadow-cyan-600/20" onClick={() => setSubmitted(false)}>
            {t('common.close')}
          </Button>
        </div>
      </Modal>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100/80 text-cyan-800 border border-cyan-200 mb-3">
              <Mail className="w-3.5 h-3.5" />
              Service d'Assistance & Permanence
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 text-center tracking-tight">{t('contact.title')}</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto text-center leading-relaxed">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-cyan-300 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-xl">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{t('contact.email_title')}</h3>
                    <p className="text-slate-700 text-sm">contact@francejustice.com</p>
                    <p className="text-slate-400 text-xs">support@francejustice.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-cyan-300 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-teal-50 border border-teal-100 text-teal-600 rounded-xl">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{t('contact.phone_title')}</h3>
                    <p className="text-slate-700 text-sm font-semibold">+33607517416</p>
                    <p className="text-cyan-700 text-xs font-medium">{t('contact.hours', 'ouvert tous les jours 24h/24')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-cyan-300 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-sky-50 border border-sky-100 text-sky-600 rounded-xl">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{t('contact.address_title')}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed mt-1">1275 route de chateau neuf 26320 saint marcelle les valence</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">{t('contact.name')}</label>
                      <Input
                        name="name"
                        placeholder="Ahmed Alaoui"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="bg-slate-50/60 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">{t('contact.email')}</label>
                      <Input
                        type="email"
                        name="email"
                        placeholder="ahmed@exemple.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="bg-slate-50/60 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">{t('contact.subject')}</label>
                    <Input
                      name="subject"
                      placeholder={t('contact.subject_placeholder', 'Question sur le divorce, héritage...')}
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="bg-slate-50/60 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">{t('contact.message')}</label>
                    <textarea
                      name="message"
                      rows={5}
                      placeholder={t('contact.message_placeholder', 'Décrivez votre situation ici...')}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full flex rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-hidden"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-r-md text-sm font-medium">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-base font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20 rounded-2xl transition-all"
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