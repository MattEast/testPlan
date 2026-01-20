"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    assignee: { displayName: string } | null;
    priority: { name: string } | null;
    issuetype: { name: string };
    parent?: { key: string; fields: { summary: string } };
  };
}

interface SavedTestPlan {
  id: string;
  testPlanName: string;
  introduction: string;
  projectDisco: string;
  projectName: string;
  testApproach: TestApproachSection[];
  epics: string[];
  jiraResults: JiraIssue[];
  createdAt: string;
  updatedAt: string;
}

interface TestApproachSection {
  name: string;
  details: string;
}

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraApiToken, setJiraApiToken] = useState("");
  const [testPlanName, setTestPlanName] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [projectDisco, setProjectDisco] = useState("");
  const [projectName, setProjectName] = useState("");
  const [epic, setEpic] = useState("");
  const [epics, setEpics] = useState<string[]>([]);
  const [jiraResults, setJiraResults] = useState<JiraIssue[]>([]);
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraError, setJiraError] = useState("");
  const [showNameForm, setShowNameForm] = useState(true);
  const [showTitle, setShowTitle] = useState(false);
  const [showIntroductionForm, setShowIntroductionForm] = useState(false);
  const [showProjectDiscoForm, setShowProjectDiscoForm] = useState(false);
  const [showProjectNameForm, setShowProjectNameForm] = useState(false);
  const [showEpicForm, setShowEpicForm] = useState(false);
  const [showTestPlan, setShowTestPlan] = useState(false);
  const [savedTestPlans, setSavedTestPlans] = useState<SavedTestPlan[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTestPlanName, setSaveTestPlanName] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishFormat, setPublishFormat] = useState<"markdown" | "html">("markdown");
  const [isPublishing, setIsPublishing] = useState(false);
  const [showTestApproachForm, setShowTestApproachForm] = useState(false);
  const [testApproachOptions] = useState([
    "End to End Testing",
    "Feature Testing",
    "UAT",
  ]);
  const [testApproach, setTestApproach] = useState<TestApproachSection[]>([]);
  const [showUpdateSectionModal, setShowUpdateSectionModal] = useState(false);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [sectionDetails, setSectionDetails] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = sessionStorage.getItem("isLoggedIn");
    const storedUsername = sessionStorage.getItem("username");
    const storedPassword = sessionStorage.getItem("password");

    if (!loggedIn) {
      router.push("/login");
    } else {
      setIsLoggedIn(true);
      setUsername(storedUsername || "");
      setPassword(storedPassword || "");
    }

    // Load JIRA configuration from localStorage if available
    const jiraConfig = localStorage.getItem("jiraConfig");
    if (jiraConfig) {
      try {
        const config = JSON.parse(jiraConfig);
        setJiraEmail(config.email || "");
        setJiraApiToken(config.apiToken || "");
      } catch (e) {
        console.error("Failed to parse JIRA config", e);
      }
    }

    // Load saved test plans from localStorage
    const saved = localStorage.getItem("savedTestPlans");
    if (saved) {
      try {
        setSavedTestPlans(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved test plans", e);
      }
    }

    // Check if loadPlanId is in query params
    const params = new URLSearchParams(window.location.search);
    const loadPlanId = params.get("loadPlanId");
    if (loadPlanId && saved) {
      try {
        const plans = JSON.parse(saved);
        const plan = plans.find((p: SavedTestPlan) => p.id === loadPlanId);
        if (plan) {
          setTestPlanName(plan.testPlanName);
          setIntroduction(plan.introduction);
          setProjectDisco(plan.projectDisco);
          setProjectName(plan.projectName);
          setTestApproach(plan.testApproach || []);
          setEpics(plan.epics);
          setJiraResults(plan.jiraResults);
          setShowNameForm(false);
          setShowTestPlan(true);
        }
      } catch (e) {
        console.error("Failed to load test plan", e);
      }
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("password");
    router.push("/login");
  };

  const handleSaveTestPlan = () => {
    setSaveError("");
    setSaveSuccess("");

    if (!saveTestPlanName.trim()) {
      setSaveError("Test plan name is required");
      return;
    }

    // Check if plan with this name already exists
    const existingIndex = savedTestPlans.findIndex(
      (plan) => plan.testPlanName === saveTestPlanName
    );

    const newTestPlan: SavedTestPlan = {
      id: existingIndex >= 0 ? savedTestPlans[existingIndex].id : Date.now().toString(),
      testPlanName: saveTestPlanName,
      introduction,
      projectDisco,
      projectName,
      testApproach,
      epics,
      jiraResults,
      createdAt:
        existingIndex >= 0
          ? savedTestPlans[existingIndex].createdAt
          : new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };

    let updatedPlans = [...savedTestPlans];
    if (existingIndex >= 0) {
      updatedPlans[existingIndex] = newTestPlan;
      setSaveSuccess(`Test plan "${saveTestPlanName}" updated!`);
    } else {
      updatedPlans = [...updatedPlans, newTestPlan];
      setSaveSuccess(`Test plan "${saveTestPlanName}" saved!`);
    }

    localStorage.setItem("savedTestPlans", JSON.stringify(updatedPlans));
    setSavedTestPlans(updatedPlans);
    setSaveTestPlanName("");

    setTimeout(() => {
      setShowSaveModal(false);
      setSaveSuccess("");
    }, 2000);
  };

  const handleLoadTestPlan = (planId: string) => {
    const plan = savedTestPlans.find((p) => p.id === planId);
    if (plan) {
      setTestPlanName(plan.testPlanName);
      setIntroduction(plan.introduction);
      setProjectDisco(plan.projectDisco);
      setProjectName(plan.projectName);
      setTestApproach(plan.testApproach || []);
      setEpics(plan.epics);
      setJiraResults(plan.jiraResults);
      setShowLoadModal(false);
      setShowTestPlan(true);
    }
  };

  const handleDeleteTestPlan = (planId: string) => {
    const updatedPlans = savedTestPlans.filter((p) => p.id !== planId);
    localStorage.setItem("savedTestPlans", JSON.stringify(updatedPlans));
    setSavedTestPlans(updatedPlans);
  };

  const handleNewTestPlan = () => {
    setTestPlanName("");
    setIntroduction("");
    setProjectDisco("");
    setProjectName("");
    setTestApproach([]);
    setEpic("");
    setEpics([]);
    setJiraResults([]);
    setJiraError("");
    setShowNameForm(true);
    setShowTitle(false);
    setShowIntroductionForm(false);
    setShowProjectDiscoForm(false);
    setShowProjectNameForm(false);
    setShowTestApproachForm(false);
    setShowEpicForm(false);
    setShowTestPlan(false);
  };

  const generateMarkdown = (): string => {
    let content = `# Test Plan: ${testPlanName}\n\n`;
    content += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    
    if (introduction) {
      content += `## Introduction\n${introduction}\n\n`;
    }
    
    if (projectDisco) {
      content += `## Project Discovery\n${projectDisco}\n\n`;
    }
    
    if (projectName) {
      content += `## Project\n**Project Name:** ${projectName}\n\n`;
    }
    
    if (testApproach.length > 0) {
      content += `## Test Approach\n`;
      testApproach.forEach((section) => {
        content += `### ${section.name}\n`;
        if (section.details) {
          content += `${section.details}\n\n`;
        }
      });
      content += `\n`;
    }
    
    if (epics.length > 0) {
      content += `## Epics\n${epics.map((e) => `- ${e}`).join("\n")}\n\n`;
    }
    
    if (jiraResults.length > 0) {
      content += `## JIRA Integration Results\n\n`;
      
      // Group by epic
      const epicsMap = new Map<string, JiraIssue[]>();
      jiraResults.forEach((issue) => {
        if (issue.fields.issuetype.name === "Epic") {
          epicsMap.set(issue.key, []);
        }
      });
      
      jiraResults.forEach((issue) => {
        if (issue.fields.issuetype.name === "Story" && issue.fields.parent) {
          const parentKey = issue.fields.parent.key;
          if (epicsMap.has(parentKey)) {
            epicsMap.get(parentKey)!.push(issue);
          }
        }
      });
      
      epicsMap.forEach((stories, epicKey) => {
        const epic = jiraResults.find((i) => i.key === epicKey);
        if (epic) {
          content += `### Epic: ${epic.key} - ${epic.fields.summary}\n`;
          content += `**Status:** ${epic.fields.status.name}\n`;
          
          if (stories.length > 0) {
            content += `\n**User Stories:**\n`;
            stories.forEach((story) => {
              content += `- **${story.key}**: ${story.fields.summary}\n`;
              content += `  - Status: ${story.fields.status.name}\n`;
              if (story.fields.assignee) {
                content += `  - Assignee: ${story.fields.assignee.displayName}\n`;
              }
              if (story.fields.priority) {
                content += `  - Priority: ${story.fields.priority.name}\n`;
              }
            });
          } else {
            content += `\n**No user stories found for this epic.**\n`;
          }
          content += `\n`;
        }
      });
    }
    
    return content;
  };

  const generateHtml = (): string => {
    const markdownContent = generateMarkdown();
    
    // Simple markdown to HTML conversion
    let html = markdownContent
      .replace(/# (.*)/g, "<h1>$1</h1>")
      .replace(/## (.*)/g, "<h2>$1</h2>")
      .replace(/### (.*)/g, "<h3>$1</h3>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/- (.*)/g, "<li>$1</li>");
    
    // Wrap lists in <ul> tags
    html = html.replace(/(<li>.*?<\/li>)/gs, (match) => `<ul>${match}</ul>`);
    
    // Split by line and wrap paragraphs
    html = html
      .split("\n")
      .map((line) => {
        if (
          line.startsWith("<h") ||
          line.startsWith("<ul") ||
          line.startsWith("<li") ||
          line.trim() === ""
        ) {
          return line;
        }
        return line ? `<p>${line}</p>` : "";
      })
      .join("\n");
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${testPlanName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
      color: #333;
    }
    h1, h2, h3 { color: #1e40af; margin-top: 20px; }
    h1 { border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
    strong { color: #111; }
    ul { background: #f9f9f9; padding-left: 30px; border-left: 4px solid #1e40af; margin: 10px 0; }
    li { margin: 8px 0; }
    p { margin: 10px 0; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      // Re-fetch JIRA data to ensure latest version
      const emailToUse = jiraEmail || username;
      const tokenToUse = jiraApiToken || password;
      
      const epicJql = `project = "${projectName}" AND issuetype = Epic`;
      
      const epicResponse = await fetch("/api/jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jql: epicJql,
          username: emailToUse,
          password: tokenToUse,
        }),
      });
      
      if (!epicResponse.ok) {
        throw new Error("Failed to fetch epics");
      }
      
      const epicData = await epicResponse.json();
      const epicsFromJira = epicData.issues || [];
      let allIssues: JiraIssue[] = [...epicsFromJira];
      
      for (const epicIssue of epicsFromJira) {
        const storyJql = `issuetype = Story AND parent = ${epicIssue.key} ORDER BY created DESC`;
        
        const storyResponse = await fetch("/api/jira", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jql: storyJql,
            username: emailToUse,
            password: tokenToUse,
          }),
        });
        
        if (storyResponse.ok) {
          const storyData = await storyResponse.json();
          allIssues = [...allIssues, ...(storyData.issues || [])];
        }
      }
      
      setJiraResults(allIssues);
      
      // Generate and download the file
      const content = publishFormat === "markdown" ? generateMarkdown() : generateHtml();
      const filename = `${testPlanName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.${publishFormat === "markdown" ? "md" : "html"}`;
      const blob = new Blob([content], {
        type: publishFormat === "markdown" ? "text/markdown" : "text/html",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowPublishModal(false);
    } catch (error) {
      console.error("Error publishing test plan:", error);
      alert("Error publishing test plan. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleNameSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (testPlanName.trim()) {
      setShowNameForm(false);
      setShowTitle(true);
      setTimeout(() => {
        setShowTitle(false);
        setShowIntroductionForm(true);
      }, 2000);
    }
  };

  const handleIntroductionSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (introduction.trim()) {
      setShowIntroductionForm(false);
      setShowProjectNameForm(true);
    }
  };

  const handleProjectDiscoSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowProjectDiscoForm(false);
    setShowTestApproachForm(true);
  };

  const handleTestApproachSelect = (sectionName: string) => {
    const exists = testApproach.some((section) => section.name === sectionName);
    if (exists) {
      setTestApproach(testApproach.filter((section) => section.name !== sectionName));
    } else {
      setTestApproach([...testApproach, { name: sectionName, details: "" }]);
    }
  };

  const handleTestApproachDone = () => {
    setShowTestApproachForm(false);
    setShowEpicForm(true);
  };

  const handleUpdateSection = (index: number) => {
    setSelectedSectionIndex(index);
    setSectionDetails(testApproach[index].details);
    setShowUpdateSectionModal(true);
  };

  const handleSaveSectionDetails = () => {
    if (selectedSectionIndex !== null) {
      const updatedApproach = [...testApproach];
      updatedApproach[selectedSectionIndex].details = sectionDetails;
      setTestApproach(updatedApproach);
      setShowUpdateSectionModal(false);
      setSelectedSectionIndex(null);
      setSectionDetails("");
    }
  };

  const handleAddNewEpic = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (epic.trim()) {
      setEpics([...epics, epic]);
      setEpic("");
    }
  };

  const handleEpicDone = async () => {
    if (epic.trim()) {
      setEpics([...epics, epic]);
    }
    setShowEpicForm(false);
    setJiraLoading(true);
    setJiraError("");
    setJiraResults([]);

    try {
      // Use JIRA credentials if available, otherwise use user credentials
      const emailToUse = jiraEmail || username;
      const tokenToUse = jiraApiToken || password;

      // First, fetch all epics in the project
      const epicJql = `project = "${projectName}" AND issuetype = Epic`;

      const epicResponse = await fetch("/api/jira", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          jql: epicJql,
          username: emailToUse,
          password: tokenToUse 
        }),
      });

      if (!epicResponse.ok) {
        const error = await epicResponse.json();
        setJiraError(error.error || "Failed to query JIRA for epics");
        setShowTestPlan(true);
        setJiraLoading(false);
        return;
      }

      const epicData = await epicResponse.json();
      const epicsFromJira = epicData.issues || [];

      // Now fetch all stories for each epic
      let allIssues: JiraIssue[] = [...epicsFromJira];

      for (const epicIssue of epicsFromJira) {
        const storyJql = `issuetype = Story AND parent = ${epicIssue.key} ORDER BY created DESC`;

        const storyResponse = await fetch("/api/jira", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            jql: storyJql,
            username: emailToUse,
            password: tokenToUse 
          }),
        });

        if (storyResponse.ok) {
          const storyData = await storyResponse.json();
          allIssues = [...allIssues, ...(storyData.issues || [])];
        }
      }

      setJiraResults(allIssues);
      setShowTestPlan(true);
    } catch (error) {
      setJiraError("Error querying JIRA");
      console.error(error);
      setShowTestPlan(true);
    } finally {
      setJiraLoading(false);
    }
  };

  const handleAddMoreEpics = () => {
    setEpic("");
    setShowTestPlan(false);
    setShowEpicForm(true);
  };

  const handleAddProjectDisco = () => {
    setProjectDisco("");
    setShowTestPlan(false);
    setShowProjectDiscoForm(true);
  };

  const handleProjectDiscoCancel = () => {
    setProjectDisco("");
    setShowProjectDiscoForm(false);
    setShowEpicForm(true);
  };

  const handleProjectNameSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (projectName.trim()) {
      setShowProjectNameForm(false);
      setShowProjectDiscoForm(true);
    }
  };

  const handleStartOver = () => {
    setTestPlanName("");
    setIntroduction("");
    setProjectDisco("");
    setProjectName("");
    setEpic("");
    setEpics([]);
    setJiraResults([]);
    setJiraError("");
    setShowNameForm(true);
    setShowTitle(false);
    setShowIntroductionForm(false);
    setShowProjectDiscoForm(false);
    setShowProjectNameForm(false);
    setShowEpicForm(false);
    setShowTestPlan(false);
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black">
      {/* Sidebar */}
      {isLoggedIn && (
        <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg fixed left-0 top-0 h-screen overflow-y-auto">
          <div className="p-6">
            {/* Logo/Title */}
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-8">
              Test Plan
            </h1>

            {/* User Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-1">
                Current User
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                {username}
              </p>
            </div>

            {/* Main Navigation */}
            <div className="mb-6">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-3">
                Test Plan Actions
              </p>
              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Dashboard
                </Link>
              </nav>
            </div>

            {/* Test Plan Actions (only show when viewing test plan) */}
            {showTestPlan && (
              <div className="mb-6">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-3">
                  Test Plan Options
                </p>
                <nav className="space-y-2">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Plan
                  </button>
                  <button
                    onClick={() => setShowLoadModal(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Load Plan
                  </button>
                  <button
                    onClick={() => setShowPublishModal(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Publish
                  </button>
                  <button
                    onClick={handleNewTestPlan}
                    className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Plan
                  </button>
                </nav>
              </div>
            )}

            {/* System Actions */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-3">
                System
              </p>
              <nav className="space-y-2">
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black ${isLoggedIn ? 'ml-64' : ''}`}>
        <div className="flex min-h-screen w-full max-w-2xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black relative">
        {showNameForm && (
          <div className="flex flex-col items-center gap-8 w-full max-w-md">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Add Test Plan Name
            </h1>
            <form onSubmit={handleNameSubmit} className="w-full flex flex-col gap-4">
              <textarea
                value={testPlanName}
                onChange={(e) => setTestPlanName(e.target.value)}
                placeholder="Enter your test plan name here..."
                className="w-full p-4 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-50 min-h-32"
              />
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Next
              </button>
            </form>
          </div>
        )}

        {showTitle && (
          <div className="flex flex-col items-center justify-center gap-8 w-full">
            <h1 className="text-4xl font-bold text-black dark:text-zinc-50 text-center">
              Test Plan for {testPlanName}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 animate-pulse">
              Loading...
            </p>
          </div>
        )}

        {showIntroductionForm && (
          <div className="flex flex-col items-center gap-8 w-full max-w-md">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Add an Introduction to Test Plan
            </h1>
            <form onSubmit={handleIntroductionSubmit} className="w-full flex flex-col gap-4">
              <textarea
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                placeholder="Enter your introduction text here..."
                className="w-full p-4 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-50 min-h-32"
              />
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Next
              </button>
            </form>
          </div>
        )}

        {showProjectDiscoForm && (
          <div className="flex flex-col items-center gap-8 w-full max-w-md">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Please Add Project Disco if Known
            </h1>
            <form onSubmit={handleProjectDiscoSubmit} className="w-full flex flex-col gap-4">
              <textarea
                value={projectDisco}
                onChange={(e) => setProjectDisco(e.target.value)}
                placeholder="Enter project discovery information here..."
                className="w-full p-4 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-50 min-h-32"
              />
              <div className="flex gap-4 w-full">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={handleProjectDiscoCancel}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Skip
                </button>
              </div>
            </form>
          </div>
        )}

        {showTestApproachForm && (
          <div className="flex flex-col items-center gap-8 w-full max-w-md">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Select Test Approach Sections
            </h1>
            <div className="w-full flex flex-col gap-4">
              {testApproachOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-4 border-2 border-zinc-300 rounded-lg cursor-pointer hover:border-blue-500 dark:border-zinc-700 dark:hover:border-blue-500 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={testApproach.some((section) => section.name === option)}
                    onChange={() => handleTestApproachSelect(option)}
                    className="w-5 h-5 accent-blue-500"
                  />
                  <span className="text-black dark:text-zinc-50 font-medium">{option}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-4 w-full">
              <button
                onClick={handleTestApproachDone}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Done
              </button>
              <button
                onClick={() => setShowTestApproachForm(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {showProjectNameForm && (
          <div className="flex flex-col items-center gap-8 w-full max-w-md">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Enter Project Name
            </h1>
            <form onSubmit={handleProjectNameSubmit} className="w-full flex flex-col gap-4">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter JIRA project name (e.g., TEST, PROJ)..."
                className="w-full p-4 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
              />
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Next
              </button>
            </form>
          </div>
        )}

        {showEpicForm && (
          <div className="flex flex-col items-center gap-8 w-full max-w-md">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Add Epic
            </h1>
            {epics.length > 0 && (
              <div className="w-full bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Epics Added ({epics.length}):
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  {epics.map((e, index) => (
                    <li key={index} className="truncate">• {e}</li>
                  ))}
                </ul>
              </div>
            )}
            <form onSubmit={handleAddNewEpic} className="w-full flex flex-col gap-4">
              <textarea
                value={epic}
                onChange={(e) => setEpic(e.target.value)}
                placeholder="Enter epic information here..."
                className="w-full p-4 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-50 min-h-32"
              />
              <div className="flex gap-4 w-full">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Add New Epic
                </button>
                <button
                  type="button"
                  onClick={handleEpicDone}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </form>
          </div>
        )}

        {showTestPlan && (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
              Test Plan for {testPlanName}
            </h1>
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                Introduction
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {introduction}
              </p>
            </div>
            {projectDisco && (
              <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                  Project Discovery
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {projectDisco}
                </p>
              </div>
            )}
            {jiraLoading && (
              <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg">
                <p className="text-blue-700 dark:text-blue-400 font-semibold">
                  Loading JIRA data...
                </p>
              </div>
            )}
            {jiraError && (
              <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg">
                <p className="text-red-700 dark:text-red-400 font-semibold">
                  {jiraError}
                </p>
              </div>
            )}
            {epics.length > 0 && (
              <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
                  Related JIRA Issues ({jiraResults.length})
                </h2>
                {jiraResults.length === 0 && !jiraLoading ? (
                  <div className="p-8 text-center">
                    <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                      No records found
                    </p>
                  </div>
                ) : (
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
                        {jiraResults
                          .filter((issue) => issue.fields.issuetype.name === "Epic")
                          .map((epic) => {
                            const childStories = jiraResults.filter(
                              (issue) =>
                                issue.fields.issuetype.name === "Story" &&
                                issue.fields.parent?.key === epic.key
                            );

                            return childStories.length > 0 ? (
                              childStories.map((story, index) => (
                                <tr
                                  key={story.key}
                                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                  <td className="border border-zinc-300 dark:border-zinc-700 px-4 py-2">
                                    <div className="flex flex-col gap-1">
                                      <a
                                        href={`https://eastmatt.atlassian.net/browse/${epic.key}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-purple-700 dark:text-purple-400 hover:underline"
                                      >
                                        {epic.key}
                                      </a>
                                      <span className="text-sm text-purple-700 dark:text-purple-400">
                                        {epic.fields.summary}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="border border-zinc-300 dark:border-zinc-700 px-4 py-2">
                                    <a
                                      href={`https://eastmatt.atlassian.net/browse/${story.key}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                                    >
                                      {story.key}
                                    </a>
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
                            ) : null;
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Test Approach Section */}
            {testApproach.length > 0 && (
              <div className="w-full bg-gray-50 dark:bg-zinc-800 p-6 rounded-lg mb-6">
                <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                  Test Approach Sections
                </h2>
                <div className="space-y-3">
                  {testApproach.map((section, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-zinc-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-black dark:text-white">
                          {section.name}
                        </h3>
                        <button
                          onClick={() => handleUpdateSection(index)}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-1 rounded text-sm transition-colors"
                        >
                          Update
                        </button>
                      </div>
                      {section.details && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                          {section.details}
                        </p>
                      )}
                      {!section.details && (
                        <p className="text-gray-400 italic text-sm">No details added yet.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 w-full">
              {!projectDisco && (
                <button
                  onClick={handleAddProjectDisco}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Add Project Discovery
                </button>
              )}
              <button
                onClick={handleAddMoreEpics}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Add More Epics
              </button>
              <button
                onClick={handleStartOver}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Save Test Plan Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                Save Test Plan
              </h2>
              <input
                type="text"
                value={saveTestPlanName}
                onChange={(e) => setSaveTestPlanName(e.target.value)}
                placeholder="Enter a name for this test plan"
                className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white mb-4"
              />
              {saveError && (
                <p className="text-red-500 text-sm mb-4">{saveError}</p>
              )}
              {saveSuccess && (
                <p className="text-green-500 text-sm mb-4">{saveSuccess}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveTestPlan}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setSaveTestPlanName("");
                    setSaveError("");
                  }}
                  className="flex-1 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-black dark:text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Load Test Plan Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                Load Test Plan
              </h2>
              {savedTestPlans.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  No saved test plans found.
                </p>
              ) : (
                <div className="space-y-3 mb-4">
                  {savedTestPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-black dark:text-white">
                            {plan.testPlanName}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Updated: {plan.updatedAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadTestPlan(plan.id)}
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 rounded text-sm transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteTestPlan(plan.id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowLoadModal(false)}
                className="w-full bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-black dark:text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Publish Test Plan Modal */}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                Publish Test Plan
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm">
                Select format and publish your test plan. This will re-fetch the latest data from JIRA and create a final version.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Format
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="markdown"
                      checked={publishFormat === "markdown"}
                      onChange={(e) => setPublishFormat(e.target.value as "markdown" | "html")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-black dark:text-white">Markdown (.md)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="html"
                      checked={publishFormat === "html"}
                      onChange={(e) => setPublishFormat(e.target.value as "markdown" | "html")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-black dark:text-white">HTML (.html)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  {isPublishing ? "Publishing..." : "Publish"}
                </button>
                <button
                  onClick={() => setShowPublishModal(false)}
                  disabled={isPublishing}
                  className="flex-1 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 disabled:opacity-50 text-black dark:text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Section Modal */}
        {showUpdateSectionModal && selectedSectionIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                Update {testApproach[selectedSectionIndex]?.name}
              </h2>
              <textarea
                value={sectionDetails}
                onChange={(e) => setSectionDetails(e.target.value)}
                placeholder="Enter details for this section..."
                className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white mb-4 min-h-32"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveSectionDetails}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowUpdateSectionModal(false);
                    setSelectedSectionIndex(null);
                    setSectionDetails("");
                  }}
                  className="flex-1 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-black dark:text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
