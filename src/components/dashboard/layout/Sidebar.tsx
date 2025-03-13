import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  HelpCircle,
  FolderKanban,
  Bot,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
}

interface SidebarProps {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (label: string) => void;
}

const Sidebar = ({
  activeItem = "Home",
  onItemClick = () => {},
}: SidebarProps) => {
  const location = useLocation();

  const defaultNavItems: NavItem[] = [
    {
      icon: <Home size={20} />,
      label: "Home",
      href: "/",
      isActive: location.pathname === "/",
    },
    {
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
      href: "/dashboard",
      isActive: location.pathname === "/dashboard",
    },
    {
      icon: <FolderKanban size={20} />,
      label: "Projects",
      href: "/projects",
      isActive: location.pathname === "/projects",
    },
    {
      icon: <Bot size={20} />,
      label: "AI Agents",
      href: "/agents",
      isActive: location.pathname === "/agents",
    },
    {
      icon: <Calendar size={20} />,
      label: "Calendar",
      href: "/calendar",
      isActive: location.pathname === "/calendar",
    },
    {
      icon: <Users size={20} />,
      label: "Team",
      href: "/team",
      isActive: location.pathname === "/team",
    },
  ];

  const defaultBottomItems: NavItem[] = [
    {
      icon: <Settings size={20} />,
      label: "Settings",
      href: "/settings",
      isActive: location.pathname === "/settings",
    },
    {
      icon: <HelpCircle size={20} />,
      label: "Debug",
      href: "/debug",
      isActive: location.pathname === "/debug",
    },
  ];

  return (
    <div className="w-[280px] h-full bg-white/80 backdrop-blur-md border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Projects</h2>
        <p className="text-sm text-gray-500">Manage your projects and tasks</p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1.5">
          {defaultNavItems.map((item) => (
            <Link to={item.href} key={item.label}>
              <Button
                variant={"ghost"}
                className={`w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium ${item.label === activeItem || item.isActive ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "text-gray-700 hover:bg-gray-100"}`}
                onClick={() => onItemClick(item.label)}
              >
                <span
                  className={`${item.label === activeItem || item.isActive ? "text-blue-600" : "text-gray-500"}`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        <Separator className="my-4 bg-gray-100" />

        <div className="space-y-3">
          <h3 className="text-xs font-medium px-4 py-1 text-gray-500 uppercase tracking-wider">
            Filters
          </h3>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Active
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            High Priority
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            In Progress
          </Button>
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto border-t border-gray-200">
        {defaultBottomItems.map((item) => (
          <Link to={item.href} key={item.label}>
            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium ${item.label === activeItem || item.isActive ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "text-gray-700 hover:bg-gray-100"} mb-1.5`}
              onClick={() => onItemClick(item.label)}
            >
              <span
                className={`${item.label === activeItem || item.isActive ? "text-blue-600" : "text-gray-500"}`}
              >
                {item.icon}
              </span>
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
