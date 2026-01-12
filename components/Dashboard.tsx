import React from 'react';
import { Story, Sentiment, AnalysisStats, Urgency } from '../types';
import { StoryCard } from './StoryCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Activity, Zap, ThumbsDown } from 'lucide-react';

interface DashboardProps {
  stories: Story[];
  isLoading: boolean;
  onStoryClick: (story: Story) => void;
  stats: AnalysisStats;
}

const COLORS = {
  [Sentiment.PAIN_POINT]: '#ef4444', // Red
  [Sentiment.WIN]: '#22c55e',       // Green
  [Sentiment.THREAT]: '#f59e0b',    // Amber
  [Sentiment.NEUTRAL]: '#94a3b8',   // Slate
};

const PIE_DATA = (stats: AnalysisStats) => [
  { name: 'Pain Points', value: stats.sentimentBreakdown[Sentiment.PAIN_POINT] },
  { name: 'Wins', value: stats.sentimentBreakdown[Sentiment.WIN] },
  { name: 'Threats', value: stats.sentimentBreakdown[Sentiment.THREAT] },
];

export const Dashboard: React.FC<DashboardProps> = ({ stories, isLoading, onStoryClick, stats }) => {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="relative w-20 h-20">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Analyzing signals with Gemini...</p>
      </div>
    );
  }

  const urgentCount = stats.urgencyBreakdown[Urgency.HIGH];
  const painCount = stats.sentimentBreakdown[Sentiment.PAIN_POINT];
  const threatCount = stats.sentimentBreakdown[Sentiment.THREAT];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Product Pulse</h1>
          <p className="text-slate-500 mt-2">AI-driven insights from {stats.totalSignals} signals across market, internal, and external sources.</p>
        </div>
        <div className="flex gap-2">
            <span className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm shadow-indigo-200">
                Latest Analysis: Just now
            </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1 bg-red-500"></div>
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">High Urgency Stories</p>
                <p className="text-3xl font-bold text-slate-800">{urgentCount}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
                <Zap className="w-6 h-6 text-red-500" />
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1 bg-amber-500"></div>
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Market Threats</p>
                <p className="text-3xl font-bold text-slate-800">{threatCount}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
                <Activity className="w-6 h-6 text-amber-500" />
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between relative overflow-hidden">
             <div className="absolute right-0 top-0 h-full w-1 bg-slate-300"></div>
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Pain Points Identified</p>
                <p className="text-3xl font-bold text-slate-800">{painCount}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
                <ThumbsDown className="w-6 h-6 text-slate-500" />
            </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-80">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-slate-800 font-bold mb-6">Signal Volume by Story</h3>
            <ResponsiveContainer width="100%" height="80%">
                <BarChart data={stories.slice(0, 5).map(s => ({ name: s.narrative.substring(0, 15) + '...', strength: s.signalStrength }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="strength" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <h3 className="text-slate-800 font-bold mb-2">Sentiment Breakdown</h3>
             <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                    <Pie
                        data={PIE_DATA(stats)}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {PIE_DATA(stats).map((entry, index) => {
                            let color = COLORS[Sentiment.NEUTRAL];
                            if (entry.name === 'Pain Points') color = COLORS[Sentiment.PAIN_POINT];
                            if (entry.name === 'Wins') color = COLORS[Sentiment.WIN];
                            if (entry.name === 'Threats') color = COLORS[Sentiment.THREAT];
                            return <Cell key={`cell-${index}`} fill={color} stroke="none" />;
                        })}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
             </ResponsiveContainer>
        </div>
      </div>

      {/* Stories Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            Top Priority Stories
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{stories.length} identified</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map(story => (
                <StoryCard key={story.id} story={story} onClick={onStoryClick} />
            ))}
        </div>
      </div>
    </div>
  );
};