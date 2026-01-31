"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getJiraConfig, getTestMoConfig, saveJiraConfig, saveTestMoConfig } from "@/lib/storage";

interface UserDetails {
  username: string;
  email?: string;
  loginTime?: string;
  isAdmin: boolean;
}

interface RegisteredUser {
  username: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

export default function Admin() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);

  // Registration form state
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [registrationError, setRegistrationError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState("");

  // JIRA configuration state
  const [showJiraConfig, setShowJiraConfig] = useState(false);
  const [jiraInstanceUrl, setJiraInstanceUrl] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraApiToken, setJiraApiToken] = useState("");
  const [jiraConfigError, setJiraConfigError] = useState("");
  const [jiraConfigSuccess, setJiraConfigSuccess] = useState("");

  // TestMo configuration state
  const [showTestMoConfig, setShowTestMoConfig] = useState(false);
  const [testMoBaseUrl, setTestMoBaseUrl] = useState("");
  const [testMoApiKey, setTestMoApiKey] = useState("");
  const [testMoProjectId, setTestMoProjectId] = useState("");
  const [testMoConfigError, setTestMoConfigError] = useState("");
  const [testMoConfigSuccess, setTestMoConfigSuccess] = useState("");

  // Report scheduling state
  const [reportScheduleEnabled, setReportScheduleEnabled] = useState(false);
  const [reportScheduleFrequency, setReportScheduleFrequency] = useState<"daily" | "weekly">("weekly");
  const [reportScheduleTime, setReportScheduleTime] = useState("09:00");
  const [reportScheduleEmails, setReportScheduleEmails] = useState("");
  const [reportScheduleMessage, setReportScheduleMessage] = useState("");

  // Reset password state
  const [resetPasswordUsername, setResetPasswordUsername] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = sessionStorage.getItem("isLoggedIn");
    const username = sessionStorage.getItem("username");
    const role = sessionStorage.getItem("role");
    const loginTime = sessionStorage.getItem("loginTime");

    if (!loggedIn || !username) {
      router.push("/login");
      return;
    }

    // Check if user is admin
    if (role !== "admin") {
      router.push("/");
      return;
    }

    setIsLoggedIn(true);
    setUserDetails({
      username: username,
      email: username, // Using username as email since we store it
      loginTime: loginTime || new Date().toLocaleString(),
      isAdmin: role === "admin",
    });

    // Store login time if not already stored
    if (!loginTime) {
      sessionStorage.setItem("loginTime", new Date().toLocaleString());
    }

    // Load registered users from localStorage
    const storedUsers = localStorage.getItem("registeredUsers");
    if (storedUsers) {
      setRegisteredUsers(JSON.parse(storedUsers));
    }

    // Load JIRA configuration from localStorage
    const jiraConfig = getJiraConfig();
    if (jiraConfig.instanceUrl || jiraConfig.email || jiraConfig.apiToken) {
      setJiraInstanceUrl(jiraConfig.instanceUrl || "");
      setJiraEmail(jiraConfig.email || "");
      setJiraApiToken(jiraConfig.apiToken || "");
    }

    // Load TestMo configuration from localStorage
    const testMoConfig = getTestMoConfig();
    if (testMoConfig.baseUrl || testMoConfig.apiKey || testMoConfig.projectId) {
      setTestMoBaseUrl(testMoConfig.baseUrl || "");
      setTestMoApiKey(testMoConfig.apiKey || "");
      setTestMoProjectId(testMoConfig.projectId || "");
    }

    // Load report schedule from localStorage
    const storedSchedule = localStorage.getItem("reportSchedule");
    if (storedSchedule) {
      const schedule = JSON.parse(storedSchedule);
      setReportScheduleEnabled(!!schedule.enabled);
      setReportScheduleFrequency(schedule.frequency || "weekly");
      setReportScheduleTime(schedule.time || "09:00");
      setReportScheduleEmails(schedule.emails || "");
    }

    setLoading(false);
  }, [router]);

  const handleRegisterUser = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegistrationError("");
    setRegistrationSuccess("");

    // Validation
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      setRegistrationError("All fields are required");
      return;
    }

    // Check if username already exists
    if (registeredUsers.some((u) => u.username === newUsername)) {
      setRegistrationError("Username already exists");
      return;
    }

    // Add new user to registeredUsers
    const newUser: RegisteredUser = {
      username: newUsername,
      email: newEmail,
      role: newRole,
      createdAt: new Date().toLocaleString(),
    };

    const updatedUsers = [...registeredUsers, newUser];
    setRegisteredUsers(updatedUsers);
    localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));

    // Also add to main users list (for login validation)
    const usersData = localStorage.getItem("users");
    const usersList = usersData ? JSON.parse(usersData) : [];
    usersList.push({
      username: newUsername,
      password: newPassword,
      role: newRole,
    });
    localStorage.setItem("users", JSON.stringify(usersList));

    // Also store in localStorage for reference
    localStorage.setItem(
      `user_${newUsername}`,
      JSON.stringify({ username: newUsername, password: newPassword, email: newEmail })
    );

    setRegistrationSuccess(`User ${newUsername} registered successfully!`);
    setNewUsername("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("user");

    setTimeout(() => {
      setShowRegistrationForm(false);
      setRegistrationSuccess("");
    }, 2000);
  };

  const handleDeleteUser = (username: string) => {
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    // Remove user from registeredUsers
    const updatedUsers = registeredUsers.filter((u) => u.username !== username);
    setRegisteredUsers(updatedUsers);
    localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));

    // Also remove the user's password data
    localStorage.removeItem(`user_${username}`);

    // Remove from users stored in the main users list (login credentials)
    const usersData = localStorage.getItem("users");
    if (usersData) {
      const users = JSON.parse(usersData);
      const updatedMainUsers = users.filter((u: any) => u.username !== username);
      localStorage.setItem("users", JSON.stringify(updatedMainUsers));
    }
  };

  const handleResetPassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetPasswordError("");
    setResetPasswordSuccess("");

    // Validation
    if (!resetPasswordValue.trim()) {
      setResetPasswordError("New password is required");
      return;
    }

    // Update password in users list
    const usersData = localStorage.getItem("users");
    if (usersData) {
      const users = JSON.parse(usersData);
      const userIndex = users.findIndex((u: any) => u.username === resetPasswordUsername);
      
      if (userIndex !== -1) {
        users[userIndex].password = resetPasswordValue;
        localStorage.setItem("users", JSON.stringify(users));
      }
    }

    // Update password in individual user storage
    localStorage.setItem(
      `user_${resetPasswordUsername}`,
      JSON.stringify({ 
        username: resetPasswordUsername, 
        password: resetPasswordValue,
        email: resetPasswordUsername
      })
    );

    setResetPasswordSuccess(`Password for ${resetPasswordUsername} has been reset successfully!`);
    setResetPasswordValue("");
    setShowResetPassword(false);
    setResetPasswordUsername("");

    setTimeout(() => {
      setResetPasswordSuccess("");
    }, 3000);
  };

  const handleSaveJiraConfig = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setJiraConfigError("");
    setJiraConfigSuccess("");

    // Validation
    if (!jiraInstanceUrl.trim() || !jiraEmail.trim() || !jiraApiToken.trim()) {
      setJiraConfigError("All JIRA configuration fields are required");
      return;
    }

    // Validate URL format
    if (!jiraInstanceUrl.includes("atlassian.net")) {
      setJiraConfigError("Invalid JIRA instance URL");
      return;
    }

    // Save to localStorage
    saveJiraConfig(jiraInstanceUrl.trim(), jiraEmail.trim(), jiraApiToken.trim());

    setJiraConfigSuccess("JIRA configuration saved successfully!");

    setTimeout(() => {
      setJiraConfigSuccess("");
    }, 2000);
  };

  const handleSaveTestMoConfig = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTestMoConfigError("");
    setTestMoConfigSuccess("");

    if (!testMoBaseUrl.trim() || !testMoApiKey.trim() || !testMoProjectId.trim()) {
      setTestMoConfigError("All TestMo configuration fields are required");
      return;
    }

    saveTestMoConfig(testMoBaseUrl.trim(), testMoApiKey.trim(), testMoProjectId.trim());
    setTestMoConfigSuccess("TestMo configuration saved successfully!");

    setTimeout(() => {
      setTestMoConfigSuccess("");
    }, 2000);
  };

  const handleSaveReportSchedule = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReportScheduleMessage("");

    localStorage.setItem(
      "reportSchedule",
      JSON.stringify({
        enabled: reportScheduleEnabled,
        frequency: reportScheduleFrequency,
        time: reportScheduleTime,
        emails: reportScheduleEmails.trim(),
        savedAt: new Date().toLocaleString(),
      })
    );

    setReportScheduleMessage(
      "Schedule saved. Email delivery will activate once server-side email is configured."
    );

    setTimeout(() => {
      setReportScheduleMessage("");
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn || !userDetails) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-700 p-6 shadow-lg overflow-y-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Admin Panel</h1>
        <nav className="space-y-4">
          <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Navigation
          </div>
          <Link
            href="/admin"
            className="block px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition"
          >
            Test Plan
          </Link>
          <Link
            href="/?new=true"
            className="block px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition"
          >
            Create New Test Plan
          </Link>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">Dashboard</h2>
            <p className="text-gray-400">Manage users and system settings</p>
          </div>

          {/* User Details Section */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">
              Current User Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Username Card */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 text-white">
                <div className="text-sm font-semibold text-blue-100 mb-2">
                  Username
                </div>
                <div className="text-2xl font-bold">{userDetails?.username}</div>
              </div>

              {/* Email Card */}
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6 text-white">
                <div className="text-sm font-semibold text-purple-100 mb-2">
                  Email
                </div>
                <div className="text-2xl font-bold">{userDetails?.email}</div>
              </div>

              {/* Login Time Card */}
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 text-white">
                <div className="text-sm font-semibold text-green-100 mb-2">
                  Login Time
                </div>
                <div className="text-sm font-bold">{userDetails?.loginTime}</div>
              </div>

              {/* Role Card */}
              <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg p-6 text-white">
                <div className="text-sm font-semibold text-orange-100 mb-2">
                  Role
                </div>
                <div className="text-2xl font-bold">
                  {userDetails?.isAdmin ? "Admin" : "User"}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="text-gray-400 text-sm font-semibold mb-2">
                Status
              </div>
              <div className="text-2xl font-bold text-green-400">Active</div>
            </div>
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="text-gray-400 text-sm font-semibold mb-2">
                Session
              </div>
              <div className="text-2xl font-bold text-blue-400">Active</div>
            </div>
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="text-gray-400 text-sm font-semibold mb-2">
                Permissions
              </div>
              <div className="text-2xl font-bold text-purple-400">Full</div>
            </div>
          </div>

          {/* User Registration Section */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">User Registration</h3>
              <button
                onClick={() => {
                  setShowRegistrationForm(!showRegistrationForm);
                  setRegistrationError("");
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                {showRegistrationForm ? "Hide Form" : "Register New User"}
              </button>
            </div>

            {/* Registration Form */}
            {showRegistrationForm && (
              <form
                onSubmit={handleRegisterUser}
                className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as "user" | "admin")}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                {registrationError && (
                  <div className="bg-red-900 border border-red-700 rounded-lg p-3 mb-4">
                    <p className="text-red-200 text-sm">{registrationError}</p>
                  </div>
                )}

                {registrationSuccess && (
                  <div className="bg-green-900 border border-green-700 rounded-lg p-3 mb-4">
                    <p className="text-green-200 text-sm">{registrationSuccess}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Register User
                </button>
              </form>
            )}

            {/* Registered Users List */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">
                Registered Users ({registeredUsers.length})
              </h4>
              {registeredUsers.length === 0 ? (
                <p className="text-gray-400 text-sm">No users registered yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-300">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="px-4 py-3 text-left font-semibold">Username</th>
                        <th className="px-4 py-3 text-left font-semibold">Email</th>
                        <th className="px-4 py-3 text-left font-semibold">Role</th>
                        <th className="px-4 py-3 text-left font-semibold">Created At</th>
                        <th className="px-4 py-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredUsers.map((user, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-700 hover:bg-gray-700 transition"
                        >
                          <td className="px-4 py-3 font-medium">{user.username}</td>
                          <td className="px-4 py-3">{user.email}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                user.role === "admin"
                                  ? "bg-orange-900 text-orange-200"
                                  : "bg-blue-900 text-blue-200"
                              }`}
                            >
                              {user.role.charAt(0).toUpperCase() +
                                user.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {user.createdAt}
                          </td>
                          <td className="px-4 py-3 space-x-2 flex">
                            <button
                              onClick={() => {
                                setResetPasswordUsername(user.username);
                                setShowResetPassword(true);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition font-medium"
                            >
                              Reset Password
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.username)}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Reset Password Modal */}
            {showResetPassword && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Reset Password for {resetPasswordUsername}
                  </h3>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={resetPasswordValue}
                        onChange={(e) => setResetPasswordValue(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        placeholder="Enter new password"
                        autoFocus
                      />
                    </div>

                    {resetPasswordError && (
                      <div className="bg-red-900 border border-red-700 rounded-lg p-3">
                        <p className="text-red-200 text-sm">{resetPasswordError}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetPassword(false);
                          setResetPasswordValue("");
                          setResetPasswordUsername("");
                          setResetPasswordError("");
                        }}
                        className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* JIRA Configuration Section */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">JIRA Configuration</h3>
              <button
                onClick={() => {
                  setShowJiraConfig(!showJiraConfig);
                  setJiraConfigError("");
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                {showJiraConfig ? "Hide Config" : "Configure JIRA"}
              </button>
            </div>

            {/* JIRA Configuration Form */}
            {showJiraConfig && (
              <form
                onSubmit={handleSaveJiraConfig}
                className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-700"
              >
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      JIRA Instance URL
                    </label>
                    <input
                      type="text"
                      value={jiraInstanceUrl}
                      onChange={(e) => setJiraInstanceUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="https://yourinstance.atlassian.net"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Example: https://eastmatt.atlassian.net
                    </p>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      JIRA Email
                    </label>
                    <input
                      type="email"
                      value={jiraEmail}
                      onChange={(e) => setJiraEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="your-email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      JIRA API Token
                    </label>
                    <input
                      type="password"
                      value={jiraApiToken}
                      onChange={(e) => setJiraApiToken(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="Enter your API token"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Generate at: https://id.atlassian.com/manage-profile/security/api-tokens
                    </p>
                  </div>
                </div>

                {jiraConfigError && (
                  <div className="bg-red-900 border border-red-700 rounded-lg p-3 mb-4">
                    <p className="text-red-200 text-sm">{jiraConfigError}</p>
                  </div>
                )}

                {jiraConfigSuccess && (
                  <div className="bg-green-900 border border-green-700 rounded-lg p-3 mb-4">
                    <p className="text-green-200 text-sm">{jiraConfigSuccess}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Save JIRA Configuration
                </button>
              </form>
            )}

            {/* Current JIRA Configuration Status */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-300 text-sm mb-3 font-semibold">Current Configuration:</p>
              {jiraInstanceUrl && jiraEmail ? (
                <div className="space-y-2">
                  <p className="text-green-400 text-sm">
                    ✓ Instance URL: <span className="text-gray-400">{jiraInstanceUrl}</span>
                  </p>
                  <p className="text-green-400 text-sm">
                    ✓ Email: <span className="text-gray-400">{jiraEmail}</span>
                  </p>
                  <p className="text-green-400 text-sm">
                    ✓ API Token: <span className="text-gray-400">••••••••••••••••</span>
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No JIRA configuration saved yet.</p>
              )}
            </div>
          </div>

          {/* TestMo Configuration Section */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">TestMo Configuration</h3>
              <button
                onClick={() => {
                  setShowTestMoConfig(!showTestMoConfig);
                  setTestMoConfigError("");
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                {showTestMoConfig ? "Hide Config" : "Configure TestMo"}
              </button>
            </div>

            {showTestMoConfig && (
              <form
                onSubmit={handleSaveTestMoConfig}
                className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-700"
              >
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      TestMo Base URL
                    </label>
                    <input
                      type="text"
                      value={testMoBaseUrl}
                      onChange={(e) => setTestMoBaseUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      placeholder="https://your-testmo-domain"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      TestMo API Key
                    </label>
                    <input
                      type="password"
                      value={testMoApiKey}
                      onChange={(e) => setTestMoApiKey(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Enter your API key"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      TestMo Project ID
                    </label>
                    <input
                      type="text"
                      value={testMoProjectId}
                      onChange={(e) => setTestMoProjectId(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Enter project ID"
                    />
                  </div>
                </div>

                {testMoConfigError && (
                  <div className="bg-red-900 border border-red-700 rounded-lg p-3 mb-4">
                    <p className="text-red-200 text-sm">{testMoConfigError}</p>
                  </div>
                )}

                {testMoConfigSuccess && (
                  <div className="bg-green-900 border border-green-700 rounded-lg p-3 mb-4">
                    <p className="text-green-200 text-sm">{testMoConfigSuccess}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Save TestMo Configuration
                </button>
              </form>
            )}

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-300 text-sm mb-3 font-semibold">Current Configuration:</p>
              {testMoBaseUrl && testMoApiKey && testMoProjectId ? (
                <div className="space-y-2">
                  <p className="text-green-400 text-sm">
                    ✓ Base URL: <span className="text-gray-400">{testMoBaseUrl}</span>
                  </p>
                  <p className="text-green-400 text-sm">
                    ✓ Project ID: <span className="text-gray-400">{testMoProjectId}</span>
                  </p>
                  <p className="text-green-400 text-sm">
                    ✓ API Key: <span className="text-gray-400">••••••••••••••••</span>
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No TestMo configuration saved yet.</p>
              )}
            </div>
          </div>

          {/* Report Scheduling Section */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mt-8">
            <h3 className="text-xl font-bold text-white mb-6">Report Scheduling</h3>
            <form
              onSubmit={handleSaveReportSchedule}
              className="bg-gray-900 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <input
                  id="reportScheduleEnabled"
                  type="checkbox"
                  checked={reportScheduleEnabled}
                  onChange={(e) => setReportScheduleEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="reportScheduleEnabled" className="text-gray-300 text-sm">
                  Enable scheduled health reports
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Frequency
                  </label>
                  <select
                    value={reportScheduleFrequency}
                    onChange={(e) => setReportScheduleFrequency(e.target.value as "daily" | "weekly")}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={reportScheduleTime}
                    onChange={(e) => setReportScheduleTime(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Recipients (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={reportScheduleEmails}
                    onChange={(e) => setReportScheduleEmails(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="team@example.com, qa@example.com"
                  />
                </div>
              </div>

              {reportScheduleMessage && (
                <div className="bg-blue-900 border border-blue-700 rounded-lg p-3 mb-4">
                  <p className="text-blue-200 text-sm">{reportScheduleMessage}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Save Schedule
              </button>
            </form>
            <p className="text-gray-500 text-xs mt-3">
              Email delivery requires server-side mail configuration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  function handleLogout() {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("loginTime");
    router.push("/login");
  }
}
