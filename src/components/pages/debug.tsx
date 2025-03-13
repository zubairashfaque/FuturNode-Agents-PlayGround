import React, { useState } from "react";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApiCallLogger from "../debug/ApiCallLogger";
import ConnectionDebugger from "../debug/ConnectionDebugger";
import ProxyService from "../debug/ProxyService";

const DebugPage = () => {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar activeItem="Debug" />
        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">Debug Console</h1>

            <Tabs defaultValue="logs" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                <TabsTrigger value="logs">API Call Logs</TabsTrigger>
                <TabsTrigger value="connection">Connection Tester</TabsTrigger>
                <TabsTrigger value="proxy">CORS Proxy</TabsTrigger>
              </TabsList>

              <TabsContent value="logs" className="mt-4">
                <ApiCallLogger />
              </TabsContent>

              <TabsContent value="connection" className="mt-4">
                <ConnectionDebugger />
              </TabsContent>

              <TabsContent value="proxy" className="mt-4">
                <ProxyService />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DebugPage;
