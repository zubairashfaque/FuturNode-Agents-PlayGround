import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Server, ArrowRight } from "lucide-react";

/**
 * A simple proxy service component that can be used to test API calls
 * through a CORS proxy to bypass CORS restrictions.
 */
export default function ProxyService() {
  const [originalUrl, setOriginalUrl] = useState(
    "http://13.233.233.139:8080/agents/sales-contact-finder",
  );
  const [proxyUrl, setProxyUrl] = useState(
    "https://corsproxy.io/?" +
      encodeURIComponent(
        "http://13.233.233.139:8080/agents/sales-contact-finder",
      ),
  );
  const [apiKey, setApiKey] = useState("");
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(
      {
        target_company: "Microsoft",
        our_product: "AI-powered analytics platform",
      },
      null,
      2,
    ),
  );
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [proxyType, setProxyType] = useState("corsproxy");

  const generateProxyUrl = (url: string, type: string) => {
    switch (type) {
      case "corsproxy":
        return "https://corsproxy.io/?" + encodeURIComponent(url);
      case "corsanywhere":
        return "https://cors-anywhere.herokuapp.com/" + url;
      case "allorigins":
        return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      default:
        return "https://corsproxy.io/?" + encodeURIComponent(url);
    }
  };

  const handleOriginalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setOriginalUrl(newUrl);
    setProxyUrl(generateProxyUrl(newUrl, proxyType));
  };

  const handleProxyTypeChange = (value: string) => {
    setProxyType(value);
    setProxyUrl(generateProxyUrl(originalUrl, value));
  };

  const testProxyRequest = async () => {
    setLoading(true);
    setResponse("");
    setError("");

    try {
      console.log("Testing proxy request to:", proxyUrl);
      console.log("Original URL:", originalUrl);
      console.log("Proxy type:", proxyType);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (apiKey) {
        headers["X-API-Key"] = apiKey;
      }

      const response = await fetch(proxyUrl, {
        method: "POST",
        headers,
        body: requestBody,
      });

      console.log("Proxy response status:", response.status);

      // Log response headers for debugging
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      console.log("Proxy response headers:", responseHeaders);

      const responseText = await response.text();
      console.log("Proxy response body:", responseText);

      // Try to parse as JSON if possible
      try {
        const jsonResponse = JSON.parse(responseText);
        setResponse(JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        setResponse(responseText);
      }
    } catch (err) {
      console.error("Proxy request failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          CORS Proxy Service
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">
            CORS Issues Detected
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            Use this proxy service to test API calls through a CORS proxy. This
            can help bypass CORS restrictions when testing the API directly from
            a browser.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup">Proxy Setup</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="originalUrl">Original API URL</Label>
              <Input
                id="originalUrl"
                value={originalUrl}
                onChange={handleOriginalUrlChange}
                placeholder="Enter the original API endpoint URL"
              />
            </div>

            <div className="space-y-2">
              <Label>Proxy Service</Label>
              <Tabs
                value={proxyType}
                onValueChange={handleProxyTypeChange}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="corsproxy">CORS Proxy.io</TabsTrigger>
                  <TabsTrigger value="corsanywhere">CORS Anywhere</TabsTrigger>
                  <TabsTrigger value="allorigins">All Origins</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proxyUrl">Generated Proxy URL</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="proxyUrl"
                  value={proxyUrl}
                  readOnly
                  className="flex-1 bg-gray-50"
                />
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(proxyUrl)}
                  className="shrink-0"
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key (Optional)</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key if required"
                type="password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestBody">Request Body (JSON)</Label>
              <textarea
                id="requestBody"
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter request body as JSON"
              />
            </div>

            <Button
              onClick={testProxyRequest}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Testing Proxy..." : "Test Proxy Request"}
            </Button>
          </TabsContent>

          <TabsContent value="response" className="pt-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {response && (
              <div className="space-y-2">
                <Label>Proxy Response</Label>
                <pre className="w-full h-96 overflow-auto bg-gray-50 p-4 rounded-md border border-gray-200 text-sm font-mono">
                  {response}
                </pre>
              </div>
            )}

            {!response && !error && (
              <div className="text-center py-12 text-gray-500">
                <p>Make a proxy request to see the response here</p>
                <div className="flex items-center justify-center mt-4 space-x-2 text-sm">
                  <span>Original API</span>
                  <ArrowRight className="h-4 w-4" />
                  <span className="font-medium text-blue-600">CORS Proxy</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>Your Browser</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
