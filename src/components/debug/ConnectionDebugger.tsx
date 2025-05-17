import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConnectionDebugger() {
  const [url, setUrl] = useState(
    "http://13.233.233.139:8080/agents/sales-contact-finder",
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "checking" | "success" | "error"
  >("idle");
  const [method, setMethod] = useState("POST");
  const [headers, setHeaders] = useState(
    JSON.stringify(
      {
        "X-API-Key": "your-api-key-here",
        "Content-Type": "application/json",
      },
      null,
      2,
    ),
  );
  const [body, setBody] = useState(
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResponse("");
    setError("");
    setConnectionStatus("checking");

    try {
      console.log("Testing connection to:", url);
      console.log("Method:", method);
      console.log("Headers:", headers);
      console.log("Body:", body);

      let parsedHeaders;
      try {
        parsedHeaders = JSON.parse(headers);
      } catch (e) {
        throw new Error("Invalid JSON in headers field");
      }

      const requestOptions: RequestInit = {
        method,
        headers: parsedHeaders,
      };

      if (method !== "GET" && method !== "HEAD") {
        try {
          // Validate that body is valid JSON before using it
          JSON.parse(body);
          requestOptions.body = body;
        } catch (e) {
          throw new Error("Invalid JSON in request body");
        }
      }

      const response = await fetch(url, requestOptions);

      // Log response details
      console.log("Response status:", response.status);
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      console.log("Response headers:", responseHeaders);

      // Get response body
      const responseText = await response.text();
      console.log("Response body:", responseText);

      // Format the response for display
      setResponse(
        JSON.stringify(
          {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body:
              responseText.length > 0
                ? tryParseJSON(responseText)
                : "[Empty response]",
          },
          null,
          2,
        ),
      );
      setConnectionStatus("success");
    } catch (err) {
      console.error("Connection test failed:", err);
      setError(err instanceof Error ? err.message : String(err));
      setConnectionStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to try parsing JSON
  const tryParseJSON = (text: string) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Connection Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter API endpoint URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headers">Headers (JSON)</Label>
              <textarea
                id="headers"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter request headers as JSON"
              />
            </div>

            {(method === "POST" || method === "PUT") && (
              <div className="space-y-2">
                <Label htmlFor="body">Body (JSON)</Label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter request body as JSON"
                />
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={testConnection}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Testing Connection..." : "Test Connection"}
              </Button>

              {connectionStatus === "success" && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md">
                  <p className="font-medium">Connection Successful</p>
                  <p className="text-sm">
                    The API endpoint is reachable and responding.
                  </p>
                </div>
              )}

              {connectionStatus === "error" && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                  <p className="font-medium">Connection Failed</p>
                  <p className="text-sm">
                    Unable to connect to the API endpoint. Check the error
                    details in the Response tab.
                  </p>
                </div>
              )}
            </div>
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
                <Label>Response</Label>
                <pre className="w-full h-96 overflow-auto bg-gray-50 p-4 rounded-md border border-gray-200 text-sm font-mono">
                  {response}
                </pre>
              </div>
            )}

            {!response && !error && (
              <div className="text-center py-12 text-gray-500">
                <p>Make a request to see the response here</p>
                <p className="text-xs mt-2">
                  If you're experiencing connection issues, try the following:
                </p>
                <ul className="text-xs mt-2 text-left list-disc pl-6">
                  <li>Check that your API key is valid</li>
                  <li>Verify the API endpoint URL is correct</li>
                  <li>Ensure your network connection is stable</li>
                  <li>Check if the API server is running</li>
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
