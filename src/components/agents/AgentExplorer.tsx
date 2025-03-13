import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Bot,
  Brain,
  Sparkles,
  Zap,
  RefreshCw,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import AgentCard, { AgentCardProps } from "./AgentCard";
import AgentDetail, { AgentDetailProps, Parameter } from "./AgentDetail";
import LeadGenieAgent from "./LeadGenieAgent";

// Sample agent data
const agentData: (Omit<AgentCardProps, "onClick"> & {
  parameters: Parameter[];
})[] = [
  {
    id: "leadgenie",
    title: "LeadGenie",
    description:
      "Find and connect with the right people at target companies by researching companies, analyzing their structure, and identifying decision-makers",
    icon: <Users className="h-8 w-8 text-blue-500" />,
    tags: ["Sales", "Lead Generation", "B2B"],
    parameters: [
      {
        id: "target_company",
        name: "Target Company",
        description: "The company you want to research and find contacts at",
        type: "text",
        defaultValue: "Microsoft",
      },
      {
        id: "our_product",
        name: "Our Product/Service",
        description:
          "Description of your product or service to help tailor the outreach strategy",
        type: "text",
        defaultValue: "AI-powered analytics platform",
      },
    ],
  },
  {
    id: "text-generator",
    title: "Text Generator",
    description:
      "Generate creative and contextually relevant text based on your prompts",
    icon: <Sparkles className="h-8 w-8 text-purple-500" />,
    tags: ["Creative", "Content", "Writing"],
    parameters: [
      {
        id: "prompt",
        name: "Prompt",
        description: "The initial text to guide the generation",
        type: "text",
        defaultValue: "Write a short story about a robot learning to paint",
      },
      {
        id: "length",
        name: "Output Length",
        description: "The approximate length of text to generate",
        type: "select",
        options: ["Short", "Medium", "Long"],
        defaultValue: "Medium",
      },
      {
        id: "creativity",
        name: "Creativity Level",
        description:
          "Higher values produce more creative but potentially less coherent results",
        type: "number",
        defaultValue: 7,
      },
      {
        id: "include_title",
        name: "Generate Title",
        description: "Automatically generate a title for the output",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
  {
    id: "code-assistant",
    title: "Code Assistant",
    description:
      "Generate, explain, and debug code across multiple programming languages",
    icon: <Zap className="h-8 w-8 text-yellow-500" />,
    tags: ["Coding", "Development", "Debugging"],
    parameters: [
      {
        id: "language",
        name: "Programming Language",
        description: "The programming language to work with",
        type: "select",
        options: ["JavaScript", "Python", "Java", "C++", "Go", "Rust"],
        defaultValue: "JavaScript",
      },
      {
        id: "task",
        name: "Task Description",
        description: "Describe what you want the code to do",
        type: "text",
        defaultValue:
          "Create a function that sorts an array of objects by a specific property",
      },
      {
        id: "include_comments",
        name: "Include Comments",
        description: "Add detailed comments explaining the code",
        type: "toggle",
        defaultValue: true,
      },
      {
        id: "complexity",
        name: "Solution Complexity",
        description: "Preferred complexity level of the solution",
        type: "select",
        options: ["Simple", "Intermediate", "Advanced"],
        defaultValue: "Intermediate",
      },
    ],
  },
  {
    id: "data-analyzer",
    title: "Data Analyzer",
    description:
      "Analyze and extract insights from structured and unstructured data",
    icon: <Brain className="h-8 w-8 text-blue-500" />,
    tags: ["Analytics", "Data Science", "Insights"],
    parameters: [
      {
        id: "data_input",
        name: "Data Input",
        description: "Paste your data or describe the dataset",
        type: "text",
        defaultValue:
          "Sales data for Q1-Q4 2023: Q1: 1.2M, Q2: 1.5M, Q3: 1.3M, Q4: 1.8M",
      },
      {
        id: "analysis_type",
        name: "Analysis Type",
        description: "The type of analysis to perform",
        type: "select",
        options: ["Descriptive", "Trend Analysis", "Comparative", "Predictive"],
        defaultValue: "Trend Analysis",
      },
      {
        id: "visualization",
        name: "Include Visualization Code",
        description: "Generate code for data visualization",
        type: "toggle",
        defaultValue: true,
      },
      {
        id: "detail_level",
        name: "Detail Level",
        description: "How detailed should the analysis be",
        type: "select",
        options: ["Basic", "Detailed", "Comprehensive"],
        defaultValue: "Detailed",
      },
    ],
  },
  {
    id: "image-prompt-generator",
    title: "Image Prompt Generator",
    description: "Create detailed prompts for image generation AI models",
    icon: <Bot className="h-8 w-8 text-green-500" />,
    tags: ["Creative", "Images", "Prompting"],
    parameters: [
      {
        id: "concept",
        name: "Basic Concept",
        description: "The core idea for the image",
        type: "text",
        defaultValue: "A futuristic city with flying cars",
      },
      {
        id: "style",
        name: "Art Style",
        description: "The artistic style for the image",
        type: "select",
        options: [
          "Photorealistic",
          "Digital Art",
          "Oil Painting",
          "Watercolor",
          "Sketch",
          "Anime",
        ],
        defaultValue: "Digital Art",
      },
      {
        id: "detail_level",
        name: "Detail Enhancement",
        description: "Add detailed descriptive elements to the prompt",
        type: "toggle",
        defaultValue: true,
      },
      {
        id: "mood",
        name: "Mood/Atmosphere",
        description: "The emotional tone of the image",
        type: "select",
        options: [
          "Cheerful",
          "Mysterious",
          "Serene",
          "Dramatic",
          "Dystopian",
          "Utopian",
        ],
        defaultValue: "Utopian",
      },
    ],
  },
  {
    id: "summarizer",
    title: "Content Summarizer",
    description:
      "Create concise summaries of long-form content while preserving key information",
    icon: <Bot className="h-8 w-8 text-red-500" />,
    tags: ["Productivity", "Research", "Content"],
    parameters: [
      {
        id: "content",
        name: "Content to Summarize",
        description: "The text you want to summarize",
        type: "text",
        defaultValue: "Paste your long content here...",
      },
      {
        id: "length",
        name: "Summary Length",
        description: "How long the summary should be",
        type: "select",
        options: ["Very Short", "Short", "Medium", "Detailed"],
        defaultValue: "Short",
      },
      {
        id: "focus",
        name: "Focus Area",
        description: "What aspects to prioritize in the summary",
        type: "select",
        options: ["Key Points", "Concepts", "Facts", "Narrative", "Balanced"],
        defaultValue: "Balanced",
      },
      {
        id: "bullet_points",
        name: "Use Bullet Points",
        description:
          "Format the summary as bullet points instead of paragraphs",
        type: "toggle",
        defaultValue: false,
      },
    ],
  },
  {
    id: "chatbot-designer",
    title: "Chatbot Designer",
    description:
      "Design conversational flows and responses for chatbots and virtual assistants",
    icon: <Bot className="h-8 w-8 text-indigo-500" />,
    tags: ["Conversation", "Design", "AI"],
    parameters: [
      {
        id: "purpose",
        name: "Chatbot Purpose",
        description: "What is the main purpose of this chatbot",
        type: "select",
        options: [
          "Customer Support",
          "Sales",
          "Information",
          "Entertainment",
          "Personal Assistant",
        ],
        defaultValue: "Customer Support",
      },
      {
        id: "scenario",
        name: "Conversation Scenario",
        description: "Describe a typical conversation scenario",
        type: "text",
        defaultValue: "A customer asking about return policy for a product",
      },
      {
        id: "tone",
        name: "Conversation Tone",
        description: "The tone of voice for the chatbot",
        type: "select",
        options: [
          "Professional",
          "Friendly",
          "Casual",
          "Humorous",
          "Empathetic",
        ],
        defaultValue: "Professional",
      },
      {
        id: "include_fallbacks",
        name: "Include Fallback Responses",
        description: "Generate fallback responses for unknown queries",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
];

export default function AgentExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Filter agents based on search query
  const filteredAgents = agentData.filter((agent) => {
    const query = searchQuery.toLowerCase();
    return (
      agent.title.toLowerCase().includes(query) ||
      agent.description.toLowerCase().includes(query) ||
      agent.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
  };

  const handleBackToList = () => {
    setSelectedAgent(null);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // In a real implementation, you would apply the theme change to the entire app
    // For now, we'll just toggle the state
  };

  const selectedAgentData = agentData.find(
    (agent) => agent.id === selectedAgent,
  );

  // Render LeadGenie agent if selected
  if (selectedAgent === "leadgenie") {
    return (
      <div
        className={`min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-[#f5f5f7] text-gray-900"}`}
      >
        <div className="container mx-auto px-4 py-8">
          <LeadGenieAgent onBack={handleBackToList} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-[#f5f5f7] text-gray-900"}`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">AI Agents Playground</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={`rounded-full ${isDarkMode ? "text-yellow-400 hover:text-yellow-300" : "text-gray-700 hover:text-gray-900"}`}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>

        {!selectedAgent ? (
          <>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 h-10 rounded-full ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className={`rounded-full ${isDarkMode ? "border-gray-700 text-gray-300" : "border-gray-200"}`}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  {...agent}
                  onClick={() => handleAgentSelect(agent.id)}
                />
              ))}

              {filteredAgents.length === 0 && (
                <div className="col-span-3 flex flex-col items-center justify-center py-12">
                  <Bot
                    className={`h-16 w-16 mb-4 ${isDarkMode ? "text-gray-700" : "text-gray-300"}`}
                  />
                  <p
                    className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    No agents found matching your search criteria
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          selectedAgentData && (
            <AgentDetail {...selectedAgentData} onBack={handleBackToList} />
          )
        )}
      </div>
    </div>
  );
}
