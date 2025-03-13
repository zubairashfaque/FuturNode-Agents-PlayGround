import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  status?: number;
  response?: any;
  error?: string;
  duration?: number;
}

interface ApiCallLoggerProps {
  maxLogs?: number;
  className?: string;
}

// Global array to store logs across component instances
let globalLogs: ApiLog[] = [];

// Function to add a log entry that can be called from anywhere
export const logApiCall = (log: Omit<ApiLog, "id" | "timestamp">) => {
  const newLog: ApiLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...log,
  };

  globalLogs = [newLog, ...globalLogs];

  // Dispatch an event so any mounted ApiCallLogger components can update
  window.dispatchEvent(new CustomEvent("api-log-added", { detail: newLog }));

  return newLog.id;
};

// Function to update an existing log entry
export const updateApiLog = (id: string, updates: Partial<ApiLog>) => {
  globalLogs = globalLogs.map((log) =>
    log.id === id ? { ...log, ...updates } : log,
  );

  // Dispatch an event so any mounted ApiCallLogger components can update
  window.dispatchEvent(new CustomEvent("api-log-updated"));
};

// Function to clear all logs
export const clearApiLogs = () => {
  globalLogs = [];
  window.dispatchEvent(new CustomEvent("api-logs-cleared"));
};

export default function ApiCallLogger({
  maxLogs = 50,
  className = "",
}: ApiCallLoggerProps) {
  const [logs, setLogs] = useState<ApiLog[]>(globalLogs);
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [activeTab, setActiveTab] = useState<string>("request");
  const { toast } = useToast();

  useEffect(() => {
    // Update logs when a new log is added
    const handleLogAdded = () => {
      setLogs([...globalLogs].slice(0, maxLogs));
    };

    // Update logs when a log is updated
    const handleLogUpdated = () => {
      setLogs([...globalLogs].slice(0, maxLogs));

      // If the currently selected log was updated, update it
      if (selectedLog) {
        const updatedLog = globalLogs.find((log) => log.id === selectedLog.id);
        if (updatedLog) {
          setSelectedLog(updatedLog);
        }
      }
    };

    // Clear logs
    const handleLogsCleared = () => {
      setLogs([]);
      setSelectedLog(null);
    };

    window.addEventListener("api-log-added", handleLogAdded);
    window.addEventListener("api-log-updated", handleLogUpdated);
    window.addEventListener("api-logs-cleared", handleLogsCleared);

    return () => {
      window.removeEventListener("api-log-added", handleLogAdded);
      window.removeEventListener("api-log-updated", handleLogUpdated);
      window.removeEventListener("api-logs-cleared", handleLogsCleared);
    };
  }, [maxLogs, selectedLog]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The content has been copied to your clipboard.",
      duration: 3000,
    });
  };

  const formatJson = (json: any): string => {
    try {
      if (typeof json === "string") {
        return JSON.stringify(JSON.parse(json), null, 2);
      }
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return typeof json === "string" ? json : JSON.stringify(json);
    }
  };

  const getStatusColor = (status?: number): string => {
    if (!status) return "text-gray-500";
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 400 && status < 500) return "text-orange-600";
    if (status >= 500) return "text-red-600";
    return "text-gray-500";
  };

  const formatDuration = (duration?: number): string => {
    if (!duration) return "";
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">API Call Logs</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearApiLogs()}
            className="flex items-center gap-1"
          >
            <Trash className="h-4 w-4" />
            Clear Logs
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
          <div className="md:col-span-1 border rounded-md overflow-hidden">
            <div className="bg-gray-100 px-3 py-2 font-medium text-sm border-b">
              Recent API Calls
            </div>
            <ScrollArea className="h-[550px]">
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  No API calls logged yet
                </div>
              ) : (
                <div className="divide-y">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`px-3 py-2 hover:bg-gray-50 cursor-pointer ${selectedLog?.id === log.id ? "bg-blue-50" : ""}`}
                      onClick={() => {
                        setSelectedLog(log);
                        setActiveTab("request");
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded ${log.method === "GET" ? "bg-blue-100 text-blue-800" : log.method === "POST" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"}`}
                        >
                          {log.method}
                        </span>
                        <span
                          className={`text-xs font-medium ${getStatusColor(log.status)}`}
                        >
                          {log.status
                            ? `${log.status}`
                            : log.error
                              ? "Error"
                              : "Pending"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-700 truncate mt-1">
                        {log.url}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {log.duration && (
                          <span className="text-xs text-gray-500">
                            {formatDuration(log.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="md:col-span-2 border rounded-md overflow-hidden">
            {selectedLog ? (
              <>
                <div className="bg-gray-100 px-3 py-2 border-b">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-sm">
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded mr-2 ${selectedLog.method === "GET" ? "bg-blue-100 text-blue-800" : selectedLog.method === "POST" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"}`}
                      >
                        {selectedLog.method}
                      </span>
                      <span className="text-gray-700">{selectedLog.url}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${getStatusColor(selectedLog.status)}`}
                      >
                        {selectedLog.status
                          ? `${selectedLog.status}`
                          : selectedLog.error
                            ? "Error"
                            : "Pending"}
                      </span>
                      {selectedLog.duration && (
                        <span className="text-xs text-gray-500">
                          {formatDuration(selectedLog.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="p-3"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="request">Request</TabsTrigger>
                    <TabsTrigger value="response">Response</TabsTrigger>
                  </TabsList>

                  <TabsContent value="request" className="pt-4 space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium">Headers</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyToClipboard(
                              formatJson(selectedLog.headers),
                            )
                          }
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <pre className="bg-gray-50 p-3 rounded-md text-xs font-mono overflow-auto max-h-[200px]">
                        {formatJson(selectedLog.headers)}
                      </pre>
                    </div>

                    {selectedLog.body && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-sm font-medium">Body</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopyToClipboard(
                                formatJson(selectedLog.body),
                              )
                            }
                            className="h-6 px-2"
                          >
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </Button>
                        </div>
                        <pre className="bg-gray-50 p-3 rounded-md text-xs font-mono overflow-auto max-h-[200px]">
                          {formatJson(selectedLog.body)}
                        </pre>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="response" className="pt-4 space-y-4">
                    {selectedLog.error ? (
                      <div className="bg-red-50 border border-red-100 text-red-800 p-3 rounded-md">
                        <h4 className="text-sm font-medium mb-1">Error</h4>
                        <p className="text-xs">{selectedLog.error}</p>
                      </div>
                    ) : selectedLog.response ? (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-sm font-medium">Response Data</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopyToClipboard(
                                formatJson(selectedLog.response),
                              )
                            }
                            className="h-6 px-2"
                          >
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </Button>
                        </div>
                        <pre className="bg-gray-50 p-3 rounded-md text-xs font-mono overflow-auto max-h-[400px]">
                          {formatJson(selectedLog.response)}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">
                        {selectedLog.status
                          ? "No response body"
                          : "Waiting for response..."}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Select an API call from the list to view details
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
