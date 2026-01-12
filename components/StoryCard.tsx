import React from 'react';
import { Story, Sentiment, Urgency } from '../types';
import { AlertTriangle, TrendingUp, ShieldAlert, CheckCircle, Users, Box } from 'lucide-react';

interface StoryCardProps {
  story: Story;
  onClick: (story: Story) => void;
}

const getSentimentColor = (sentiment: Sentiment) => {
  switch (sentiment) {
    case Sentiment.PAIN_POINT: return 'bg-red-50 text-red-700 border-red-200';
    case Sentiment.THREAT: return 'bg-amber-50 text-amber-700 border-amber-200';
    case Sentiment.WIN: return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getSentimentIcon = (sentiment: Sentiment) => {
  switch (sentiment) {
    case Sentiment.PAIN_POINT: return <AlertTriangle className="w-4 h-4" />;
    case Sentiment.THREAT: return <ShieldAlert className="w-4 h-4" />;
    case Sentiment.WIN: return <TrendingUp className="w-4 h-4" />;
    default: return <CheckCircle className="w-4 h-4" />;
  }
};

export const StoryCard: React.FC<StoryCardProps> = ({ story, onClick }) => {
  return (
    <div 
      onClick={() => onClick(story)}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5 flex flex-col gap-3 group"
    >
      <div className="flex justify-between items-start">
        <div className={`px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border flex items-center gap-1.5 ${getSentimentColor(story.sentiment)}`}>
          {getSentimentIcon(story.sentiment)}
          {story.sentiment}
        </div>
        {story.urgency === Urgency.HIGH && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors mb-1 line-clamp-2">
          {story.narrative}
        </h3>
        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
          {story.summary}
        </p>
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{story.signalStrength} Sources</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-slate-400" />
            <span>{story.productArea}</span>
          </div>
        </div>
        <div className="text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          View Details &rarr;
        </div>
      </div>
    </div>
  );
};