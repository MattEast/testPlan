"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PublishedTestPlan } from "@/types";
import { getJiraConfig, getPublishedTestPlans } from "@/lib/storage";

export default function PublishedPlanPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [plan, setPlan] = useState<PublishedTestPlan | null>(null);
  const [allPlans, setAllPlans] = useState<PublishedTestPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [jiraBrowseBaseUrl, setJiraBrowseBaseUrl] = useState<string | null>(null);
  const [jiraFilter, setJiraFilter] = useState("");

  useEffect(() => {
    const loggedIn = sessionStorage.getItem("isLoggedIn");
    if (!loggedIn) {
      router.push("/login");
      return;
    }

    const jiraConfig = getJiraConfig();
    if (jiraConfig.instanceUrl) {
      setJiraBrowseBaseUrl(`${jiraConfig.instanceUrl.replace(/\/$/, "")}/browse/`);
    }

    const plans = getPublishedTestPlans();
    setAllPlans(plans);
    const found = plans.find((p) => p.id === params.id) || null;
    setPlan(found);
    setLoading(false);
  }, [params.id, router]);

  const filteredJiraIssues = useMemo(() => {
    if (!plan) return [];
    const query = jiraFilter.trim().toLowerCase();
    if (!query) return plan.jiraResults;
    return plan.jiraResults.filter((issue) =>
      `${issue.key} ${issue.fields.summary}`.toLowerCase().includes(query)
    );
  }, [jiraFilter, plan]);

  const relatedVersions = useMemo(() => {
    if (!plan) return [];
    return allPlans
      .filter((p) => p.testPlanName === plan.testPlanName)
      .sort((a, b) => (a.publishedAt > b.publishedAt ? -1 : 1));
  }, [allPlans, plan]);

  const getDiffSummary = (current: PublishedTestPlan, other: PublishedTestPlan) => {
    const changes: string[] = [];
    if (current.introduction !== other.introduction) changes.push("Introduction");
    if (current.projectName !== other.projectName) changes.push("Project Name");
    if (current.projectDisco !== other.projectDisco) changes.push("Project Discovery");
    if (current.testApproach.length !== other.testApproach.length) changes.push("Test Approach");
    if (current.epics.length !== other.epics.length) changes.push("Epics");
    if (current.jiraResults.length !== other.jiraResults.length) changes.push("JIRA Issues");
    return changes.length > 0 ? `Changed: ${changes.join(", ")}` : "No changes";
  };

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

  const handleDownloadJiraCsv = () => {
    if (!plan) return;
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
    downloadCsv(`${plan.testPlanName}_jira.csv`, rows);
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

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <main className="flex-1 flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="flex min-h-screen w-full max-w-2xl flex-col items-center justify-center py-24 px-16 bg-white dark:bg-black relative">
          <div className="w-full flex flex-col items-center gap-4 mb-8">
            <h1 className="text-4xl font-bold text-black dark:text-zinc-50 text-center">
              Test Plan for {plan.testPlanName}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Published: {plan.publishedAt}
            </p>
            <Link
              href="/dashboard"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Back to Dashboard
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
                onClick={() => window.print()}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-800 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Print / Save PDF
              </button>
            </div>
          </div>

          {plan.projectName && (
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-green-300 dark:border-green-700">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Project
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                <strong>Project Name:</strong> {plan.projectName}
              </p>
            </div>
          )}

          {plan.introduction && (
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-blue-300 dark:border-blue-700 mt-6">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Introduction
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {plan.introduction}
              </p>
            </div>
          )}

          {plan.projectDisco && (
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-purple-300 dark:border-purple-700 mt-6">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Project Discovery
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {plan.projectDisco}
              </p>
            </div>
          )}

          {plan.testApproach.length > 0 && (
            <div className="w-full bg-gray-50 dark:bg-zinc-800 p-6 rounded-lg mt-6">
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                Test Approach
              </h2>
              <div className="space-y-3">
                {plan.testApproach.map((section, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-zinc-700"
                  >
                    <h3 className="font-semibold text-black dark:text-white">
                      {section.name}
                    </h3>
                    {section.details && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                        {section.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {plan.epics.length > 0 && (
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-red-300 dark:border-red-700 mt-6">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Epics
              </h2>
              <ul className="list-disc list-inside space-y-2">
                {plan.epics.map((epic, index) => (
                  <li key={index} className="text-zinc-700 dark:text-zinc-300">
                    {epic}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.jiraResults.length > 0 && (
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-zinc-300 dark:border-zinc-700 mt-6">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Related JIRA Issues ({plan.jiraResults.length})
              </h2>
              <input
                type="text"
                value={jiraFilter}
                onChange={(e) => setJiraFilter(e.target.value)}
                placeholder="Filter by key or summary"
                className="w-full mb-4 px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-zinc-200 dark:bg-zinc-800">
                      <th className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-left text-black dark:text-zinc-50 font-semibold">
                        Epic
                      </th>
                      <th className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-left text-black dark:text-zinc-50 font-semibold">
                        User Story
                      </th>
                      <th className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-left text-black dark:text-zinc-50 font-semibold">
                        Story Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJiraIssues
                      .filter((issue) => issue.fields.issuetype.name === "Epic")
                      .map((epic) => {
                        const childStories = filteredJiraIssues.filter(
                          (issue) =>
                            issue.fields.issuetype.name === "Story" &&
                            issue.fields.parent?.key === epic.key
                        );

                        return childStories.length > 0
                          ? childStories.map((story) => (
                              <tr
                                key={story.key}
                                className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <td className="border border-zinc-300 dark:border-zinc-700 px-4 py-2">
                                  <div className="flex flex-col gap-1">
                                    {jiraBrowseBaseUrl ? (
                                      <a
                                        href={`${jiraBrowseBaseUrl}${epic.key}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-purple-700 dark:text-purple-400 hover:underline"
                                      >
                                        {epic.key}
                                      </a>
                                    ) : (
                                      <span className="font-bold text-purple-700 dark:text-purple-400">
                                        {epic.key}
                                      </span>
                                    )}
                                    <span className="text-sm text-purple-700 dark:text-purple-400">
                                      {epic.fields.summary}
                                    </span>
                                  </div>
                                </td>
                                <td className="border border-zinc-300 dark:border-zinc-700 px-4 py-2">
                                  {jiraBrowseBaseUrl ? (
                                    <a
                                      href={`${jiraBrowseBaseUrl}${story.key}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                                    >
                                      {story.key}
                                    </a>
                                  ) : (
                                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                      {story.key}
                                    </span>
                                  )}
                                  <p className="text-sm text-zinc-700 dark:text-zinc-400">
                                    {story.fields.summary}
                                  </p>
                                </td>
                                <td className="border border-zinc-300 dark:border-zinc-700 px-4 py-2">
                                  <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded font-medium">
                                    {story.fields.status.name}
                                  </span>
                                </td>
                              </tr>
                            ))
                          : null;
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {relatedVersions.length > 1 && (
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-zinc-300 dark:border-zinc-700 mt-6">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Version History
              </h2>
              <div className="space-y-3">
                {relatedVersions.map((version) => (
                  <div
                    key={version.id}
                    className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-black dark:text-white">
                        {version.publishedAt}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Epics: {version.epics.length} · Test Approach: {version.testApproach.length} · JIRA: {version.jiraResults.length}
                      </p>
                      {plan && version.id !== plan.id && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {getDiffSummary(plan, version)}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/plan/${version.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-zinc-300 dark:border-zinc-700 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                Project Report
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link
                href={`/plan/${plan.id}/health`}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors text-sm text-center"
              >
                Project Health Report
              </Link>
              <div className="px-4 py-2 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 flex items-center justify-center">
                More options coming soon
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
