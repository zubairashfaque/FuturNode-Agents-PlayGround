import { useState } from "react";
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
import { ArrowLeft, Bot, Download, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

export interface Parameter {
  id: string;
  name: string;
  description: string;
  type: "text" | "number" | "select" | "toggle";
  options?: string[];
  defaultValue: string | number | boolean;
}

export interface AgentDetailProps {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  tags?: string[];
  parameters: Parameter[];
  onBack: () => void;
}

export default function AgentDetail({
  id,
  title,
  description,
  icon = <Bot className="h-8 w-8 text-blue-500" />,
  tags = [],
  parameters = [],
  onBack,
}: AgentDetailProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, any>>({});

  // Initialize default parameter values
  useState(() => {
    const defaults: Record<string, any> = {};
    parameters.forEach((param) => {
      defaults[param.id] = param.defaultValue;
    });
    setParamValues(defaults);
  });

  const handleParameterChange = (paramId: string, value: any) => {
    setParamValues((prev) => ({
      ...prev,
      [paramId]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setProgress(0);
    setResult(null);

    // Simulate API call with progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);

    // Simulate API response
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);

      // Example result
      setResult(
        `# ${title} Results\n\nParameters used:\n\n\`\`\`json\n${JSON.stringify(paramValues, null, 2)}\n\`\`\`\n\n## Generated Output\n\nThis is a sample output from the ${title} agent. In a real implementation, this would contain the actual results from the AI agent processing.\n\n\`\`\`\nSample code or structured data would appear here.\n\`\`\``,
      );

      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }, 3000);
  };

  const downloadResults = () => {
    if (!result) return;

    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-results.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  {icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
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
                {description}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Parameters</CardTitle>
              <CardDescription>Customize how the agent behaves</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parameters.map((param) => (
                <div key={param.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={param.id}
                      className="text-sm font-medium text-gray-700"
                    >
                      {param.name}
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <span className="h-4 w-4 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center">
                              ?
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{param.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {param.type === "text" && (
                    <input
                      id={param.id}
                      type="text"
                      value={paramValues[param.id] || ""}
                      onChange={(e) =>
                        handleParameterChange(param.id, e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  {param.type === "number" && (
                    <input
                      id={param.id}
                      type="number"
                      value={paramValues[param.id] || 0}
                      onChange={(e) =>
                        handleParameterChange(param.id, Number(e.target.value))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  {param.type === "select" && param.options && (
                    <select
                      id={param.id}
                      value={paramValues[param.id] || ""}
                      onChange={(e) =>
                        handleParameterChange(param.id, e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {param.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {param.type === "toggle" && (
                    <div className="flex items-center">
                      <input
                        id={param.id}
                        type="checkbox"
                        checked={!!paramValues[param.id]}
                        onChange={(e) =>
                          handleParameterChange(param.id, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={param.id}
                        className="ml-2 text-sm text-gray-600"
                      >
                        {paramValues[param.id] ? "Enabled" : "Disabled"}
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Run Agent"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-full">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Results</CardTitle>
              <CardDescription>
                {result
                  ? "Agent processing complete"
                  : "Run the agent to see results"}
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-[400px]">
                  <div className="w-full max-w-md">
                    <Progress value={progress} className="h-2 mb-4" />
                    <p className="text-center text-sm text-gray-500">
                      Processing request... {progress}%
                    </p>
                  </div>
                </div>
              )}

              {!isLoading && !result && (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                  <Bot className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-center">
                    Configure parameters and run the agent to see results
                  </p>
                </div>
              )}

              {!isLoading && result && (
                <div className="relative">
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[500px] text-sm">
                    <code>{result}</code>
                  </pre>
                </div>
              )}
            </CardContent>
            {result && !isLoading && (
              <CardFooter className="flex justify-end">
                <Button
                  onClick={downloadResults}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Results
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
