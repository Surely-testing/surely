'use client'

import React, { useState } from "react";
import { Play, Plus, Trash2, ArrowDown, Settings, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface APIRequest {
  id?: string;
  suite_id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

interface DataExtraction {
  key: string;
  jsonPath: string;
  description?: string;
}

interface WorkflowStep {
  id: string;
  request: APIRequest;
  extractData: DataExtraction[];
  response?: any;
  status?: number;
  time?: number;
  error?: string;
}

interface WorkflowBuilderProps {
  suiteId: string;
  availableRequests: APIRequest[];
  onSaveWorkflow?: (workflow: any) => void;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  suiteId,
  availableRequests,
  onSaveWorkflow
}) => {
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [running, setRunning] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showRequestPicker, setShowRequestPicker] = useState(false);
  const [editingStep, setEditingStep] = useState<string | null>(null);

  const addStep = (request: APIRequest) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      request: { ...request },
      extractData: []
    };
    setSteps([...steps, newStep]);
    setShowRequestPicker(false);
    toast.success('Step added to workflow');
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(s => s.id !== stepId));
    toast.success('Step removed');
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const addDataExtraction = (stepId: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          extractData: [...step.extractData, { key: '', jsonPath: '', description: '' }]
        };
      }
      return step;
    }));
  };

  const updateDataExtraction = (stepId: string, index: number, field: keyof DataExtraction, value: string) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        const newExtractions = [...step.extractData];
        newExtractions[index] = { ...newExtractions[index], [field]: value };
        return { ...step, extractData: newExtractions };
      }
      return step;
    }));
  };

  const removeDataExtraction = (stepId: string, index: number) => {
    setSteps(steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          extractData: step.extractData.filter((_, i) => i !== index)
        };
      }
      return step;
    }));
  };

  const extractDataFromResponse = (response: any, jsonPath: string): any => {
    try {
      const keys = jsonPath.split('.');
      let value = response;
      for (const key of keys) {
        if (value && typeof value === 'object') {
          value = value[key];
        } else {
          return null;
        }
      }
      return value;
    } catch {
      return null;
    }
  };

  const replaceVariables = (text: string, extractedData: Record<string, any>): string => {
    let result = text;
    Object.keys(extractedData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(extractedData[key]));
    });
    return result;
  };

  const runWorkflow = async () => {
    if (steps.length === 0) {
      toast.error('Add at least one step to the workflow');
      return;
    }

    setRunning(true);
    const startTime = Date.now();
    const extractedData: Record<string, any> = {};
    const updatedSteps = [...steps];

    try {
      for (let i = 0; i < updatedSteps.length; i++) {
        const step = updatedSteps[i];
        const stepStartTime = Date.now();

        let url = replaceVariables(step.request.url, extractedData);
        let body = replaceVariables(step.request.body, extractedData);
        let headers = { ...step.request.headers };
        
        Object.keys(headers).forEach(key => {
          headers[key] = replaceVariables(headers[key], extractedData);
        });

        try {
          const response = await fetch(url, {
            method: step.request.method,
            headers: headers,
            body: step.request.method !== 'GET' && step.request.method !== 'HEAD' ? body : undefined
          });

          const contentType = response.headers.get('content-type') || '';
          let data: any;
          
          if (contentType.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text();
          }

          const stepEndTime = Date.now();

          updatedSteps[i] = {
            ...step,
            response: data,
            status: response.status,
            time: stepEndTime - stepStartTime,
            error: undefined
          };

          if (step.extractData && step.extractData.length > 0) {
            step.extractData.forEach(extract => {
              if (extract.key && extract.jsonPath) {
                const value = extractDataFromResponse(data, extract.jsonPath);
                if (value !== null) {
                  extractedData[extract.key] = value;
                  toast.success(`Extracted ${extract.key}: ${value}`);
                }
              }
            });
          }

          setSteps([...updatedSteps]);

        } catch (error: any) {
          updatedSteps[i] = {
            ...step,
            error: error.message,
            status: 0,
            time: Date.now() - stepStartTime
          };
          setSteps([...updatedSteps]);
          toast.error(`Step ${i + 1} failed: ${error.message}`);
          break;
        }
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      toast.success(`Workflow completed in ${totalDuration}ms`);

    } catch (error: any) {
      toast.error('Workflow execution failed');
    } finally {
      setRunning(false);
    }
  };

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'GET': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      'POST': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'PUT': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      'PATCH': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      'DELETE': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    };
    return colors[method] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
  };

  const getAllExtractedVariables = () => {
    const variables: string[] = [];
    steps.forEach(step => {
      step.extractData.forEach(extract => {
        if (extract.key) {
          variables.push(extract.key);
        }
      });
    });
    return variables;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-xl font-bold bg-transparent border-none text-gray-900 dark:text-gray-100 focus:outline-none"
            placeholder="Workflow name"
          />
          <div className="flex gap-2">
            <button
              onClick={runWorkflow}
              disabled={running || steps.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {running ? 'Running...' : 'Run Workflow'}
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>How it works:</strong> Add requests as steps, extract data from responses, and use variables like <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded font-mono text-xs">{'{{token}}'}</code> in following steps.
          </p>
          {getAllExtractedVariables().length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">Available Variables:</div>
              <div className="flex flex-wrap gap-2">
                {getAllExtractedVariables().map((variable, i) => (
                  <code key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 rounded font-mono text-xs text-blue-900 dark:text-blue-100">
                    {`{{${variable}}}`}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>

        {steps.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <div className="text-gray-500 dark:text-gray-400 mb-3 text-lg font-medium">
              No steps added yet
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Start building your workflow by adding requests
            </div>
            <button
              onClick={() => setShowRequestPicker(true)}
              className="px-6 py-2.5 btn-primary text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Step
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id}>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      {index < steps.length - 1 && (
                        <ArrowDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {step.request.name}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getMethodColor(step.request.method)}`}>
                              {step.request.method}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {step.request.url}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                          {step.status !== undefined && (
                            <div className="flex items-center gap-2 mr-2">
                              {step.status >= 200 && step.status < 300 ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {step.status}
                              </span>
                              {step.time && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {step.time}ms
                                </span>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => toggleStepExpansion(step.id)}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Configure step"
                          >
                            {expandedSteps.has(step.id) ? (
                              <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>
                          {index > 0 && (
                            <button
                              onClick={() => moveStep(index, 'up')}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                              title="Move up"
                            >
                              <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          )}
                          {index < steps.length - 1 && (
                            <button
                              onClick={() => moveStep(index, 'down')}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                              title="Move down"
                            >
                              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          )}
                          <button
                            onClick={() => removeStep(step.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Remove step"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>

                      {expandedSteps.has(step.id) && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Extract Data from Response
                              </label>
                              <button
                                onClick={() => addDataExtraction(step.id)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add extraction
                              </button>
                            </div>

                            {step.extractData.length === 0 ? (
                              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No data extraction configured
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {step.extractData.map((extract, extractIndex) => (
                                  <div key={extractIndex} className="flex gap-2 items-start">
                                    <input
                                      type="text"
                                      value={extract.key}
                                      onChange={(e) => updateDataExtraction(step.id, extractIndex, 'key', e.target.value)}
                                      placeholder="Variable name (e.g. token)"
                                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                      type="text"
                                      value={extract.jsonPath}
                                      onChange={(e) => updateDataExtraction(step.id, extractIndex, 'jsonPath', e.target.value)}
                                      placeholder="JSON path (e.g. data.token)"
                                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                      onClick={() => removeDataExtraction(step.id, extractIndex)}
                                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {step.response && (
                            <div>
                              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                Response
                              </label>
                              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 max-h-[200px] overflow-auto">
                                <pre className="text-xs text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap">
                                  {typeof step.response === 'string' 
                                    ? step.response 
                                    : JSON.stringify(step.response, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}

                          {step.error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                              <div className="text-sm text-red-800 dark:text-red-200 font-semibold mb-1">
                                Error
                              </div>
                              <div className="text-sm text-red-700 dark:text-red-300">
                                {step.error}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowRequestPicker(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>
        )}
      </div>

      {showRequestPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Select Request to Add
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {availableRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No saved requests available. Create some requests first.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableRequests.map(request => (
                    <div
                      key={request.id}
                      onClick={() => addStep(request)}
                      className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 cursor-pointer transition-all"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {request.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getMethodColor(request.method)}`}>
                          {request.method}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {request.url}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowRequestPicker(false)}
                className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};