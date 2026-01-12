import React, { useState } from 'react';
import { GlobalSettings } from '../types';
import { Save, Check } from 'lucide-react';

interface SettingsProps {
  settings: GlobalSettings;
  onSave: (settings: GlobalSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
            <p className="text-slate-500 mt-1">Configure the context for your AI Agents.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-1">Product Context</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        This information is injected into every AI agent (Analyzer, Ingestor) as a system prompt. 
                        It helps the AI understand your specific domain, jargon, and business goals when processing raw signals.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Product Name</label>
                    <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="e.g. Stories"
                        value={localSettings.productName}
                        onChange={e => setLocalSettings({...localSettings, productName: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Product Description & Context</label>
                    <div className="relative">
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-40 resize-none text-sm leading-relaxed"
                            placeholder="Describe what your product does, who the users are, and what key metrics matter..."
                            value={localSettings.productDescription}
                            onChange={e => setLocalSettings({...localSettings, productDescription: e.target.value})}
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-white px-2 py-1 rounded-md border border-gray-100">
                            AI System Prompt
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all transform active:scale-95 ${
                        saved 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                    }`}
                >
                    {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Settings Saved' : 'Save Changes'}
                </button>
            </div>
        </div>
    </div>
  );
};