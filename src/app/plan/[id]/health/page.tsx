"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PublishedTestPlan } from "@/types";
import { getJiraConfig, getPublishedTestPlans, getTestMoConfig } from "@/lib/storage";
import { fetchJiraProjectData } from "@/lib/jira";

interface TestMoCase {
  id?: number | string;
  title?: string;
  priority?: string;
  custom_priority?: string;
  custom_complexity?: string;
  custom_impact_of_failure?: string;
  custom_likelihood_of_failure?: string;
  custom_can_be_automated?: string;
  custom_automation_status?: string;
  status?: string;
  custom_release?: string;
  custom_issues?: string;
  [key: string]: unknown;
}

export default function ProjectHealthReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<PublishedTestPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"user" | "admin">("user");
  const [jiraIssues, setJiraIssues] = useState<PublishedTestPlan["jiraResults"]>([]);
  const [jiraError, setJiraError] = useState<string>("");
  const [testMoCases, setTestMoCases] = useState<TestMoCase[]>([]);
  const [testMoError, setTestMoError] = useState<string>("");
  const [jiraFilter, setJiraFilter] = useState("");
  const [testMoFilter, setTestMoFilter] = useState("");

  useEffect(() => {
    const loggedIn = sessionStorage.getItem("isLoggedIn");
    const storedRole = sessionStorage.getItem("role");
    setRole(storedRole === "admin" ? "admin" : "user");

    if (!loggedIn) {
      router.push("/login");
      return;
    }

    const plans = getPublishedTestPlans();
    const found = plans.find((p) => p.id === params.id) || null;
    setPlan(found);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    if (!plan) return;

    const jiraConfig = getJiraConfig();
    if (plan.projectName && jiraConfig.email && jiraConfig.apiToken) {
      fetchJiraProjectData(
        plan.projectName,
        jiraConfig.email,
        jiraConfig.apiToken,
        jiraConfig.instanceUrl
      )
        .then(setJiraIssues)
        .catch((err) => {
          setJiraError(err instanceof Error ? err.message : "Failed to load JIRA data");
        });
    } else {
      setJiraError("JIRA is not configured for this project.");
    }

    const testMoConfig = getTestMoConfig();
    if (testMoConfig.baseUrl && testMoConfig.apiKey && testMoConfig.projectId) {
      fetch("/api/testmo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: testMoConfig.baseUrl,
          apiKey: testMoConfig.apiKey,
          endpoint: `/api/v1/projects/${testMoConfig.projectId}/cases`,
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Failed to load TestMo data");
          return data;
        })
        .then((data) => {
          const cases = data?.cases || data?.data || data || [];
          setTestMoCases(Array.isArray(cases) ? cases : []);
        })
        .catch((err) => {
          setTestMoError(err instanceof Error ? err.message : "Failed to load TestMo data");
        });
    } else {
      setTestMoError("TestMo is not configured for this project.");
    }
  }, [plan]);

  const bugCount = useMemo(
    () => jiraIssues.filter((issue) => issue.fields.issuetype.name === "Bug").length,
    [jiraIssues]
  );

  const doneCount = useMemo(
    () => jiraIssues.filter((issue) => issue.fields.status.name === "Done").length,
    [jiraIssues]
  );

  const totalIssues = jiraIssues.length;
  const releaseReadiness = totalIssues > 0 ? Math.round((doneCount / totalIssues) * 100) : 0;

  const automationYes = useMemo(
    () => testMoCases.filter((c) => String(c.custom_automation_status || c.custom_can_be_automated || "").toLowerCase() === "yes").length,
    [testMoCases]
  );

  const testExecutionPassed = useMemo(
    () => testMoCases.filter((c) => String(c.status || "").toLowerCase() === "passed").length,
    [testMoCases]
  );

  const filteredJiraIssues = useMemo(() => {
    const query = jiraFilter.trim().toLowerCase();
    if (!query) return jiraIssues;
    return jiraIssues.filter((issue) =>
      `${issue.key} ${issue.fields.summary}`.toLowerCase().includes(query)
    );
  }, [jiraFilter, jiraIssues]);

  const filteredTestMoCases = useMemo(() => {
    const query = testMoFilter.trim().toLowerCase();
    if (!query) return testMoCases;
    return testMoCases.filter((c) =>
      `${c.id || ""} ${c.title || ""} ${c.custom_issues || ""}`.toLowerCase().includes(query)
    );
  }, [testMoFilter, testMoCases]);

  const downloadCsv = (filename: string, rows: string[][]) => {
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBuildCsv = () => {
    const rows: string[][] = [
      [
        "Case ID",
        "Priority",
        "Complexity",
        "Impact of Failure",
        "Likelihood of Failure",
        "Can be Automated",
        "Automation Status",
        "Status",
        "Release",
        "Issues",
      ],
      ...filteredTestMoCases.map((row) => [
        String(row.id || ""),
        String(row.priority || row.custom_priority || ""),
        String(row.custom_complexity || ""),
        String(row.custom_impact_of_failure || ""),
        String(row.custom_likelihood_of_failure || ""),
        String(row.custom_can_be_automated || ""),
        String(row.custom_automation_status || ""),
        String(row.status || ""),
        String(row.custom_release || ""),
        String(row.custom_issues || ""),
      ]),
    ];
    downloadCsv(`${plan?.testPlanName || "project"}_build_report.csv`, rows);
  };

  const handleDownloadJiraCsv = () => {
    const rows = [
      ["Key", "Summary", "Type", "Status", "Priority"],
      ...filteredJiraIssues.map((issue) => [
        issue.key,
        issue.fields.summary,
        issue.fields.issuetype.name,
        issue.fields.status.name,
        issue.fields.priority?.name || "",
      ]),
    ];
    downloadCsv(`${plan?.testPlanName || "project"}_jira_report.csv`, rows);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <p className="text-zinc-700 dark:text-zinc-300 mb-4">Published plan not found.</p>
          <Link
            href="/dashboard"
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <p className="text-zinc-700 dark:text-zinc-300 mb-4">
            Project Health Report is restricted to admins.
          </p>
          <Link
            href={`/plan/${plan.id}`}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Back to Published Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <main className="flex-1 flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-24 px-10 bg-white dark:bg-black relative">
          <div className="w-full flex flex-col items-center gap-2 mb-8">
            <h1 className="text-4xl font-bold text-black dark:text-zinc-50 text-center">
              Project Health Report
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {plan.testPlanName}
            </p>
            <Link
              href={`/plan/${plan.id}`}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Back to Published Plan
            </Link>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                type="button"
                onClick={handleDownloadJiraCsv}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Download JIRA CSV
              </button>
              <button
                type="button"
                onClick={handleDownloadBuildCsv}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Download Build CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-800 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Print / Save PDF
              </button>
            </div>
          </div>

          <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-zinc-300 dark:border-zinc-700 mb-6">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">Project Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Release Readiness</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {releaseReadiness}%
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Automation</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {automationYes}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Test Execution (Passed)</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {testExecutionPassed}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Bugs Raised</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {bugCount}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">Tech Debt</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {jiraIssues.filter((issue) =>
                    String(issue.fields.summary).toLowerCase().includes("tech debt")
                  ).length}
                </p>
              </div>
            </div>
            {(jiraError || testMoError) && (
              <div className="mt-4 space-y-2">
                {jiraError && (
                  <p className="text-sm text-red-500">{jiraError}</p>
                )}
                {testMoError && (
                  <p className="text-sm text-red-500">{testMoError}</p>
                )}
              </div>
            )}
          </div>

          <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-zinc-300 dark:border-zinc-700">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
              Build Report
            </h2>
            <input
              type="text"
              value={testMoFilter}
              onChange={(e) => setTestMoFilter(e.target.value)}
              placeholder="Filter by case, issue, or title"
              className="w-full mb-4 px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-200 dark:bg-zinc-800">
                    <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">Case ID</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">Priority</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">Complexity</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">Impact of Failure</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">Likelihood of Failure</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">Can be Automated</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">Automation Status</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">Status</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">Release</th>
                    <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTestMoCases.length > 0 ? (
                    filteredTestMoCases.slice(0, 50).map((row, index) => (
                      <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">{row.id}</td>
                        <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">{row.priority || row.custom_priority}</td>
                        <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">{row.custom_complexity}</td>
                        <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">{row.custom_impact_of_failure}</td>
                        <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">{row.custom_likelihood_of_failure}</td>
                        <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">{row.custom_can_be_automated}</td>
                        <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">{row.custom_automation_status}</td>
                        <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">{row.status}</td>
                        <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">{row.custom_release}</td>
                        <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">{row.custom_issues}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="border border-zinc-300 dark:border-zinc-700 px-3 py-4 text-center text-zinc-500">
                        No TestMo data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
