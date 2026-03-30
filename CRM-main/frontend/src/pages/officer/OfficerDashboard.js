import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { UserPlus, Users, CheckSquare, FileCheck } from 'lucide-react';
import { ApplicantList } from './ApplicantList';
import { CreateApplicant } from './CreateApplicant';
import { AdmissionWorkflow } from './AdmissionWorkflow';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function OfficerDashboard() {
  const [activeTab, setActiveTab] = useState('applicants');
  const [stats, setStats] = useState({ pending: 0, allocated: 0, confirmed: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API}/applicants`, { withCredentials: true });
      const applicants = response.data;
      setStats({
        pending: applicants.filter(a => a.status === 'pending').length,
        allocated: applicants.filter(a => a.status === 'allocated').length,
        confirmed: applicants.filter(a => a.status === 'confirmed').length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admission Officer Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage applicants and admissions</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Applicants</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <Users className="h-10 w-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Allocated</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.allocated}</p>
                </div>
                <CheckSquare className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmed</p>
                  <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
                </div>
                <FileCheck className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="applicants">
              <Users className="h-4 w-4 mr-2" />
              Applicants
            </TabsTrigger>
            <TabsTrigger value="create">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Applicant
            </TabsTrigger>
            <TabsTrigger value="admissions">
              <FileCheck className="h-4 w-4 mr-2" />
              Admissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applicants" className="mt-6">
            <ApplicantList onRefresh={loadStats} />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <CreateApplicant onSuccess={() => { setActiveTab('applicants'); loadStats(); }} />
          </TabsContent>

          <TabsContent value="admissions" className="mt-6">
            <AdmissionWorkflow />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
