import React from 'react';
import { RawSignal } from '../types';
import { X, ExternalLink, Calendar, User, MessageSquare } from 'lucide-react';

interface SignalDetailProps {
  signal: RawSignal | null;
  onClose: () => void;
}

export const SignalDetail: React.FC<SignalDetailProps> = ({ signal, onClose }) => {
  if (!signal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                signal.type === 'Internal' ? 'bg-blue-100 text-blue-800' :
                signal.type === 'External' ? 'bg-purple-100 text-purple-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {signal.type}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-500 text-xs font-medium">{signal.source}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Signal Details</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex items-center gap-6 mb-6 text-sm text-slate-500 border-b border-gray-100 pb-6">
             <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>{signal.author || 'Unknown Author'}</span>
             </div>
             <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{signal.date}</span>
             </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Content
            </h3>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-800 text-lg leading-relaxed">
                "{signal.content}"
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
                Close
            </button>
            {signal.url && (
                <a 
                    href={signal.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <ExternalLink className="w-4 h-4" />
                    Open Source
                </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};