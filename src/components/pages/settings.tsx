import React from "react";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import ApiKeySettings from "../settings/ApiKeySettings";

const Settings = () => {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Settings" />
        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            <ApiKeySettings />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
