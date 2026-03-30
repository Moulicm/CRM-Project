import React from 'react';
import { Navbar } from '../../components/Navbar';
import { DashboardStats } from '../admin/DashboardStats';

export function ManagementDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Management Dashboard</h1>
          <p className="text-gray-600 mt-2">View admission statistics and analytics</p>
        </div>

        <DashboardStats />
      </div>
    </div>
  );
}
