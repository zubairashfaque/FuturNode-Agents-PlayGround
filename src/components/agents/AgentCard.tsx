import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bot } from "lucide-react";
import { motion } from "framer-motion";

export interface AgentCardProps {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  tags?: string[];
  onClick?: () => void;
}

export default function AgentCard({
  id,
  title,
  description,
  icon = <Bot className="h-8 w-8 text-blue-500" />,
  tags = [],
  onClick,
}: AgentCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card className="h-full bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
              {icon}
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-500">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={onClick}
            variant="ghost"
            className="w-full justify-between hover:bg-blue-50 hover:text-blue-600 group"
          >
            Explore Agent
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
