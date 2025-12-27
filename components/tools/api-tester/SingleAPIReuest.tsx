'use client'

import React, { useState } from "react";
import { Send, Copy, Download, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface SingleAPIRequestProps {
  suiteId: string;
  onRequestSaved?: (request: any) => void;
}

interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: number;
}

export const SingleAPIRequest: React.FC<SingleAPIRequestProps> = ({ 
  suiteId, 
  onRequestSaved 
}) => {
  const [config, setConfig] = useState<RequestConfig>({
    method: 'GET',
    url: '',
    headers: { 'Content-Type': 'application/json' },
    body: ''
  });
  
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'params'>('headers');
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'info'>('body');
  const [urlParams, setUrlParams] = useState<Array<{key: string, value: string}>>([
    { key: '', value: '' }
  ]);

  const validateURL = (url: string): boolean => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return false;
    }

    try {
      new URL(url);
      return true;
    } catch {
      toast.error('Please enter a valid URL (must include http:// or https://)');
      return false;
    }
  };

  const buildURLWithParams = (): string => {
    const baseUrl = config.url;
    const validParams = urlParams.filter(p => p.key.trim() && p.value.trim());
    
    if (validParams.length === 0) return baseUrl;

    const url = new URL(baseUrl);
    validParams.forEach(param => {
      url.searchParams.append(param.key, param.value);
    });
    
    return url.toString();
  };

  const sendRequest = async () => {
    if (!validateURL(config.url)) return;

    setLoading(true);
    const startTime = performance.now();

    try {
      const finalUrl = buildURLWithParams();
      const requestOptions: RequestInit = {
        method: config.method,
        headers: config.headers,
      };

      if (config.method !== 'GET' && config.method !== 'HEAD' && config.body) {
        requestOptions.body = config.body;
      }

      const res = await fetch(finalUrl, requestOptions);
      const endTime = performance.now();

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any;
      
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else if (contentType.includes('text/')) {
        data = await res.text();
      } else {
        data = await res.blob().then(blob => `Binary data (${blob.size} bytes)`);
      }

      const responseSize = JSON.stringify(data).length;

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data,
        time: Math.round(endTime - startTime),
        size: responseSize
      });

      toast.success(`Request completed in ${Math.round(endTime - startTime)}ms`);

    } catch (error: any) {
      const endTime = performance.now();
      toast.error(error.message || 'Request failed');
      
      setResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        data: { error: error.message },
        time: Math.round(endTime - startTime),
        size: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const updateHeader = (key: string, value: string, oldKey?: string) => {
    const newHeaders = { ...config.headers };
    if (oldKey && oldKey !== key) {
      delete newHeaders[oldKey];
    }
    if (key) {
      newHeaders[key] = value;
    }
    setConfig({ ...config, headers: newHeaders });
  };

  const deleteHeader = (key: string) => {
    const newHeaders = { ...config.headers };
    delete newHeaders[key];
    setConfig({ ...config, headers: newHeaders });
  };

  const addHeader = () => {
    const newHeaders = { ...config.headers, '': '' };
    setConfig({ ...config, headers: newHeaders });
  };

  const updateParam = (index: number, field: 'key' | 'value', val: string) => {
    const newParams = [...urlParams];
    newParams[index][field] = val;
    setUrlParams(newParams);
  };

  const addParam = () => {
    setUrlParams([...urlParams, { key: '', value: '' }]);
  };

  const deleteParam = (index: number) => {
    setUrlParams(urlParams.filter((_, i) => i !== index));
  };

  const copyResponse = () => {
    const text = typeof response?.data === 'string' 
      ? response.data 
      : JSON.stringify(response?.data, null, 2);
    navigator.clipboard.writeText(text);
    toast.success('Response copied to clipboard');
  };

  const downloadResponse = () => {
    const text = typeof response?.data === 'string' 
      ? response.data 
      : JSON.stringify(response?.data, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Response downloaded');
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(config.body);
      setConfig({ ...config, body: JSON.stringify(parsed, null, 2) });
      toast.success('JSON formatted');
    } catch {
      toast.error('Invalid JSON');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex gap-3 mb-6">
          <select 
            value={config.method}
            onChange={(e) => setConfig({ ...config, method: e.target.value })}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
            <option>HEAD</option>
            <option>OPTIONS</option>
          </select>
          
          <input 
            type="text"
            value={config.url}
            onChange={(e) => setConfig({ ...config, url: e.target.value })}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={sendRequest}
            disabled={loading}
            className="px-6 py-2 btn-primary text-white rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex gap-6">
            {(['params', 'headers', 'body'] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[200px]">
          {activeTab === 'params' && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Query parameters are automatically added to the URL
              </div>
              {urlParams.map((param, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => updateParam(index, 'key', e.target.value)}
                    placeholder="Parameter name"
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => updateParam(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => deleteParam(index)}
                    className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
              <button
                onClick={addParam}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Add parameter
              </button>
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="space-y-2">
              {Object.entries(config.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => updateHeader(e.target.value, value, key)}
                    placeholder="Header name"
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateHeader(key, e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => deleteHeader(key)}
                    className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
              <button
                onClick={addHeader}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Add header
              </button>
            </div>
          )}

          {activeTab === 'body' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={formatJSON}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Format JSON
                </button>
              </div>
              <textarea 
                value={config.body}
                onChange={(e) => setConfig({ ...config, body: e.target.value })}
                placeholder='{"key": "value"}'
                rows={10}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {response && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Response</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {response.status >= 200 && response.status < 300 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  response.status >= 200 && response.status < 300
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {response.status} {response.statusText}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                {response.time}ms
              </div>
              <button 
                onClick={copyResponse}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Copy response"
              >
                <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                onClick={downloadResponse}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Download response"
              >
                <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex gap-6">
              {(['body', 'headers', 'info'] as const).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setResponseTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                    responseTab === tab
                      ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-[500px] overflow-auto">
            {responseTab === 'body' && (
              <pre className="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap">
                {typeof response.data === 'string' 
                  ? response.data 
                  : JSON.stringify(response.data, null, 2)}
              </pre>
            )}

            {responseTab === 'headers' && (
              <div className="space-y-2">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-3 text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[200px]">{key}:</span>
                    <span className="text-gray-600 dark:text-gray-400">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {responseTab === 'info' && (
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[120px]">Status:</span>
                  <span className="text-gray-600 dark:text-gray-400">{response.status} {response.statusText}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[120px]">Time:</span>
                  <span className="text-gray-600 dark:text-gray-400">{response.time}ms</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[120px]">Size:</span>
                  <span className="text-gray-600 dark:text-gray-400">{response.size} bytes</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};