import React, { useState } from 'react';
import { WebSource, ScheduleFrequency, SignalType, IntegrationLog, RawSignal } from '../types';
import { Plus, Trash2, Play, Globe, Save, X, Edit2, Clock, ExternalLink, RefreshCw, MessageSquare } from 'lucide-react';

interface WebSourcesProps {
  webSources: WebSource[];
  onAddSource: (source: WebSource) => void;
  onUpdateSource: (source: WebSource) => void;
  onDeleteSource: (id: string) => void;
  onRunSource: (id: string) => void;
  onTestSource: (source: WebSource) => Promise<RawSignal[]>;
  isProcessing: boolean;
}

export const WebSources: React.FC<WebSourcesProps> = ({
  webSources,
  onAddSource,
  onUpdateSource,
  onDeleteSource,
  onRunSource,
  onTestSource,
  isProcessing
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<RawSignal[] | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  
  const initialSourceState: Partial<WebSource> = {
    name: '',
    url: '',
    targetSignalType: SignalType.MARKET,
    schedule: ScheduleFrequency.DAILY,
    scheduleTime: '09:00',
    scheduleDayOfWeek: 'Monday',
    scheduleDayOfMonth: 1,
    logs: []
  };

  const [currentSource, setCurrentSource] = useState<Partial<WebSource>>(initialSourceState);

  const handleEditClick = (source: WebSource) => {
    setCurrentSource({ ...source });
    setIsEditing(true);
    setShowForm(true);
    setTestResults(null);
    setTestError(null);
  };

  const handleAddNewClick = () => {
    setCurrentSource({ ...initialSourceState });
    setIsEditing(false);
    setShowForm(true);
    setTestResults(null);
    setTestError(null);
  };

  const handleTestClick = async () => {
    if (!currentSource.name) return;
    
    setIsTesting(true);
    setTestResults(null);
    setTestError(null);

    try {
        const tempSource = { 
            ...currentSource, 
            id: 'test-source' 
        } as WebSource;
        
        const results = await onTestSource(tempSource);
        setTestResults(results);
    } catch (err: any) {
        setTestError(err.message || 'Test failed');
    } finally {
        setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!currentSource.name) return;
    
    const finalSource: WebSource = {
      ...currentSource as WebSource,
      id: isEditing ? currentSource.id! : crypto.randomUUID(),
      status: isEditing ? currentSource.status! : 'Active',
      lastRun: isEditing ? currentSource.lastRun : 'Never',
      logs: isEditing ? currentSource.logs! : []
    };
    
    if (isEditing) {
        onUpdateSource(finalSource);
    } else {
        onAddSource(finalSource);
    }
    
    setShowForm(false);
    setIsEditing(false);
  };

  const renderScheduleInputs = () => {
    if (currentSource.schedule === ScheduleFrequency.HOURLY) return null;

    return (
      <div className="grid grid-cols-2 gap-4 mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
        {(currentSource.schedule === ScheduleFrequency.DAILY || 
          currentSource.schedule === ScheduleFrequency.WEEKLY || 
          currentSource.schedule === ScheduleFrequency.MONTHLY) && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Time (24h)</label>
              <input 
                type="time"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={currentSource.scheduleTime}
                onChange={e => setCurrentSource({...currentSource, scheduleTime: e.target.value})}
              />
            </div>
        )}

        {currentSource.schedule === ScheduleFrequency.WEEKLY && (
           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Day of Week</label>
              <select
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={currentSource.scheduleDayOfWeek}
                onChange={e => setCurrentSource({...currentSource, scheduleDayOfWeek: e.target.value})}
              >
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                    <option key={d} value={d}>{d}</option>
                ))}
              </select>
           </div>
        )}

        {currentSource.schedule === ScheduleFrequency.MONTHLY && (
           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Day of Month</label>
              <input
                type="number"
                min={1}
                max={31}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={currentSource.scheduleDayOfMonth}
                onChange={e => setCurrentSource({...currentSource, scheduleDayOfMonth: parseInt(e.target.value)})}
              />
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Web Sources (Search Grounding)</h1>
          <p className="text-slate-500 mt-1">Monitor URLs and topics for relevant product signals using Google Search.</p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Web Source
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             
             {/* Modal Header */}
             <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Web Source' : 'Add Web Source'}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
             </div>

             {/* Modal Body */}
             <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Configuration */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Topic / Keyword</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-medium"
                                placeholder="e.g. Competitor Pricing, User Complaints"
                                value={currentSource.name}
                                onChange={e => setCurrentSource({...currentSource, name: e.target.value})}
                            />
                            <p className="text-xs text-slate-400 mt-1">The main topic the AI will search for.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Site URL (Optional)</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-mono text-sm"
                                placeholder="https://competitor.com"
                                value={currentSource.url}
                                onChange={e => setCurrentSource({...currentSource, url: e.target.value})}
                            />
                            <p className="text-xs text-slate-400 mt-1">Leave empty to search the entire web. Provide a URL to restrict search.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Signal Type</label>
                                <select 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                    value={currentSource.targetSignalType}
                                    onChange={e => setCurrentSource({...currentSource, targetSignalType: e.target.value as SignalType})}
                                >
                                    <option value={SignalType.INTERNAL}>Internal</option>
                                    <option value={SignalType.EXTERNAL}>External</option>
                                    <option value={SignalType.MARKET}>Market</option>
                                </select>
                            </div>
                        </div>

                        {/* Schedule Section */}
                        <div className="border-t border-gray-100 pt-4 mt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-indigo-500" />
                                <span className="font-bold text-slate-700">Schedule</span>
                            </div>
                            <select 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none mb-2"
                                value={currentSource.schedule}
                                onChange={e => setCurrentSource({...currentSource, schedule: e.target.value as ScheduleFrequency})}
                            >
                                {Object.values(ScheduleFrequency).map(freq => (
                                    <option key={freq} value={freq}>{freq}</option>
                                ))}
                            </select>
                            {renderScheduleInputs()}
                        </div>
                    </div>

                    {/* Right Column: Testing */}
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-slate-500" /> Test Configuration
                            </h4>
                            <button
                                onClick={handleTestClick}
                                disabled={isTesting || !currentSource.name}
                                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isTesting ? 'Running...' : 'Run Test Search'}
                            </button>
                        </div>

                        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-y-auto p-4 min-h-[200px] max-h-[400px]">
                            {isTesting && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                    <span className="text-xs">Searching Google & Analyzing...</span>
                                </div>
                            )}

                            {!isTesting && testError && (
                                <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100">
                                    Error: {testError}
                                </div>
                            )}

                            {!isTesting && !testResults && !testError && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                    <Globe className="w-8 h-8 opacity-20" />
                                    <span className="text-xs text-center px-4">Enter a topic and click "Run Test Search" to preview the signals AI will extract.</span>
                                </div>
                            )}

                            {!isTesting && testResults && (
                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                        Found {testResults.length} Signals
                                    </div>
                                    {testResults.length === 0 && (
                                        <div className="text-sm text-slate-500 italic">No relevant signals found. Try broadening your topic.</div>
                                    )}
                                    {testResults.map((signal, idx) => (
                                        <div key={idx} className="border border-gray-100 rounded-lg p-3 hover:border-indigo-100 bg-gray-50/50">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-slate-800 text-xs">{signal.source}</span>
                                                <span className="text-[10px] text-slate-400">{signal.date}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-3 mb-2">{signal.content}</p>
                                            {signal.url && (
                                                <a href={signal.url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1">
                                                    <ExternalLink className="w-3 h-3" /> Source Link
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Logs Section (Only if Editing) */}
                {isEditing && currentSource.logs && currentSource.logs.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Execution History</h4>
                        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
                            <table className="min-w-full text-xs text-left">
                                <thead className="bg-slate-100 text-slate-500 font-medium">
                                    <tr>
                                        <th className="p-2">Time</th>
                                        <th className="p-2">Status</th>
                                        <th className="p-2">Message</th>
                                        <th className="p-2">Items</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {currentSource.logs.slice().reverse().map(log => (
                                        <tr key={log.id}>
                                            <td className="p-2 text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                                            <td className="p-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="p-2 text-slate-600 truncate max-w-xs" title={log.message}>{log.message}</td>
                                            <td className="p-2 text-slate-600">{log.itemsCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
             </div>

             {/* Modal Footer */}
             <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Source
                </button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic & Site</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Run</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {webSources.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                        No web sources configured. Add a URL to start monitoring.
                    </td>
                </tr>
            )}
            {webSources.map((source) => (
              <tr key={source.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{source.name}</div>
                  {source.url ? (
                     <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1">
                        <ExternalLink className="w-3 h-3" />
                        {source.url}
                     </a>
                  ) : (
                     <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Whole Web Search
                     </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`px-2 py-1 rounded text-[10px] border ${
                        source.targetSignalType === SignalType.INTERNAL ? 'bg-blue-50 border-blue-100 text-blue-600' :
                        source.targetSignalType === SignalType.EXTERNAL ? 'bg-purple-50 border-purple-100 text-purple-600' :
                        'bg-orange-50 border-orange-100 text-orange-600'
                    }`}>
                        {source.targetSignalType}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="font-medium">{source.schedule}</div>
                    {source.schedule !== ScheduleFrequency.HOURLY && (
                        <div className="text-xs text-gray-400">
                            {source.schedule === ScheduleFrequency.WEEKLY && `${source.scheduleDayOfWeek} `}
                            {source.schedule === ScheduleFrequency.MONTHLY && `Day ${source.scheduleDayOfMonth} `}
                            @ {source.scheduleTime}
                        </div>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {source.lastRun || 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    source.status === 'Active' ? 'bg-green-100 text-green-800' : 
                    source.status === 'Error' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {source.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                  <button 
                        onClick={() => onRunSource(source.id)}
                        disabled={isProcessing}
                        className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                        title="Run Now"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                  <button 
                    onClick={() => handleEditClick(source)}
                    className="text-slate-600 hover:text-indigo-600 p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDeleteSource(source.id)}
                    className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};