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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ApiKeyData {
  id: string;
  agent_id: string;
  api_key: string;
}

export default function ApiKeySettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [savedApiKeys, setSavedApiKeys] = useState<ApiKeyData[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Define available agents
  const agents = [
    { id: "leadgenie", name: "LeadGenie" },
    // Add more agents as needed
  ];

  // Fetch saved API keys on component mount
  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);

      if (!user || !user.id) {
        console.error("User not authenticated");
        toast({
          title: "Authentication Error",
          description: "Please log in to manage API keys",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("api_keys")
        .select("id, agent_id, api_key")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching API keys:", error);
        toast({
          title: "Error",
          description: `Failed to fetch API keys: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setSavedApiKeys(data);

        // Initialize apiKeys state with saved values
        const keyMap: Record<string, string> = {};
        data.forEach((item) => {
          keyMap[item.agent_id] = item.api_key;
        });
        setApiKeys(keyMap);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast({
        title: "Error",
        description:
          "An unexpected error occurred while fetching your API keys",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeyChange = (agentId: string, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [agentId]: value,
    }));
  };

  const saveApiKeys = async () => {
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save API keys",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Prepare upsert data
      const upsertData = Object.entries(apiKeys).map(([agentId, apiKey]) => ({
        user_id: user.id,
        agent_id: agentId,
        api_key: apiKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Only include entries with non-empty API keys
      const filteredData = upsertData.filter(
        (item) => item.api_key.trim() !== "",
      );

      if (filteredData.length === 0) {
        toast({
          title: "Warning",
          description: "No valid API keys to save",
        });
        return;
      }

      const { error } = await supabase
        .from("api_keys")
        .upsert(filteredData, { onConflict: "user_id,agent_id" });

      if (error) {
        throw new Error(`Failed to save API keys: ${error.message}`);
      }

      // Refresh the keys
      await fetchApiKeys();

      toast({
        title: "Success",
        description: "API keys saved successfully",
      });
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save API keys",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading API keys...</span>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          API Key Management
        </CardTitle>
        <CardDescription>
          Manage your API keys for different AI agents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="info">Information</TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4 pt-4">
            {agents.map((agent) => (
              <div key={agent.id} className="space-y-2">
                <Label
                  htmlFor={`api-key-${agent.id}`}
                  className="text-sm font-medium"
                >
                  {agent.name} API Key
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id={`api-key-${agent.id}`}
                    type="password"
                    value={apiKeys[agent.id] || ""}
                    onChange={(e) =>
                      handleApiKeyChange(agent.id, e.target.value)
                    }
                    placeholder={`Enter your ${agent.name} API key`}
                    className="flex-1"
                  />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="info" className="pt-4">
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-medium">About API Keys</h3>
              <p>
                API keys are required to authenticate with external AI services.
                Your keys are stored securely and used only for the specified AI
                agent requests.
              </p>
              <h4 className="text-md font-medium mt-4">LeadGenie API</h4>
              <p>
                The LeadGenie API requires an API key to access its lead
                generation capabilities. The API endpoint is:
              </p>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                http://13.233.233.139:8080/agents/sales-contact-finder
              </pre>
              <p className="text-sm text-gray-500 mt-2">
                Contact your administrator if you need assistance obtaining an
                API key.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button
          onClick={saveApiKeys}
          disabled={isSaving}
          className="ml-auto bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save API Keys
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
