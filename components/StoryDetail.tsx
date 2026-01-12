import React from 'react';
import { Story, RawSignal, Sentiment } from '../types';
import { X, MessageSquare, ExternalLink, Calendar, User } from 'lucide-react';

interface StoryDetailProps {
  story: Story | null;
  rawSignals: RawSignal[];
  onClose: () => void;
}

export const StoryDetail: React.FC<StoryDetailProps> = ({ story, rawSignals, onClose }) => {
  if (!story) return null;

  // Filter raw signals that belong to this story
  const relatedSignals = rawSignals.filter(s => story.sourceIds.includes(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                story.sentiment === Sentiment.PAIN_POINT ? 'bg-red-100 text-red-700 border-red-200' :
                story.sentiment === Sentiment.WIN ? 'bg-green-100 text-green-700 border-green-200' :
                story.sentiment === Sentiment.THREAT ? 'bg-amber-100 text-amber-700 border-amber-200' :
                'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {story.sentiment}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-500 text-xs font-medium">{story.productArea}</span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-500 text-xs font-medium">{story.userPersona}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{story.narrative}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Analysis Summary</h3>
            <p className="text-slate-600 leading-relaxed bg-indigo-50/50 p-4 rounded-lg border border-indigo-50">
              {story.summary}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Evidence ({relatedSignals.length} Signals)
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {relatedSignals.map(signal => (
                <div key={signal.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 hover:shadow-sm transition-all bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        signal.type === 'Internal' ? 'bg-blue-50 text-blue-600' :
                        signal.type === 'External' ? 'bg-purple-50 text-purple-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {signal.type}
                      </span>
                      
                      {signal.url ? (
                        <a 
                          href={signal.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {signal.source}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {signal.source}
                        </span>
                      )}
                      
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {signal.author && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {signal.author}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {signal.date}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    "{signal.content}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};