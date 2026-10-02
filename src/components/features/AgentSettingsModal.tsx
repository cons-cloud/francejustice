import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Cpu, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Layers, 
  Wrench, 
  PlayCircle, 
  Info 
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { UserApiKeys } from '../../lib/agent/types';
import { AVAILABLE_MODELS } from '../../lib/agent/config';
import { AGENT_TOOL_DEFINITIONS } from '../../lib/agent/tools';
import { useToast } from '../../hooks/useToast';

interface AgentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: UserApiKeys;
  onSaveApiKeys: (keys: UserApiKeys) => void;
}

export const AgentSettingsModal: React.FC<AgentSettingsModalProps> = ({
  isOpen,
  onClose,
  apiKeys,
  onSaveApiKeys
}) => {
  const { success } = useToast();
  const [keys, setKeys] = useState<UserApiKeys>(apiKeys);
  const [activeTab, setActiveTab] = useState<'architecture' | 'keys' | 'tools'>('architecture');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKeys(keys);
    success("Paramètres et clés API enregistrés avec succès.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Architecture de l'Agent IA France Justice</h3>
              <p className="text-xs text-slate-500 font-medium">Modèle LLM, Threads, Instructions, Outils &amp; Exécution</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'architecture'
                ? 'border-cyan-600 text-cyan-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Les 5 Piliers de l'Agent</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'keys'
                ? 'border-cyan-600 text-cyan-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Clés API LLM (Optionnelles)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tools'
                ? 'border-cyan-600 text-cyan-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Catalogue d'Outils ({AGENT_TOOL_DEFINITIONS.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
                <p className="text-xs text-cyan-950 leading-relaxed font-medium">
                  Votre onglet <strong>Analyse IA</strong> fonctionne désormais comme un véritable Agent IA autonome de frontière (type ChatGPT, DeepSeek, Claude, Gemini) articulé autour de ses 5 composantes fondamentales.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-700 font-extrabold text-xs">
                    <Cpu className="w-4 h-4" />
                    <span>1. Le Modèle (LLM)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Le cerveau de l'agent. Compatible nativement avec France Justice Souverain, Google Gemini 1.5, Claude 3.5 Sonnet, GPT-4o et DeepSeek.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-teal-700 font-extrabold text-xs">
                    <Layers className="w-4 h-4" />
                    <span>2. Le Thread (Mémoire)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Session multi-tours persistante. Mémorise l'historique complet, les parties en cause, les dates clés et les pièces jointes importées.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-700 font-extrabold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>3. Les Instructions (Prompt)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Rôles juridiques spécialisés : Avocat Conseil, Droit du travail &amp; Prud'hommes, Baux &amp; Immobilier, Audit de contrats, Plume juridique.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs">
                    <Wrench className="w-4 h-4" />
                    <span>4. Les Outils (Tools)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Fonctions que l'agent appelle pour agir : calcul de barèmes (Macron, 10% caution), recherche d'articles de codes, vérification de prescription.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                  <PlayCircle className="w-4 h-4" />
                  <span>5. L'Exécution (Le Run de l'Agent)</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  L'agent analyse votre demande, planifie son raisonnement, décide d'appeler les outils adéquats avec les bons arguments, puis génère une analyse contradictoire complète et irréprochable.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Information :</strong> Le modèle <em>France Justice Souverain (Auto)</em> fonctionne immédiatement sans aucune clé requise. Si vous préférez utiliser vos propres quotas OpenAI, Anthropic ou DeepSeek, saisissez vos clés privées ci-dessous (stockées localement dans votre navigateur).
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={keys.gemini || ''}
                    onChange={e => setKeys(prev => ({ ...prev, gemini: e.target.value }))}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400">Pour forcer l'usage de Gemini 1.5 Pro ou Flash.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    OpenAI API Key (GPT-4o)
                  </label>
                  <input
                    type="password"
                    value={keys.openai || ''}
                    onChange={e => setKeys(prev => ({ ...prev, openai: e.target.value }))}
                    placeholder="sk-proj-..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400">Nécessaire si vous sélectionnez GPT-4o dans le sélecteur.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Anthropic API Key (Claude 3.5 Sonnet)
                  </label>
                  <input
                    type="password"
                    value={keys.anthropic || ''}
                    onChange={e => setKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                    placeholder="sk-ant-..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400">Pour le style et la rigueur d'Anthropic Claude.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    DeepSeek API Key (DeepSeek-V3 / R1)
                  </label>
                  <input
                    type="password"
                    value={keys.deepseek || ''}
                    onChange={e => setKeys(prev => ({ ...prev, deepseek: e.target.value }))}
                    placeholder="sk-..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400">Pour le raisonnement logique poussé de DeepSeek.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                L'Agent IA décide d'exécuter ces fonctions de façon autonome pendant le <em>Run</em> pour étayer son analyse contradictoire :
              </p>

              <div className="space-y-2">
                {AGENT_TOOL_DEFINITIONS.map((tool) => (
                  <div key={tool.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-600" />
                        <span>{tool.name}</span>
                        <code className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {tool.id}
                        </code>
                      </div>
                      <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{tool.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Chiffrement AES &amp; Souveraineté Juridique</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs font-bold"
            >
              Fermer
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              <span>Enregistrer</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
