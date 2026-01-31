// Test Approach Options
export const TEST_APPROACH_OPTIONS = [
  "End to End Testing",
  "Feature Testing",
  "UAT",
] as const;

// JIRA Configuration
export const JIRA_BASE_URL = "https://eastmatt.atlassian.net/browse/";

// Storage Keys
export const STORAGE_KEYS = {
  SAVED_TEST_PLANS: "savedTestPlans",
  PUBLISHED_TEST_PLANS: "publishedTestPlans",
  JIRA_CONFIG: "jiraConfig",
  TESTMO_CONFIG: "testmoConfig",
  USERS: "users",
  REGISTERED_USERS: "registeredUsers",
} as const;

// Session Keys
export const SESSION_KEYS = {
  IS_LOGGED_IN: "isLoggedIn",
  USERNAME: "username",
  PASSWORD: "password",
  ROLE: "role",
  LOGIN_TIME: "loginTime",
} as const;

// Modal Types
export const MODAL_TYPES = {
  SAVE: "save",
  LOAD: "load",
  PUBLISH: "publish",
  UPDATE_SECTION: "updateSection",
} as const;

// Form Types
export const FORM_TYPES = {
  NAME: "name",
  INTRODUCTION: "introduction",
  PROJECT_DISCO: "projectDisco",
  PROJECT_NAME: "projectName",
  TEST_APPROACH: "testApproach",
  EPIC: "epic",
} as const;
