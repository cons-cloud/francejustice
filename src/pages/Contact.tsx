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
    <div className="bg-slate-950 text-slate-100 min-h-screen py-12">
      <Modal
        isOpen={submitted}
        onClose={() => setSubmitted(false)}
        title={t('contact.success')}
      >
        <div className="text-center py-6">
          <div className="mx-auto h-16 w-16 bg-emerald-950/80 border border-emerald-800 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">{t('contact.success')}</h3>
          <p className="text-slate-300 mb-6">
            {t('contact.success_desc', 'Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais sur votre adresse email.')}
          </p>
          <Button className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold" onClick={() => setSubmitted(false)}>
            {t('common.close')}
          </Button>
        </div>
      </Modal>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('contact.title')}</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-slate-950 border border-slate-800 text-primary-400 rounded-xl">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{t('contact.email_title')}</h3>
                    <p className="text-slate-300">contact@francejustice.com</p>
                    <p className="text-slate-400 text-xs">support@francejustice.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-slate-950 border border-slate-800 text-indigo-400 rounded-xl">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{t('contact.phone_title')}</h3>
                    <p className="text-slate-300">+33607517416</p>
                    <p className="text-slate-400 text-xs">{t('contact.hours', 'ouvert tous les jours 24h/24')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-slate-950 border border-slate-800 text-emerald-400 rounded-xl">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{t('contact.address_title')}</h3>
                    <p className="text-slate-300 text-sm">1275 route de chateau neuf 26320 saint marcelle les valence</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">{t('contact.name')}</label>
                      <Input
                        name="name"
                        placeholder="Ahmed Alaoui"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">{t('contact.email')}</label>
                      <Input
                        type="email"
                        name="email"
                        placeholder="ahmed@exemple.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">{t('contact.subject')}</label>
                    <Input
                      name="subject"
                      placeholder={t('contact.subject_placeholder', 'Question sur le divorce, héritage...')}
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">{t('contact.message')}</label>
                    <textarea
                      name="message"
                      rows={5}
                      placeholder={t('contact.message_placeholder', 'Décrivez votre situation ici...')}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full flex rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-950/80 border-l-4 border-red-500 text-red-200 rounded-r-md text-sm font-medium">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white shadow-xl shadow-indigo-950/50"
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