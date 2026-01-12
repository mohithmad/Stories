import React, { useState } from 'react';
import { Integration, ScheduleFrequency, SignalType, IntegrationLog, IntegrationMode } from '../types';
import { Plus, Trash2, Play, AlertCircle, CheckCircle, Save, X, Activity, RefreshCw, Edit2, Clock, Calendar, Radio, Zap, Copy, Terminal } from 'lucide-react';
import { testIntegrationConnection } from '../services/integrationService';

interface IntegrationsProps {
  integrations: Integration[];
  onAddIntegration: (integration: Integration) => void;
  onUpdateIntegration: (integration: Integration) => void;
  onDeleteIntegration: (id: string) => void;
  onRunIntegration: (id: string) => void;
  onSimulateWebhook: (id: string, payload: string) => void;
  isProcessing: boolean;
}

export const Integrations: React.FC<IntegrationsProps> = ({
  integrations,
  onAddIntegration,
  onUpdateIntegration,
  onDeleteIntegration,
  onRunIntegration,
  onSimulateWebhook,
  isProcessing
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState<string | null>(null); // Integration ID
  const [simulatePayload, setSimulatePayload] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [testStatus, setTestStatus] = useState<{success?: boolean; message?: string; data?: any} | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const initialIntState: Partial<Integration> = {
    name: '',
    sourceType: 'Custom API',
    targetSignalType: SignalType.INTERNAL,
    mode: IntegrationMode.POLLING,
    url: '',
    method: 'GET',
    headers: '',
    payload: '',
    schedule: ScheduleFrequency.DAILY,
    scheduleTime: '09:00',
    scheduleDayOfWeek: 'Monday',
    scheduleDayOfMonth: 1,
    authType: 'None',
    apiKey: '',
    templateType: 'Custom',
    paginationType: 'None',
    logs: [],
    webhookUrl: ''
  };

  const [currentInt, setCurrentInt] = useState<Partial<Integration>>(initialIntState);

  const handleEditClick = (integration: Integration) => {
    setCurrentInt({ ...integration });
    setIsEditing(true);
    setShowForm(true);
    setTestStatus(null);
  };

  const handleAddNewClick = () => {
    // Generate a random webhook URL for new integrations immediately
    const hookId = crypto.randomUUID().split('-')[0];
    setCurrentInt({
        ...initialIntState,
        webhookUrl: `https://api.stories.ai/v1/hooks/${hookId}`
    });
    setIsEditing(false);
    setShowForm(true);
    setTestStatus(null);
  };

  const handleTemplateChange = (template: string) => {
    if (template === 'Freshdesk') {
      setCurrentInt({
        ...currentInt,
        name: 'Freshdesk Feature Requests',
        sourceType: 'Freshdesk',
        targetSignalType: SignalType.INTERNAL,
        mode: IntegrationMode.POLLING,
        templateType: 'Freshdesk',
        url: `https://[domain].freshdesk.com/api/v2/search/tickets?query="created_at:>'{{yesterday}}' AND type:'L6 - Feature Request' AND (bu:'Freshservice' OR bu:'Freshservice for MSPs' OR bu:'Freshservice for Business Teams')"`,
        method: 'GET',
        headers: '',
        authType: 'Basic',
        paginationType: 'Freshdesk_Page_Param',
        schedule: ScheduleFrequency.DAILY,
        scheduleTime: '09:00'
      });
    } else {
      setCurrentInt({
        ...currentInt,
        name: '',
        templateType: 'Custom'
      });
    }
  };

  const handleTestConnection = async () => {
    if (!currentInt.url) return;
    setIsTesting(true);
    setTestStatus(null);
    
    // Construct a temporary integration object for testing
    const tempIntegration = {
        ...currentInt,
        id: 'test',
        status: 'Active'
    } as Integration;

    const result = await testIntegrationConnection(tempIntegration);
    setTestStatus(result);
    setIsTesting(false);
  };

  const handleSave = () => {
    if (!currentInt.name) return;
    if (currentInt.mode === IntegrationMode.POLLING && !currentInt.url) return;
    
    const finalInt: Integration = {
      ...currentInt as Integration,
      id: isEditing ? currentInt.id! : crypto.randomUUID(),
      status: isEditing ? currentInt.status! : 'Active',
      lastRun: isEditing ? currentInt.lastRun : 'Never',
      logs: isEditing ? currentInt.logs! : []
    };
    
    if (isEditing) {
        onUpdateIntegration(finalInt);
    } else {
        onAddIntegration(finalInt);
    }
    
    setShowForm(false);
    setIsEditing(false);
  };

  const handleSimulationSubmit = () => {
    if (showSimulateModal && simulatePayload) {
        onSimulateWebhook(showSimulateModal, simulatePayload);
        setShowSimulateModal(null);
        setSimulatePayload('');
    }
  };

  const renderScheduleInputs = () => {
    if (currentInt.schedule === ScheduleFrequency.HOURLY) return null;

    return (
      <div className="grid grid-cols-2 gap-4 mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
        {(currentInt.schedule === ScheduleFrequency.DAILY || 
          currentInt.schedule === ScheduleFrequency.WEEKLY || 
          currentInt.schedule === ScheduleFrequency.MONTHLY) && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Time (24h)</label>
              <input 
                type="time"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={currentInt.scheduleTime}
                onChange={e => setCurrentInt({...currentInt, scheduleTime: e.target.value})}
              />
            </div>
        )}

        {currentInt.schedule === ScheduleFrequency.WEEKLY && (
           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Day of Week</label>
              <select
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={currentInt.scheduleDayOfWeek}
                onChange={e => setCurrentInt({...currentInt, scheduleDayOfWeek: e.target.value})}
              >
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                    <option key={d} value={d}>{d}</option>
                ))}
              </select>
           </div>
        )}

        {currentInt.schedule === ScheduleFrequency.MONTHLY && (
           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Day of Month</label>
              <input
                type="number"
                min={1}
                max={31}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={currentInt.scheduleDayOfMonth}
                onChange={e => setCurrentInt({...currentInt, scheduleDayOfMonth: parseInt(e.target.value)})}
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
          <h1 className="text-2xl font-bold text-slate-900">Data Integrations</h1>
          <p className="text-slate-500 mt-1">Schedule API ingestion or configure webhooks to populate your data lake.</p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Integration
        </button>
      </div>

      {showSimulateModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Simulate Webhook Event
                    </h3>
                    <button onClick={() => setShowSimulateModal(null)}><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                    Paste a sample JSON payload below to simulate an incoming event from this source.
                </p>
                <textarea 
                    className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                    placeholder='{"event_type": "ticket_created", "ticket": {"subject": "Help!"}}'
                    value={simulatePayload}
                    onChange={(e) => setSimulatePayload(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setShowSimulateModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                    <button 
                        onClick={handleSimulationSubmit}
                        disabled={!simulatePayload}
                        className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        <Play className="w-4 h-4" /> Send Event
                    </button>
                </div>
            </div>
         </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             
             {/* Modal Header */}
             <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Integration' : 'Configure Integration'}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
             </div>

             {/* Modal Body */}
             <div className="p-6 overflow-y-auto flex-1">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Col: Basic Info */}
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                             <label className="block text-sm font-bold text-slate-700 mb-2">Integration Mode</label>
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentInt({...currentInt, mode: IntegrationMode.POLLING})}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md border flex items-center justify-center gap-2 ${currentInt.mode === IntegrationMode.POLLING ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Clock className="w-4 h-4" /> Scheduled API
                                </button>
                                <button 
                                    onClick={() => setCurrentInt({...currentInt, mode: IntegrationMode.WEBHOOK})}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md border flex items-center justify-center gap-2 ${currentInt.mode === IntegrationMode.WEBHOOK ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Zap className="w-4 h-4" /> Webhook Listener
                                </button>
                             </div>
                        </div>
                        
                        {currentInt.mode === IntegrationMode.POLLING && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Template</label>
                                <select 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                                    value={currentInt.templateType}
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                >
                                    <option value="Custom">Custom REST API</option>
                                    <option value="Freshdesk">Freshdesk Tickets</option>
                                </select>
                            </div>
                        )}

                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                           <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                value={currentInt.name}
                                onChange={e => setCurrentInt({...currentInt, name: e.target.value})}
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Source Type</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                    placeholder="e.g. Zendesk"
                                    value={currentInt.sourceType}
                                    onChange={e => setCurrentInt({...currentInt, sourceType: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Signal Type</label>
                                <select 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                    value={currentInt.targetSignalType}
                                    onChange={e => setCurrentInt({...currentInt, targetSignalType: e.target.value as SignalType})}
                                >
                                    <option value={SignalType.INTERNAL}>Internal</option>
                                    <option value={SignalType.EXTERNAL}>External</option>
                                    <option value={SignalType.MARKET}>Market</option>
                                </select>
                            </div>
                        </div>

                         {/* Schedule Section - Only for Polling */}
                         {currentInt.mode === IntegrationMode.POLLING && (
                            <div className="border-t border-gray-100 pt-4 mt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    <span className="font-bold text-slate-700">Schedule</span>
                                </div>
                                <select 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none mb-2"
                                    value={currentInt.schedule}
                                    onChange={e => setCurrentInt({...currentInt, schedule: e.target.value as ScheduleFrequency})}
                                >
                                    {Object.values(ScheduleFrequency).map(freq => (
                                        <option key={freq} value={freq}>{freq}</option>
                                    ))}
                                </select>
                                {renderScheduleInputs()}
                            </div>
                         )}
                    </div>

                    {/* Right Col: API Config or Webhook Info */}
                    <div className="space-y-4">
                        {currentInt.mode === IntegrationMode.POLLING ? (
                            <>
                                <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Endpoint URL</label>
                                <input 
                                        type="text" 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-mono text-xs"
                                        value={currentInt.url}
                                        onChange={e => setCurrentInt({...currentInt, url: e.target.value})}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Vars: <code>{`{{today}}`}</code>, <code>{`{{yesterday}}`}</code></p>
                                </div>

                                <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Auth Type</label>
                                <select 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                                        value={currentInt.authType}
                                        onChange={e => setCurrentInt({...currentInt, authType: e.target.value as any})}
                                >
                                        <option value="None">None</option>
                                        <option value="Basic">Basic Auth</option>
                                        <option value="Bearer">Bearer Token</option>
                                </select>
                                </div>

                                {currentInt.authType !== 'None' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Key / Token</label>
                                        <input 
                                            type="password" 
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-mono text-xs"
                                            value={currentInt.apiKey}
                                            onChange={e => setCurrentInt({...currentInt, apiKey: e.target.value})}
                                        />
                                    </div>
                                )}

                                {currentInt.templateType !== 'Freshdesk' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Headers (JSON)</label>
                                            <textarea 
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-mono text-xs h-16"
                                                value={currentInt.headers}
                                                onChange={e => setCurrentInt({...currentInt, headers: e.target.value})}
                                            />
                                        </div>
                                    </>
                                )}
                                
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-bold text-slate-700">Test Connection</label>
                                        <button 
                                            onClick={handleTestConnection}
                                            disabled={isTesting || !currentInt.url}
                                            className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 flex items-center gap-1"
                                        >
                                            {isTesting ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Activity className="w-3 h-3" />}
                                            Run Test
                                        </button>
                                    </div>
                                    
                                    <div className="bg-slate-900 rounded-lg p-3 overflow-auto max-h-40 min-h-[100px] border border-slate-700">
                                        {testStatus ? (
                                            <>
                                                <div className={`text-xs mb-2 font-mono ${testStatus.success ? 'text-green-400' : 'text-red-400'}`}>
                                                    {testStatus.message}
                                                </div>
                                                {testStatus.data && (
                                                    <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap break-all">
                                                        {JSON.stringify(testStatus.data, null, 2).slice(0, 1000)}
                                                        {JSON.stringify(testStatus.data).length > 1000 && '... (truncated)'}
                                                    </pre>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-slate-500 text-xs italic text-center mt-8">Run a test to see response payload here</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Webhook UI
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                                <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-indigo-600" /> Webhook Listener Configured
                                </h4>
                                <p className="text-sm text-indigo-800 mb-4 leading-relaxed">
                                    Use the URL below to configure webhooks in your external application (e.g., Zendesk, Hubspot). 
                                    Any JSON payload sent to this URL will be automatically parsed by the AI engine.
                                </p>
                                
                                <label className="block text-xs font-bold text-indigo-900 mb-1 uppercase tracking-wide">Webhook Endpoint</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        readOnly
                                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-mono text-slate-600"
                                        value={currentInt.webhookUrl}
                                    />
                                    <button 
                                        className="p-2 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-100 text-indigo-600"
                                        title="Copy URL"
                                        onClick={() => navigator.clipboard.writeText(currentInt.webhookUrl || '')}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mt-6 pt-4 border-t border-indigo-200">
                                    <p className="text-xs text-indigo-700 flex gap-2">
                                        <Activity className="w-4 h-4" />
                                        Listening for incoming events...
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Logs Section (Only if Editing) */}
                {isEditing && currentInt.logs && currentInt.logs.length > 0 && (
                    <div className="mt-8">
                        <h4 className="text-sm font-bold text-slate-800 mb-3">
                            {currentInt.mode === IntegrationMode.WEBHOOK ? 'Event Log' : 'Execution History'}
                        </h4>
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
                                    {currentInt.logs.slice().reverse().map(log => (
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
                    <Save className="w-4 h-4" /> Save Configuration
                </button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode & Endpoint</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {integrations.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                        No integrations configured. Add one to start ingesting data.
                    </td>
                </tr>
            )}
            {integrations.map((integration) => (
              <tr key={integration.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{integration.name}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="text-xs text-gray-500">{integration.sourceType}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        integration.targetSignalType === SignalType.INTERNAL ? 'bg-blue-50 border-blue-100 text-blue-600' :
                        integration.targetSignalType === SignalType.EXTERNAL ? 'bg-purple-50 border-purple-100 text-purple-600' :
                        'bg-orange-50 border-orange-100 text-orange-600'
                    }`}>
                        {integration.targetSignalType}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                         {integration.mode === IntegrationMode.POLLING ? (
                            <>
                                <span className={`self-start text-[10px] font-bold px-1.5 py-0.5 rounded ${integration.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                    {integration.method}
                                </span>
                                <span className="text-xs text-gray-500 truncate max-w-[180px]" title={integration.url}>
                                    {integration.url}
                                </span>
                            </>
                         ) : (
                            <>
                                <span className="self-start text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Webhook
                                </span>
                                <span className="text-xs text-gray-400 truncate max-w-[180px] font-mono">
                                    ...{integration.webhookUrl?.slice(-15)}
                                </span>
                            </>
                         )}
                        
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {integration.mode === IntegrationMode.POLLING ? (
                        <>
                            <div className="font-medium">{integration.schedule}</div>
                            {integration.schedule !== ScheduleFrequency.HOURLY && (
                                <div className="text-xs text-gray-400">
                                    {integration.schedule === ScheduleFrequency.WEEKLY && `${integration.scheduleDayOfWeek} `}
                                    {integration.schedule === ScheduleFrequency.MONTHLY && `Day ${integration.scheduleDayOfMonth} `}
                                    @ {integration.scheduleTime}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-xs text-gray-400 italic">Event Driven</div>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {integration.lastRun || 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    integration.status === 'Active' ? 'bg-green-100 text-green-800' : 
                    integration.status === 'Error' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {integration.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                  {integration.mode === IntegrationMode.POLLING ? (
                      <button 
                        onClick={() => onRunIntegration(integration.id)}
                        disabled={isProcessing}
                        className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                        title="Run Now"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                        onClick={() => setShowSimulateModal(integration.id)}
                        disabled={isProcessing}
                        className="text-amber-600 hover:text-amber-900 p-1.5 hover:bg-amber-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                        title="Simulate Event"
                    >
                        <Terminal className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleEditClick(integration)}
                    className="text-slate-600 hover:text-indigo-600 p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDeleteIntegration(integration.id)}
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