import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Loader2, Users, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Link } from "react-router-dom";
import { logApiCall, updateApiLog } from "@/components/debug/ApiCallLogger";

interface LeadGenieAgentProps {
  onBack: () => void;
}

interface ApiKeyData {
  id: string;
  api_key: string;
}

interface Contact {
  name: string;
  title: string;
  email: string;
  linkedin: string;
  relevance: number;
}

interface OutreachStrategy {
  key_points: string[];
  recommended_approach: string;
}

interface LeadGenieResult {
  company: string;
  contacts: Contact[];
  outreach_strategy: OutreachStrategy;
}

// Base API URL
const API_BASE_URL = "https://13.233.233.139:8080";
// CORS Proxy URL
const CORS_PROXY_URL = "https://corsproxy.io/?";

// Function to create a proxied URL
const createProxiedUrl = (url: string) => {
  return `${CORS_PROXY_URL}${encodeURIComponent(url)}`;
};

export default function LeadGenieAgent({ onBack }: LeadGenieAgentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<LeadGenieResult | null>(
    null,
  );
  const [requestId, setRequestId] = useState<string | null>(null);
  const [targetCompany, setTargetCompany] = useState("");
  const [ourProduct, setOurProduct] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [savedApiKey, setSavedApiKey] = useState<ApiKeyData | null>(null);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [activeTab, setActiveTab] = useState("json");
  const [useProxy, setUseProxy] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch saved API key on component mount
  useEffect(() => {
    if (user) {
      fetchApiKey();
    }
  }, [user]);

  const fetchApiKey = async () => {
    try {
      setIsLoading(true);

      if (!user || !user.id) {
        console.error("User not authenticated");
        toast({
          title: "Authentication Error",
          description: "Please log in to save API keys",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("api_keys")
        .select("id, api_key")
        .eq("user_id", user.id)
        .eq("agent_id", "leadgenie")
        .single();

      if (error) {
        // Don't treat 'not found' as an error, it just means the user hasn't saved a key yet
        if (error.code === "PGRST116") {
          console.log("No API key found for this user");
          setSavedApiKey(null);
          return;
        }

        console.error("Error fetching API key:", error);
        toast({
          title: "Error",
          description: `Failed to fetch API key: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setSavedApiKey(data);
        setApiKey(data.api_key);
      }
    } catch (error) {
      console.error("Error fetching API key:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching your API key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "API key cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingKey(true);

      if (!user || !user.id) {
        throw new Error("User not authenticated");
      }

      if (savedApiKey) {
        // Update existing key
        const { error } = await supabase
          .from("api_keys")
          .update({ api_key: apiKey, updated_at: new Date().toISOString() })
          .eq("id", savedApiKey.id);

        if (error) {
          console.error("Error updating API key:", error);
          throw new Error(`Failed to update API key: ${error.message}`);
        }
      } else {
        // Insert new key - use upsert to handle potential conflicts
        const { error } = await supabase.from("api_keys").upsert(
          {
            user_id: user.id,
            agent_id: "leadgenie",
            api_key: apiKey,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,agent_id" },
        );

        if (error) {
          console.error("Error inserting API key:", error);
          throw new Error(`Failed to insert API key: ${error.message}`);
        }
      }

      // Fetch the updated key
      await fetchApiKey();
      toast({
        title: "Success",
        description: "API key saved successfully",
      });
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSubmit = async () => {
    if (!targetCompany.trim() || !ourProduct.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if API key is available - use the current input value if no saved key exists
    const currentApiKey = savedApiKey?.api_key || apiKey.trim();

    if (!currentApiKey) {
      toast({
        title: "Error",
        description: "Please enter and save your API key first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setParsedResult(null);
    setRequestId(null);

    try {
      // Determine the URL to use (proxied or direct)
      const apiEndpoint = `${API_BASE_URL}/agents/sales-contact-finder`;
      const requestUrl = useProxy ? createProxiedUrl(apiEndpoint) : apiEndpoint;

      // Log the request parameters for debugging
      console.log("Making API request with parameters:", {
        target_company: targetCompany,
        our_product: ourProduct,
        api_key: currentApiKey.substring(0, 3) + "...", // Log only first few chars of API key for security
        url: requestUrl,
        using_proxy: useProxy,
      });

      // Attempt to make the actual API call
      try {
        // Create a unique ID for this API call for logging
        const requestStartTime = Date.now();
        const logId = logApiCall({
          method: "POST",
          url: requestUrl,
          headers: {
            "X-API-Key": "[REDACTED]",
            "Content-Type": "application/json",
          },
          body: {
            target_company: targetCompany,
            our_product: ourProduct,
          },
        });

        console.log("Initiating Task (Sales Contact Finder)");
        console.log(`URL: ${requestUrl}`);
        console.log("Method: POST");
        console.log("Headers:", {
          "X-API-Key": currentApiKey.substring(0, 5) + "...", // Only show first few chars for security
          "Content-Type": "application/json",
        });
        console.log("Body:", {
          target_company: targetCompany,
          our_product: ourProduct,
        });

        // Simplified request headers
        const headers = {
          "X-API-Key": currentApiKey,
          "Content-Type": "application/json",
        };

        const response = await fetch(requestUrl, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            target_company: targetCompany,
            our_product: ourProduct,
          }),
        });

        console.log("API response status:", response.status);

        // Log response headers for debugging
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        console.log("API response headers:", responseHeaders);

        // Update the API call log with response information
        updateApiLog(logId, {
          status: response.status,
          duration: Date.now() - requestStartTime,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error response:", errorText);

          // Update the API call log with error information
          updateApiLog(logId, {
            error: `HTTP error! status: ${response.status}, message: ${errorText}`,
            response: errorText,
          });

          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`,
          );
        }

        const data = await response.json();
        console.log("API response data:", data);

        // Update the API call log with response data
        updateApiLog(logId, {
          response: data,
        });

        setRequestId(data.request_id);

        // Start polling for results
        pollForResults(data.request_id, currentApiKey);
      } catch (apiError) {
        console.error("API call failed:", apiError);

        // Log the error to the console with more details
        console.error("Error details:", {
          message: apiError.message,
          name: apiError.name,
          stack: apiError.stack,
          isCORSError:
            apiError.message.includes("CORS") ||
            apiError.message.includes("Failed to fetch"),
        });

        // Create a more detailed error message
        let errorMessage = `Failed to connect to server: ${apiError.message}`;
        let errorTips = "";

        if (
          apiError.message.includes("Failed to fetch") ||
          apiError.message.includes("NetworkError")
        ) {
          errorTips =
            "This may be due to network connectivity issues, CORS restrictions, or the API server being unavailable.";
        } else if (apiError.message.includes("CORS")) {
          errorTips =
            "This is a CORS policy error. The API server may not allow requests from this origin.";
        }

        // If using direct connection failed, suggest trying the proxy
        if (!useProxy) {
          errorTips += " Try enabling the CORS proxy option.";
        }

        toast({
          title: "API Connection Error",
          description: (
            <div>
              <p>{errorMessage}</p>
              {errorTips && (
                <p className="text-sm mt-1 text-amber-600">{errorTips}</p>
              )}
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => window.open("/debug", "_blank")}
                  className="underline text-blue-500 text-sm"
                >
                  View Logs
                </button>
                {!useProxy && (
                  <button
                    onClick={() => {
                      setUseProxy(true);
                      setTimeout(() => handleSubmit(), 500);
                    }}
                    className="underline text-blue-500 text-sm"
                  >
                    Try with Proxy
                  </button>
                )}
                <button
                  onClick={() => handleSubmit()}
                  className="underline text-blue-500 text-sm"
                >
                  Retry Request
                </button>
              </div>
            </div>
          ),
          variant: "destructive",
          duration: 15000,
        });

        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error starting task:", error);
      toast({
        title: "Error",
        description: "Failed to start the task. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const pollForResults = (requestId: string, apiKey: string) => {
    console.log(`Starting to poll for results with request ID: ${requestId}`);
    const interval = setInterval(async () => {
      try {
        // Determine the URL to use (proxied or direct)
        const apiEndpoint = `${API_BASE_URL}/task/${requestId}`;
        const requestUrl = useProxy
          ? createProxiedUrl(apiEndpoint)
          : apiEndpoint;

        console.log(`Polling for task status: ${requestId}`);
        console.log(`URL: ${requestUrl}`);
        console.log(`Method: GET`);
        console.log(`Headers: { "X-API-Key": "${apiKey.substring(0, 5)}..." }`);

        // Create a unique ID for this polling API call for logging
        const pollStartTime = Date.now();
        const pollLogId = logApiCall({
          method: "GET",
          url: requestUrl,
          headers: {
            "X-API-Key": "[REDACTED]",
            "Content-Type": "application/json",
          },
        });

        // Simplified request headers
        const headers = {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        };

        const response = await fetch(requestUrl, {
          method: "GET",
          headers: headers,
        });

        console.log(`Poll response status: ${response.status}`);

        // Update the API call log with response information
        updateApiLog(pollLogId, {
          status: response.status,
          duration: Date.now() - pollStartTime,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Poll error response:", errorText);

          // Update the API call log with error information
          updateApiLog(pollLogId, {
            error: `HTTP error! status: ${response.status}, message: ${errorText}`,
            response: errorText,
          });

          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`,
          );
        }

        const data = await response.json();
        console.log("Poll response data:", data);

        // Update the API call log with response data
        updateApiLog(pollLogId, {
          response: data,
        });

        // Update progress
        if (data.status === "in_progress") {
          // Simulate progress since the API might not provide it
          setProgress((prev) => (prev < 90 ? prev + 5 : prev));
          console.log(`Task in progress, updated progress to ${progress}%`);
        } else if (data.status === "completed") {
          clearInterval(interval);
          console.log("Task completed, setting results");
          setProgress(100);
          setResult(JSON.stringify(data.result, null, 2));
          setParsedResult(data.result);
          setIsProcessing(false);
        } else if (data.status === "failed") {
          clearInterval(interval);
          console.error("Task failed:", data.error);
          toast({
            title: "Error",
            description: data.error || "Task failed",
            variant: "destructive",
          });
          setIsProcessing(false);
        }
      } catch (error) {
        console.error("Error polling for results:", error);
        clearInterval(interval);
        toast({
          title: "Error",
          description: "Failed to get task results",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  };

  const convertToMarkdown = (data: LeadGenieResult): string => {
    if (!data) return "";

    let markdown = `# Lead Generation Results for ${data.company}\n\n`;

    // Add contacts section
    markdown += `## Key Contacts\n\n`;
    data.contacts.forEach((contact, index) => {
      markdown += `### ${contact.name} - ${contact.title}\n`;
      markdown += `- **Email:** ${contact.email}\n`;
      markdown += `- **LinkedIn:** ${contact.linkedin}\n`;
      markdown += `- **Relevance Score:** ${(contact.relevance * 100).toFixed(0)}%\n\n`;
    });

    // Add outreach strategy section
    markdown += `## Recommended Outreach Strategy\n\n`;
    markdown += `### Key Points to Emphasize\n\n`;
    data.outreach_strategy.key_points.forEach((point) => {
      markdown += `- ${point}\n`;
    });
    markdown += `\n### Recommended Approach\n\n${data.outreach_strategy.recommended_approach}\n\n`;

    // Add product context
    markdown += `## Product Context\n\n`;
    markdown += `This lead generation was performed for: **${ourProduct}**\n`;

    return markdown;
  };

  const downloadResults = () => {
    if (!result) return;

    let content = result;
    let fileType = "application/json";
    let fileExtension = "json";

    if (activeTab === "markdown" && parsedResult) {
      content = convertToMarkdown(parsedResult);
      fileType = "text/markdown";
      fileExtension = "md";
    }

    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leadgenie-results-${targetCompany.toLowerCase().replace(/\s+/g, "-")}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" text="Loading LeadGenie..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Button>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="useProxy"
            className="text-sm font-medium cursor-pointer"
          >
            Use CORS Proxy
          </Label>
          <input
            type="checkbox"
            id="useProxy"
            checked={useProxy}
            onChange={(e) => setUseProxy(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <span className="h-4 w-4 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center">
                    ?
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Enable this option to use a CORS proxy to bypass browser
                  security restrictions. This is recommended if you're
                  experiencing connection issues.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    LeadGenie
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Sales", "Lead Generation", "B2B"].map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-gray-100 text-gray-700"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                LeadGenie helps sales teams find and connect with the right
                people at target companies more effectively by researching
                companies, analyzing their structure, identifying
                decision-makers, and creating tailored strategies for outreach.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-medium">API Key</CardTitle>
                  <CardDescription>
                    Your API key is required to use LeadGenie
                  </CardDescription>
                </div>
                <Link to="/settings">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Settings className="h-4 w-4" />
                    Manage Keys
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {savedApiKey ? (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-green-800 text-sm">
                    <p className="font-medium">API Key Configured</p>
                    <p className="text-xs mt-1">
                      Your API key has been saved and will be used for all
                      LeadGenie requests.
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-yellow-800 text-sm">
                    <p className="font-medium">API Key Required</p>
                    <p className="text-xs mt-1">
                      Please configure your API key in the settings page to use
                      LeadGenie.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Parameters</CardTitle>
              <CardDescription>
                Configure your lead generation request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="targetCompany"
                    className="text-sm font-medium text-gray-700"
                  >
                    Target Company
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <span className="h-4 w-4 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center">
                            ?
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          The company you want to research and find contacts at
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="targetCompany"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="e.g., Microsoft"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="ourProduct"
                    className="text-sm font-medium text-gray-700"
                  >
                    Our Product/Service
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <span className="h-4 w-4 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center">
                            ?
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Description of your product or service to help tailor
                          the outreach strategy
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="ourProduct"
                  value={ourProduct}
                  onChange={(e) => setOurProduct(e.target.value)}
                  placeholder="e.g., AI-powered analytics platform"
                  className="w-full"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSubmit}
                disabled={isProcessing || !savedApiKey}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Find Leads"
                )}
              </Button>
              {!savedApiKey && (
                <div className="text-center mt-2">
                  <Link
                    to="/settings"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Configure API key in settings
                  </Link>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-medium">Results</CardTitle>
                  <CardDescription>
                    {result
                      ? "Lead generation complete"
                      : "Run the agent to see results"}
                  </CardDescription>
                </div>
                {result && !isProcessing && (
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-[200px]"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="json">JSON</TabsTrigger>
                      <TabsTrigger value="markdown">Markdown</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              </div>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              {isProcessing && (
                <div className="flex flex-col items-center justify-center h-[400px]">
                  <div className="w-full max-w-md">
                    <Progress value={progress} className="h-2 mb-4" />
                    <p className="text-center text-sm text-gray-500">
                      Researching {targetCompany}... {progress}%
                    </p>
                    <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs font-mono overflow-auto max-h-[300px]">
                      <p className="font-semibold">API Call Logs:</p>
                      <p className="mt-1">
                        Endpoint: {useProxy ? "Using CORS Proxy → " : ""}
                        {API_BASE_URL}/agents/sales-contact-finder
                      </p>
                      <p className="mt-1">Method: POST</p>
                      <p className="mt-1">Headers:</p>
                      <pre className="ml-2 mt-1">
                        {JSON.stringify(
                          {
                            "X-API-Key": "[REDACTED]",
                            "Content-Type": "application/json",
                          },
                          null,
                          2,
                        )}
                      </pre>
                      <p className="mt-1">Request Body:</p>
                      <pre className="ml-2 mt-1">
                        {JSON.stringify(
                          {
                            target_company: targetCompany,
                            our_product: ourProduct,
                          },
                          null,
                          2,
                        )}
                      </pre>
                      {requestId && (
                        <>
                          <p className="mt-1 text-green-600">
                            Request ID: {requestId}
                          </p>
                          <p className="mt-1">
                            Polling URL: {useProxy ? "Using CORS Proxy → " : ""}
                            {API_BASE_URL}/task/{requestId}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!isProcessing && !result && (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                  <Users className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-center">
                    Configure parameters and run the agent to find leads
                  </p>
                  <p className="text-center text-xs mt-4 text-gray-500">
                    Note: Only real API results will be displayed. No mock data
                    will be shown.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => window.open("/debug", "_blank")}
                  >
                    Open Debug Console
                  </Button>
                </div>
              )}

              {!isProcessing && result && (
                <div className="relative">
                  {activeTab === "json" && (
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[500px] text-sm">
                      <code>{result}</code>
                    </pre>
                  )}

                  {activeTab === "markdown" && parsedResult && (
                    <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[500px]">
                      <MarkdownRenderer
                        content={convertToMarkdown(parsedResult)}
                        className="prose prose-sm max-w-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            {result && !isProcessing && (
              <CardFooter className="flex justify-end">
                <Button
                  onClick={downloadResults}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download {activeTab === "markdown" ? "Markdown" : "JSON"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
