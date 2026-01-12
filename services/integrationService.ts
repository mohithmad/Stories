import { Integration } from '../types';

// Standard Date: 'September 24, 2026'
export const formatStandardDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

// Standard DateTime: 'September 24, 2026 10:00:14 AM'
export const formatStandardDateTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

// Helper to format dates YYYY-MM-DD for API variables
const formatIsoDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Replace variables like {{yesterday}} in URL and Payload
const processVariables = (text: string): string => {
  if (!text) return text;
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let processed = text;
  processed = processed.replace(/{{today}}/g, formatIsoDate(today));
  processed = processed.replace(/{{yesterday}}/g, formatIsoDate(yesterday));
  
  return processed;
};

// Helper to construct headers
const getHeaders = (integration: Integration): HeadersInit => {
  const headers: HeadersInit = integration.headers ? JSON.parse(integration.headers) : {};
  
  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (integration.authType === 'Basic' && integration.apiKey) {
    const token = btoa(`${integration.apiKey}:X`);
    headers['Authorization'] = `Basic ${token}`;
  } else if (integration.authType === 'Bearer' && integration.apiKey) {
    headers['Authorization'] = `Bearer ${integration.apiKey}`;
  }

  return headers;
};

// Execute the integration with pagination support
export const executeIntegration = async (integration: Integration): Promise<any[]> => {
  const processedUrl = processVariables(integration.url);
  const processedPayload = processVariables(integration.payload || '');
  const headers = getHeaders(integration);
  
  let allResults: any[] = [];
  let page = 1;
  const maxPages = 5; // Safety limit
  
  try {
    // Handling Pagination Loop
    while (page <= maxPages) {
      let currentUrl = processedUrl;
      
      // Append pagination param if needed
      if (integration.paginationType === 'Freshdesk_Page_Param') {
        const separator = currentUrl.includes('?') ? '&' : '?';
        currentUrl = `${currentUrl}${separator}page=${page}`;
      }

      const options: RequestInit = {
        method: integration.method,
        headers: headers,
      };

      if (integration.method === 'POST' && processedPayload) {
        options.body = processedPayload;
      }

      console.log(`Fetching ${currentUrl}...`);
      const response = await fetch(currentUrl, options);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      let pageResults: any[] = [];
      
      if (integration.templateType === 'Freshdesk' && data.results && Array.isArray(data.results)) {
        pageResults = data.results;
      } else if (Array.isArray(data)) {
        pageResults = data;
      } else {
        pageResults = [data];
      }

      if (pageResults.length === 0) {
        break;
      }

      allResults = [...allResults, ...pageResults];

      if (integration.paginationType === 'None' || !integration.paginationType) {
        break;
      }

      if (integration.templateType === 'Freshdesk' && pageResults.length < 30) {
        break;
      }

      page++;
    }

    return allResults;

  } catch (error) {
    console.error("Integration execution failed", error);
    throw error;
  }
};

// Test connection returns success status AND data for preview
export const testIntegrationConnection = async (integration: Integration): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const processedUrl = processVariables(integration.url);
    const headers = getHeaders(integration);
    
    let testUrl = processedUrl;
    if (integration.paginationType === 'Freshdesk_Page_Param') {
        const separator = testUrl.includes('?') ? '&' : '?';
        testUrl = `${testUrl}${separator}page=1`;
    }

    const response = await fetch(testUrl, {
      method: integration.method,
      headers: headers,
      body: integration.method === 'POST' ? processVariables(integration.payload || '') : undefined
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: "Connection successful! 200 OK", data: data };
    } else {
      return { success: false, message: `Failed: ${response.status} ${response.statusText}` };
    }
  } catch (error: any) {
    return { success: false, message: `Network Error: ${error.message}` };
  }
};