"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Credit Repair CRM Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Welcome to your comprehensive credit repair management system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Clients
          </h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Total clients in your account
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Open Tasks
          </h3>
          <p className="text-3xl font-bold text-green-600 mt-2">0</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tasks in your pipeline
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tasks Due Today
          </h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">0</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Require attention
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Status
          </h3>
          <p className="text-lg font-bold text-green-600 mt-2">Online</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            All systems operational
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Getting Started
        </h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              1. Register/Login
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Visit <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">/login</code> to create your account
            </p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              2. Add Your First Client
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Use the Clients section to add credit repair clients
            </p>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              3. Create Tasks
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Add tasks for credit disputes, document collection, and follow-ups
            </p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              4. Monitor Progress
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Use the dashboard and analytics to track your success
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          🚀 Your CRM system is ready! Start managing credit repair operations efficiently.
        </p>
      </div>
    </div>
  );
}