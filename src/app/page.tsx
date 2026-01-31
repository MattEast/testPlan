"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { JiraIssue, PublishedTestPlan, SavedTestPlan, TestApproachSection, UIState } from "@/types";
import { TEST_APPROACH_OPTIONS, JIRA_BASE_URL, STORAGE_KEYS, SESSION_KEYS } from "@/lib/constants";
import { getSavedTestPlans, getPublishedTestPlans, savePublishedTestPlan, saveTestPlan, deleteTestPlan, getJiraConfig } from "@/lib/storage";
import { fetchJiraProjectData } from "@/lib/jira";
import { generateMarkdown, generateHtml, downloadFile, generateExportFilename } from "@/lib/export";

export default function Home() {
  const router = useRouter();
  
  // User state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  
  // JIRA config
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraApiToken, setJiraApiToken] = useState("");
  const [jiraInstanceUrl, setJiraInstanceUrl] = useState("");
  
  // Test plan data
  const [testPlanName, setTestPlanName] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [projectDisco, setProjectDisco] = useState("");
  const [projectName, setProjectName] = useState("");
  const [epic, setEpic] = useState("");
  const [epics, setEpics] = useState<string[]>([]);
  const [testApproach, setTestApproach] = useState<TestApproachSection[]>([]);
  
  // JIRA results
  const [jiraResults, setJiraResults] = useState<JiraIssue[]>([]);
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraError, setJiraError] = useState("");
  const [jiraConfigMessage, setJiraConfigMessage] = useState("");
  
  // Saved test plans
  const [savedTestPlans, setSavedTestPlans] = useState<SavedTestPlan[]>([]);
  const [publishedTestPlans, setPublishedTestPlans] = useState<PublishedTestPlan[]>([]);
  
  // Save modal state
  const [saveTestPlanName, setSaveTestPlanName] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  
  // Publish state
  const [publishFormat, setPublishFormat] = useState<"markdown" | "html">("markdown");
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Update section state
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [sectionDetails, setSectionDetails] = useState("");
  
  // Consolidated UI state
  const [uiState, setUiState] = useState<UIState>({
    nameForm: true,
    title: false,
    introductionForm: false,
    projectDiscoForm: false,
    projectNameForm: false,
    testApproachForm: false,
    epicForm: false,
    testPlan: false,
    saveModal: false,
    loadModal: false,
    publishModal: false,
    updateSectionModal: false,
    openModal: false,
  });

  // Helper to update UI state
  const updateUiState = (updates: Partial<UIState>) => {
    setUiState((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = sessionStorage.getItem(SESSION_KEYS.IS_LOGGED_IN);
    const storedUsername = sessionStorage.getItem(SESSION_KEYS.USERNAME);
    const storedPassword = sessionStorage.getItem(SESSION_KEYS.PASSWORD);
    const storedRole = sessionStorage.getItem(SESSION_KEYS.ROLE);

    if (!loggedIn) {
      router.push("/login");
    } else {
      setIsLoggedIn(true);
      setUsername(storedUsername || "");
      setPassword(storedPassword || "");
      setRole(storedRole === "admin" ? "admin" : "user");
    }

    // Load JIRA configuration from localStorage if available
    const jiraConfig = getJiraConfig();
    if (jiraConfig.instanceUrl || jiraConfig.email || jiraConfig.apiToken) {
      setJiraInstanceUrl(jiraConfig.instanceUrl || "");
      setJiraEmail(jiraConfig.email || "");
      setJiraApiToken(jiraConfig.apiToken || "");
    }

    // Load saved test plans from localStorage
    const plans = getSavedTestPlans();
    setSavedTestPlans(plans);

    // Load published test plans from localStorage
    const publishedPlans = getPublishedTestPlans();
    setPublishedTestPlans(publishedPlans);

    // Check if loadPlanId is in query params
    const params = new URLSearchParams(window.location.search);
    const loadPlanId = params.get("loadPlanId");
    if (loadPlanId && plans.length > 0) {
      const plan = plans.find((p) => p.id === loadPlanId);
      if (plan) {
        setTestPlanName(plan.testPlanName);
        setIntroduction(plan.introduction);
        setProjectDisco(plan.projectDisco);
        setProjectName(plan.projectName);
        setTestApproach(plan.testApproach || []);
        setEpics(plan.epics);
        setJiraResults(plan.jiraResults);
        updateUiState({ nameForm: false, testPlan: true });
      }
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEYS.IS_LOGGED_IN);
    sessionStorage.removeItem(SESSION_KEYS.USERNAME);
    sessionStorage.removeItem(SESSION_KEYS.PASSWORD);
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

    // Save to localStorage using utility
    saveTestPlan(newTestPlan);
    
    // Update local state
    let updatedPlans = [...savedTestPlans];
    if (existingIndex >= 0) {
      updatedPlans[existingIndex] = newTestPlan;
      setSaveSuccess(`Test plan "${saveTestPlanName}" updated!`);
    } else {
      updatedPlans = [...updatedPlans, newTestPlan];
      setSaveSuccess(`Test plan "${saveTestPlanName}" saved!`);
    }
    setSavedTestPlans(updatedPlans);
    setSaveTestPlanName("");
    setTimeout(() => {
      updateUiState({ saveModal: false });
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
      updateUiState({ loadModal: false, testPlan: true });
    }
  };

  const handleDeleteTestPlan = (planId: string) => {
    deleteTestPlan(planId);
    const updatedPlans = savedTestPlans.filter((p) => p.id !== planId);
    setSavedTestPlans(updatedPlans);
  };

  const handlePublishPlan = () => {
    if (role !== "admin") {
      alert("Publishing is restricted to admins.");
      return;
    }
    const publishedPlan: PublishedTestPlan = {
      id: Date.now().toString(),
      testPlanName: testPlanName || "Untitled Test Plan",
      introduction,
      projectDisco,
      projectName,
      testApproach,
      epics,
      jiraResults,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      publishedAt: new Date().toLocaleString(),
    };

    savePublishedTestPlan(publishedPlan);
    setPublishedTestPlans((prev) => [...prev, publishedPlan]);
    router.push(`/plan/${publishedPlan.id}`);
  };

  const handleOpenPublishedPlan = (planId: string) => {
    updateUiState({ openModal: false });
    router.push(`/plan/${planId}`);
  };

  const jiraBrowseBaseUrl = jiraInstanceUrl
    ? `${jiraInstanceUrl.replace(/\/$/, "")}/browse/`
    : JIRA_BASE_URL;

  const isAdmin = role === "admin";

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
    updateUiState({
      nameForm: true,
      title: false,
      introductionForm: false,
      projectDiscoForm: false,
      projectNameForm: false,
      testApproachForm: false,
      epicForm: false,
      testPlan: false,
    });
  };

  const handleCreateTestPlanWithName = (name: string) => {
    setTestPlanName(name);
    updateUiState({ nameForm: false, testPlan: true });
  };



  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      // Re-fetch JIRA data to ensure latest version
      const emailToUse = jiraEmail || username;
      const tokenToUse = jiraApiToken || password;
      
      const allIssues = await fetchJiraProjectData(projectName, emailToUse, tokenToUse, jiraInstanceUrl);
      setJiraResults(allIssues);
      
      // Generate and download the file
      const testPlanData = {
        testPlanName,
        introduction,
        projectDisco,
        projectName,
        testApproach,
        epics,
        jiraResults: allIssues,
      };
      
      const content = publishFormat === "markdown" 
        ? generateMarkdown(testPlanData)
        : generateHtml(testPlanData);
      
      const filename = generateExportFilename(testPlanName, publishFormat);
      const mimeType = publishFormat === "markdown" ? "text/markdown" : "text/html";
      
      downloadFile(content, filename, mimeType);
      updateUiState({ publishModal: false });
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
      handleCreateTestPlanWithName(testPlanName);
    }
  };

  const handleIntroductionSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (introduction.trim()) {
      updateUiState({
        introductionForm: false,
        testPlan: true,
        projectDiscoForm: false,
        projectNameForm: false,
        testApproachForm: false,
        epicForm: false,
        title: false,
      });
    }
  };

  const handleOpenIntroductionForm = () => {
    updateUiState({
      introductionForm: true,
      testPlan: false,
      projectDiscoForm: false,
      projectNameForm: false,
      testApproachForm: false,
      epicForm: false,
      title: false,
    });
  };

  const handleProjectDiscoSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateUiState({
      projectDiscoForm: false,
      testPlan: true,
      projectNameForm: false,
      introductionForm: false,
      testApproachForm: false,
      epicForm: false,
      title: false,
    });
  };

  const handleOpenProjectDiscoForm = () => {
    updateUiState({
      projectDiscoForm: true,
      testPlan: false,
      projectNameForm: false,
      introductionForm: false,
      testApproachForm: false,
      epicForm: false,
      title: false,
    });
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
    updateUiState({
      testApproachForm: false,
      testPlan: true,
      projectDiscoForm: false,
      projectNameForm: false,
      introductionForm: false,
      epicForm: false,
      title: false,
    });
  };

  const handleOpenTestApproachForm = () => {
    updateUiState({
      testApproachForm: true,
      testPlan: false,
      projectDiscoForm: false,
      projectNameForm: false,
      introductionForm: false,
      epicForm: false,
      title: false,
    });
  };

  const handleUpdateSection = (index: number) => {
    setSelectedSectionIndex(index);
    setSectionDetails(testApproach[index].details);
    updateUiState({ updateSectionModal: true });
  };

  const handleSaveSectionDetails = () => {
    if (selectedSectionIndex !== null) {
      const updatedApproach = [...testApproach];
      updatedApproach[selectedSectionIndex].details = sectionDetails;
      setTestApproach(updatedApproach);
      updateUiState({ updateSectionModal: false });
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
    updateUiState({ epicForm: false });
    setJiraLoading(true);
    setJiraError("");
    setJiraResults([]);

    try {
      // Use JIRA credentials if available, otherwise use user credentials
      const emailToUse = jiraEmail || username;
      const tokenToUse = jiraApiToken || password;

      const allIssues = await fetchJiraProjectData(projectName, emailToUse, tokenToUse, jiraInstanceUrl);
      setJiraResults(allIssues);
      updateUiState({ testPlan: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error querying JIRA";
      setJiraError(errorMessage);
      updateUiState({ testPlan: true });
    } finally {
      setJiraLoading(false);
    }
  };

  const handleAddMoreEpics = () => {
    if (!jiraEmail.trim() || !jiraApiToken.trim()) {
      setJiraConfigMessage("Please configure JIRA in Admin before adding epics.");
      return;
    }
    setJiraConfigMessage("");
    setEpic("");
    updateUiState({ testPlan: false, epicForm: true });
  };

  const shouldShowAddSections =
    !introduction ||
    !projectName ||
    !projectDisco ||
    testApproach.length === 0 ||
    epics.length === 0;

  const handleAddProjectDisco = () => {
    setProjectDisco("");
    updateUiState({
      testPlan: false,
      projectDiscoForm: true,
      projectNameForm: false,
      introductionForm: false,
      testApproachForm: false,
      epicForm: false,
      title: false,
    });
  };

  const handleProjectDiscoCancel = () => {
    setProjectDisco("");
    updateUiState({ projectDiscoForm: false, testPlan: true });
  };
  const handleProjectNameSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (projectName.trim()) {
      updateUiState({
        projectNameForm: false,
        testPlan: true,
        projectDiscoForm: false,
        introductionForm: false,
        testApproachForm: false,
        epicForm: false,
        title: false,
      });
    }
  };

  const handleOpenProjectNameForm = () => {
    updateUiState({
      projectNameForm: true,
      testPlan: false,
      projectDiscoForm: false,
      introductionForm: false,
      testApproachForm: false,
      epicForm: false,
      title: false,
    });
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
    updateUiState({
      nameForm: true,
      title: false,
      introductionForm: false,
      projectDiscoForm: false,
      projectNameForm: false,
      testApproachForm: false,
      epicForm: false,
      testPlan: false,
    });
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
            {uiState.testPlan && (
              <div className="mb-6">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-3">
                  Test Plan Options
                </p>
                <nav className="space-y-2">
                  <button
                    onClick={() => updateUiState({ loadModal: true })}
                    className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Load Draft
                  </button>
                  <button
                    onClick={() => updateUiState({ publishModal: true })}
                    className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Download Test Plan
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => updateUiState({ openModal: true })}
                      className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                      </svg>
                      Open Plan
                    </button>
                  )}
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
        {uiState.nameForm && (
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
                Save
              </button>
            </form>
          </div>
        )}

        {uiState.title && (
          <div className="flex flex-col items-center justify-center gap-8 w-full">
            <h1 className="text-4xl font-bold text-black dark:text-zinc-50 text-center">
              Test Plan for {testPlanName}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 animate-pulse">
              Loading...
            </p>
          </div>
        )}

        {!uiState.nameForm && !uiState.title && !uiState.introductionForm && !uiState.projectNameForm && !uiState.projectDiscoForm && !uiState.testApproachForm && !uiState.epicForm && testPlanName && !uiState.testPlan && (
          <div className="flex flex-col items-center gap-8 w-full max-w-md">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              What would you like to add first?
            </h1>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleOpenTestApproachForm}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Add Test Approach
              </button>
              <button
                onClick={handleOpenIntroductionForm}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Add Introduction
              </button>
            </div>
          </div>
        )}

        {uiState.introductionForm && (
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
                Save
              </button>
            </form>
          </div>
        )}

        {uiState.projectDiscoForm && (
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
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {uiState.testApproachForm && (
          <div className="flex flex-col items-center gap-8 w-full max-w-md">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Select Test Approach
            </h1>
            <div className="w-full flex flex-col gap-4">
              {TEST_APPROACH_OPTIONS.map((option) => (
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
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {uiState.projectNameForm && (
          <div className="flex flex-col items-center gap-8 w-full max-w-md">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Enter Project Name
            </h1>
            <form onSubmit={handleProjectNameSubmit} className="w-full flex flex-col gap-4">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
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

        {uiState.epicForm && (
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

        {uiState.testPlan && (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <div className="w-full flex flex-col items-center gap-4">
              <h1 className="text-4xl font-bold text-black dark:text-zinc-50 text-center">
                Test Plan for {testPlanName}
              </h1>
            </div>

            {/* Project Name Section */}
            {projectName && (
              <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-green-300 dark:border-green-700">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                    Project
                  </h2>
                  <button
                    onClick={handleOpenProjectNameForm}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded font-medium"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300">
                  <strong>Project Name:</strong> {projectName}
                </p>
              </div>
            )}

            {/* Introduction Section */}
            {introduction && (
              <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-blue-300 dark:border-blue-700">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                    Introduction
                  </h2>
                  <button
                    onClick={handleOpenIntroductionForm}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded font-medium"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {introduction}
                </p>
              </div>
            )}

            {/* Project Discovery Section */}
            {projectDisco && (
              <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-purple-300 dark:border-purple-700">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                    Project Discovery
                  </h2>
                  <button
                    onClick={handleOpenProjectDiscoForm}
                    className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded font-medium"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {projectDisco}
                </p>
              </div>
            )}

            {/* Test Approach Section */}
            {testApproach.length > 0 && (
              <div className="w-full bg-gray-50 dark:bg-zinc-800 p-6 rounded-lg mb-6">
                <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                  Test Approach
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

            {/* Epics Section */}
            {epics.length > 0 && (
              <div className="w-full bg-zinc-100 dark:bg-zinc-900 p-6 rounded-lg border border-red-300 dark:border-red-700">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                    Epics
                  </h2>
                  <button
                    onClick={handleAddMoreEpics}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded font-medium"
                  >
                    Edit
                  </button>
                </div>
                <ul className="list-disc list-inside space-y-2">
                  {epics.map((epic, index) => (
                    <li key={index} className="text-zinc-700 dark:text-zinc-300">
                      {epic}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* JIRA Results Section */}
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
                                        href={`${jiraBrowseBaseUrl}${epic.key}`}
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
                                      href={`${jiraBrowseBaseUrl}${story.key}`}
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

            {/* Add Sections Options */}
            {shouldShowAddSections && (
              <div className="w-full bg-zinc-50 dark:bg-zinc-900 p-6 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
                  Add Sections
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {!introduction && (
                    <button
                      onClick={handleOpenIntroductionForm}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      + Introduction
                    </button>
                  )}
                  {!projectName && (
                    <button
                      onClick={handleOpenProjectNameForm}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      + Project Name
                    </button>
                  )}
                  {!projectDisco && (
                    <button
                      onClick={handleOpenProjectDiscoForm}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      + Project Discovery
                    </button>
                  )}
                  {testApproach.length === 0 && (
                    <button
                      onClick={handleOpenTestApproachForm}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      + Test Approach
                    </button>
                  )}
                  {epics.length === 0 && (
                    <button
                      onClick={handleAddMoreEpics}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      + Epics
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 w-full">
              {jiraConfigMessage && (
                <p className="text-sm text-red-500 font-medium">
                  {jiraConfigMessage}
                </p>
              )}
              <button
                onClick={() => updateUiState({ saveModal: true })}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Save Plan
              </button>
              {isAdmin && (
                <button
                  onClick={handlePublishPlan}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Publish Plan
                </button>
              )}
              <button
                onClick={() => updateUiState({ publishModal: true })}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Download Test Plan
              </button>
            </div>
          </div>
        )}

        {/* Save Test Plan Modal */}
        {uiState.saveModal && (
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
                    updateUiState({ saveModal: false });
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

        {/* Load Draft Test Plan Modal */}
        {uiState.loadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                Load Draft Test Plan
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
                          Load Draft
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
                onClick={() => updateUiState({ loadModal: false })}
                className="w-full bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-black dark:text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Download Test Plan Modal */}
        {uiState.publishModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                Download Test Plan
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm">
                Select format and download your test plan. This will re-fetch the latest data from JIRA and create a final version.
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
                  {isPublishing ? "Downloading..." : "Download"}
                </button>
                <button
                  onClick={() => updateUiState({ publishModal: false })}
                  disabled={isPublishing}
                  className="flex-1 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 disabled:opacity-50 text-black dark:text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Open Published Plan Modal */}
        {uiState.openModal && isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
                Open Published Plan
              </h2>
              {publishedTestPlans.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  No published plans found.
                </p>
              ) : (
                <div className="space-y-3 mb-4">
                  {publishedTestPlans.map((plan) => (
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
                            Published: {plan.publishedAt}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenPublishedPlan(plan.id)}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 rounded text-sm transition-colors"
                      >
                        Open Plan
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => updateUiState({ openModal: false })}
                className="w-full bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-black dark:text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}


        {/* Update Section Modal */}
        {uiState.updateSectionModal && selectedSectionIndex !== null && (
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
                    updateUiState({ updateSectionModal: false });
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
