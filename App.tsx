import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StoryDetail } from './components/StoryDetail';
import { SignalDetail } from './components/SignalDetail';
import { Integrations } from './components/Integrations';
import { WebSources } from './components/WebSources';
import { LoginPage } from './components/LoginPage';
import { Settings } from './components/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { generateMockSignals } from './services/mockData';
import { analyzeSignalsWithGemini, transformExternalDataToSignals, processWebSource } from './services/geminiService';
import { executeIntegration, formatStandardDateTime } from './services/integrationService';
import { RawSignal, Story, AnalysisStats, Sentiment, Urgency, Integration, ScheduleFrequency, SignalType, IntegrationLog, IntegrationMode, GlobalSettings, WebSource } from './types';
import { Trash2 } from 'lucide-react';

// Main Authenticated Application Logic
const AuthenticatedApp: React.FC = () => {
  const { user } = useAuth(); // Can use user info in UI if needed
  const [activeTab, setActiveTab] = useState('dashboard');
  const [signals, setSignals] = useState<RawSignal[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<RawSignal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [settings, setSettings] = useState<GlobalSettings>({
    productName: 'Stories',
    productDescription: 'An AI-powered product intelligence engine that transforms support tickets, reviews, and competitor signals into actionable stories for B2B SaaS product managers.'
  });

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'int-1',
      name: 'Competitor Feed',
      sourceType: 'External API',
      targetSignalType: SignalType.MARKET,
      mode: IntegrationMode.POLLING,
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET',
      schedule: ScheduleFrequency.HOURLY,
      status: 'Active',
      lastRun: 'September 27, 2026 10:00:00 AM',
      authType: 'None',
      paginationType: 'None',
      templateType: 'Custom',
      logs: []
    }
  ]);

  const [webSources, setWebSources] = useState<WebSource[]>([
    {
       id: 'web-1',
       name: 'TechCrunch SaaS News',
       url: 'https://techcrunch.com/category/startups/',
       targetSignalType: SignalType.MARKET,
       schedule: ScheduleFrequency.DAILY,
       scheduleTime: '08:00',
       status: 'Active',
       logs: []
    }
  ]);

  // Initial Data Load
  useEffect(() => {
    const mockData = generateMockSignals();
    setSignals(mockData);
    handleAnalysis(mockData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scheduler Loop
  useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        
        // --- Integrations Scheduler ---
        integrations.forEach(integration => {
            if (integration.status !== 'Active' || integration.mode === IntegrationMode.WEBHOOK) return;
            
            let shouldRun = false;
            if (integration.schedule !== ScheduleFrequency.HOURLY && integration.scheduleTime) {
                const [schedHour, schedMinute] = integration.scheduleTime.split(':').map(Number);
                if (now.getHours() === schedHour && now.getMinutes() === schedMinute) {
                    if (integration.schedule === ScheduleFrequency.DAILY) shouldRun = true;
                    if (integration.schedule === ScheduleFrequency.WEEKLY) {
                        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        if (days[now.getDay()] === integration.scheduleDayOfWeek) shouldRun = true;
                    }
                    if (integration.schedule === ScheduleFrequency.MONTHLY) {
                        if (now.getDate() === integration.scheduleDayOfMonth) shouldRun = true;
                    }
                }
            }
            if (integration.schedule === ScheduleFrequency.HOURLY && now.getMinutes() === 0) shouldRun = true;

            if (shouldRun) {
                const lastRunDateStr = integration.lastRun;
                const isRecent = lastRunDateStr && (new Date(lastRunDateStr).getTime() > now.getTime() - 60000);
                if (!isRecent) handleRunIntegration(integration.id);
            }
        });

        // --- Web Sources Scheduler ---
        webSources.forEach(source => {
            if (source.status !== 'Active') return;
            
            let shouldRun = false;
            if (source.schedule !== ScheduleFrequency.HOURLY && source.scheduleTime) {
                const [schedHour, schedMinute] = source.scheduleTime.split(':').map(Number);
                if (now.getHours() === schedHour && now.getMinutes() === schedMinute) {
                    if (source.schedule === ScheduleFrequency.DAILY) shouldRun = true;
                    if (source.schedule === ScheduleFrequency.WEEKLY) {
                        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        if (days[now.getDay()] === source.scheduleDayOfWeek) shouldRun = true;
                    }
                    if (source.schedule === ScheduleFrequency.MONTHLY) {
                        if (now.getDate() === source.scheduleDayOfMonth) shouldRun = true;
                    }
                }
            }
            if (source.schedule === ScheduleFrequency.HOURLY && now.getMinutes() === 0) shouldRun = true;

            if (shouldRun) {
                const lastRunDateStr = source.lastRun;
                const isRecent = lastRunDateStr && (new Date(lastRunDateStr).getTime() > now.getTime() - 60000);
                if (!isRecent) handleRunWebSource(source.id);
            }
        });

    }, 60000);
    return () => clearInterval(interval);
  }, [integrations, webSources]);

  const handleAnalysis = async (dataToAnalyze: RawSignal[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const generatedStories = await analyzeSignalsWithGemini(dataToAnalyze, settings);
      setStories(generatedStories);
    } catch (err) {
      console.error("Analysis Error", err);
      setError("Failed to generate stories. Check your API Key or connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    handleAnalysis(signals);
  };

  const handleRunIntegration = async (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;

    setIsLoading(true);
    setSuccessMsg(null);
    const startTime = formatStandardDateTime(new Date());

    let jsonData: any[] = [];
    let logStatus: 'Success' | 'Error' = 'Success';
    let logMessage = '';

    try {
        try {
            jsonData = await executeIntegration(integration);
            logMessage = `Fetched ${jsonData.length} items.`;
        } catch (fetchError: any) {
            console.warn("Fetch failed, using mock fallback.", fetchError);
            logMessage = `Fetch failed: ${fetchError.message}. Using mock data.`;
            
            if (integration.templateType === 'Freshdesk') {
               jsonData = [
                  { description_text: "We need dark mode in the mobile app", created_at: new Date().toISOString(), id: 991, requester: { name: "John Doe" } },
                  { description_text: "The export to PDF is broken on Safari", created_at: new Date().toISOString(), id: 992, requester: { name: "Jane Smith" } }
               ];
            } else {
               jsonData = [
                { title: "Competitor Y launched a new AI feature", body: "It seems faster than ours.", userId: 1 },
                { title: "Customer complained about billing", body: "The invoice was wrong.", userId: 2 }
               ];
            }
        }

        const newSignals = await transformExternalDataToSignals(integration.name, jsonData, settings, integration.targetSignalType);
        const updatedSignals = [...newSignals, ...signals];
        setSignals(updatedSignals);
        setSuccessMsg(`Successfully ingested ${newSignals.length} new signals from ${integration.name}`);
        await analyzeSignalsWithGemini(updatedSignals, settings).then(setStories);

    } catch (err: any) {
        console.error("Integration run failed", err);
        setError("Integration failed to run. See logs.");
        logStatus = 'Error';
        logMessage += ` Processing Failed: ${err.message}`;
    } finally {
        setIsLoading(false);
        const newLog: IntegrationLog = {
            id: crypto.randomUUID(),
            timestamp: startTime,
            status: logStatus,
            itemsCount: jsonData.length,
            message: logMessage,
            responseSnippet: JSON.stringify(jsonData).slice(0, 200)
        };
        setIntegrations(prev => prev.map(int => 
            int.id === id ? { 
                ...int, 
                lastRun: startTime, 
                status: logStatus === 'Success' ? 'Active' : 'Error',
                logs: [...(int.logs || []), newLog] 
            } : int
        ));
    }
  };

  const handleRunWebSource = async (id: string) => {
    const source = webSources.find(s => s.id === id);
    if (!source) return;

    setIsLoading(true);
    setSuccessMsg(null);
    const startTime = formatStandardDateTime(new Date());
    let logStatus: 'Success' | 'Error' = 'Success';
    let logMessage = '';
    let newSignals: RawSignal[] = [];

    try {
        newSignals = await processWebSource(source, settings);
        
        const updatedSignals = [...newSignals, ...signals];
        setSignals(updatedSignals);
        setSuccessMsg(`Web Source ${source.name} processed. Found ${newSignals.length} signals.`);
        logMessage = `Google Search found ${newSignals.length} relevant signals.`;
        
        await analyzeSignalsWithGemini(updatedSignals, settings).then(setStories);

    } catch (err: any) {
        console.error("Web Source run failed", err);
        setError("Web Source failed to run. See logs.");
        logStatus = 'Error';
        logMessage = `Error: ${err.message}`;
    } finally {
        setIsLoading(false);
        const newLog: IntegrationLog = {
            id: crypto.randomUUID(),
            timestamp: startTime,
            status: logStatus,
            itemsCount: newSignals.length,
            message: logMessage,
            responseSnippet: JSON.stringify(newSignals.slice(0, 2))
        };
        setWebSources(prev => prev.map(s => 
            s.id === id ? { 
                ...s, 
                lastRun: startTime, 
                status: logStatus === 'Success' ? 'Active' : 'Error',
                logs: [...(s.logs || []), newLog] 
            } : s
        ));
    }
  };

  // Helper for testing
  const handleTestWebSource = async (source: WebSource): Promise<RawSignal[]> => {
      return await processWebSource(source, settings);
  };

  const handleWebhookSimulation = async (id: string, payload: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;

    setIsLoading(true);
    setSuccessMsg(null);
    const startTime = formatStandardDateTime(new Date());

    let jsonData: any = {};
    let logStatus: 'Success' | 'Error' = 'Success';
    let logMessage = '';
    let parsedSignals: RawSignal[] = [];

    try {
        try {
            jsonData = JSON.parse(payload);
        } catch (e) {
            throw new Error("Invalid JSON payload");
        }

        parsedSignals = await transformExternalDataToSignals(integration.name, jsonData, settings, integration.targetSignalType);
        const updatedSignals = [...parsedSignals, ...signals];
        setSignals(updatedSignals);
        setSuccessMsg(`Webhook processed successfully. Added ${parsedSignals.length} signals.`);
        logMessage = `Webhook received. Parsed ${parsedSignals.length} items.`;
        await analyzeSignalsWithGemini(updatedSignals, settings).then(setStories);

    } catch (err: any) {
        console.error("Webhook processing failed", err);
        setError("Webhook simulation failed. Check payload.");
        logStatus = 'Error';
        logMessage = `Webhook Error: ${err.message}`;
    } finally {
        setIsLoading(false);
        const newLog: IntegrationLog = {
            id: crypto.randomUUID(),
            timestamp: startTime,
            status: logStatus,
            itemsCount: parsedSignals.length,
            message: logMessage,
            responseSnippet: payload.slice(0, 200)
        };
         setIntegrations(prev => prev.map(int => 
            int.id === id ? { 
                ...int, 
                lastRun: startTime, 
                logs: [...(int.logs || []), newLog] 
            } : int
        ));
    }
  };

  const handleUpdateIntegration = (updatedInt: Integration) => {
    setIntegrations(prev => prev.map(int => int.id === updatedInt.id ? updatedInt : int));
  };

  const stats: AnalysisStats = useMemo(() => {
    return {
      totalSignals: signals.length,
      totalStories: stories.length,
      sentimentBreakdown: {
        [Sentiment.PAIN_POINT]: stories.filter(s => s.sentiment === Sentiment.PAIN_POINT).length,
        [Sentiment.WIN]: stories.filter(s => s.sentiment === Sentiment.WIN).length,
        [Sentiment.THREAT]: stories.filter(s => s.sentiment === Sentiment.THREAT).length,
        [Sentiment.NEUTRAL]: stories.filter(s => s.sentiment === Sentiment.NEUTRAL).length,
      },
      urgencyBreakdown: {
        [Urgency.HIGH]: stories.filter(s => s.urgency === Urgency.HIGH).length,
        [Urgency.MEDIUM]: stories.filter(s => s.urgency === Urgency.MEDIUM).length,
        [Urgency.LOW]: stories.filter(s => s.urgency === Urgency.LOW).length,
      }
    };
  }, [signals, stories]);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-sm underline hover:text-red-800">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 border border-green-200 flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-sm underline hover:text-green-800">Dismiss</button>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <>
          <div className="mb-6 flex justify-end">
             <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-white border border-gray-300 text-slate-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isLoading ? 'Processing...' : 'Re-run Analysis'}
              </button>
          </div>
          
          <Dashboard 
            stories={stories} 
            isLoading={isLoading} 
            onStoryClick={setSelectedStory}
            stats={stats}
          />
        </>
      )}

      {activeTab === 'signals' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Raw Signal Data Lake</h1>
                <p className="text-slate-500 mt-1">Ingesting data from {signals.length} disparate sources.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {signals.map((signal) => (
                  <tr 
                    key={signal.id} 
                    className="hover:bg-indigo-50/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedSignal(signal)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {signal.source}
                        <div className="text-xs text-gray-400 font-normal">{signal.author}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            signal.type === 'Internal' ? 'bg-blue-100 text-blue-800' :
                            signal.type === 'External' ? 'bg-purple-100 text-purple-800' :
                            'bg-orange-100 text-orange-800'
                        }`}>
                            {signal.type}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate" title={signal.content}>
                      {signal.content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {signal.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-red-400 hover:text-red-600 p-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSignals(signals.filter(s => s.id !== signal.id));
                        }}
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
      )}

      {activeTab === 'integrations' && (
        <Integrations 
            integrations={integrations}
            onAddIntegration={(newInt) => setIntegrations([...integrations, newInt])}
            onUpdateIntegration={handleUpdateIntegration}
            onDeleteIntegration={(id) => setIntegrations(integrations.filter(i => i.id !== id))}
            onRunIntegration={handleRunIntegration}
            onSimulateWebhook={handleWebhookSimulation}
            isProcessing={isLoading}
        />
      )}

      {activeTab === 'web-sources' && (
         <WebSources 
            webSources={webSources}
            onAddSource={(s) => setWebSources([...webSources, s])}
            onUpdateSource={(s) => setWebSources(webSources.map(ws => ws.id === s.id ? s : ws))}
            onDeleteSource={(id) => setWebSources(webSources.filter(s => s.id !== id))}
            onRunSource={handleRunWebSource}
            onTestSource={handleTestWebSource}
            isProcessing={isLoading}
         />
      )}
      
      {activeTab === 'settings' && (
          <Settings 
            settings={settings}
            onSave={(newSettings) => setSettings(newSettings)}
          />
      )}

      {selectedStory && (
        <StoryDetail 
          story={selectedStory} 
          rawSignals={signals} 
          onClose={() => setSelectedStory(null)} 
        />
      )}

      {selectedSignal && (
        <SignalDetail
          signal={selectedSignal}
          onClose={() => setSelectedSignal(null)}
        />
      )}
    </Layout>
  );
};

// Wrapper that handles Authentication Check
const App: React.FC = () => {
    return (
        <AuthProvider>
            <AuthWrapper />
        </AuthProvider>
    );
};

const AuthWrapper: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading Stories...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    return <AuthenticatedApp />;
};

export default App;