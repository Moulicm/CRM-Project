import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Users, Building2, GraduationCap, Calendar, Settings, PieChart } from 'lucide-react';
import axios from 'axios';
import { InstitutionManager } from './InstitutionManager';
import { ProgramManager } from './ProgramManager';
import { SeatMatrixManager } from './SeatMatrixManager';
import { DashboardStats } from './DashboardStats';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage system configuration and master data</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <PieChart className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="institutions" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Institutions</span>
            </TabsTrigger>
            <TabsTrigger value="programs" className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>Programs</span>
            </TabsTrigger>
            <TabsTrigger value="seats" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Seat Matrix</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" data-testid="admin-dashboard-tab">
            <DashboardStats />
          </TabsContent>

          <TabsContent value="institutions" data-testid="institutions-tab">
            <InstitutionManager />
          </TabsContent>

          <TabsContent value="programs" data-testid="programs-tab">
            <ProgramManager />
          </TabsContent>

          <TabsContent value="seats" data-testid="seats-tab">
            <SeatMatrixManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
