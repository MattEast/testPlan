"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SavedTestPlan {
  id: string;
  testPlanName: string;
  introduction: string;
  projectDisco: string;
  projectName: string;
  epics: string[];
  jiraResults: any[];
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [savedTestPlans, setSavedTestPlans] = useState<SavedTestPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = sessionStorage.getItem("isLoggedIn");
    const storedUsername = sessionStorage.getItem("username");

    if (!loggedIn) {
      router.push("/login");
      return;
    }

    setIsLoggedIn(true);
    setUsername(storedUsername || "");

    // Load saved test plans from localStorage
    const saved = localStorage.getItem("savedTestPlans");
    if (saved) {
      try {
        setSavedTestPlans(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved test plans", e);
      }
    }

    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("password");
    sessionStorage.removeItem("loginTime");
    router.push("/login");
  };

  const handleLoadTestPlan = (planId: string) => {
    router.push(`/?loadPlanId=${planId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Test Plan Manager
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, <strong>{username}</strong>
            </span>
            <Link
              href="/admin"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Admin
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              Test Plan Dashboard
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Create, manage, and publish your test plans
            </p>
          </div>

          {/* Main Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* New Test Plan Card */}
            <Link href="/">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-500 cursor-pointer p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-lg mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Create New Test Plan
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Start from scratch and create a brand new test plan with JIRA integration
                </p>
              </div>
            </Link>

            {/* Load Test Plan Card */}
            <div
              onClick={() => {
                if (savedTestPlans.length > 0) {
                  // Scroll to saved plans section
                  document
                    .getElementById("saved-plans")
                    ?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-500 cursor-pointer p-8"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-lg mb-4">
                <svg
                  className="w-8 h-8 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Load Saved Test Plan
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {savedTestPlans.length === 0
                  ? "No saved test plans yet. Create one to get started!"
                  : `You have ${savedTestPlans.length} saved test plan${savedTestPlans.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* Saved Test Plans Section */}
          {savedTestPlans.length > 0 && (
            <div id="saved-plans" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Your Saved Test Plans
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedTestPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 hover:border-purple-500 transition-colors"
                  >
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                        {plan.testPlanName}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Updated: {plan.updatedAt}
                      </p>
                    </div>
                    <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
                      <p>
                        <strong>Project:</strong> {plan.projectName || "N/A"}
                      </p>
                      <p>
                        <strong>Epics:</strong> {plan.epics.length}
                      </p>
                      <p>
                        <strong>Stories:</strong>{" "}
                        {plan.jiraResults.filter((r) => r.fields.issuetype.name === "Story")
                          .length}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLoadTestPlan(plan.id)}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                    >
                      Load Plan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {savedTestPlans.length}
              </div>
              <p className="text-gray-600 dark:text-gray-400">Saved Test Plans</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {savedTestPlans.reduce((sum, plan) => sum + plan.epics.length, 0)}
              </div>
              <p className="text-gray-600 dark:text-gray-400">Total Epics</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {savedTestPlans.reduce(
                  (sum, plan) =>
                    sum +
                    plan.jiraResults.filter((r) => r.fields.issuetype.name === "Story")
                      .length,
                  0
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400">Total Stories</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
