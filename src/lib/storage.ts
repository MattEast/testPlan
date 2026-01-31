import { JiraConfig, PublishedTestPlan, SavedTestPlan, TestMoConfig } from "@/types";
import { STORAGE_KEYS } from "./constants";

/**
 * Safe localStorage getter with JSON parsing
 */
export function getStorageItem<T>(key: string, defaultValue?: T): T | null {
  if (typeof window === "undefined") return defaultValue || null;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : (defaultValue || null);
  } catch (error) {
    console.error(`Failed to parse localStorage item "${key}":`, error);
    return defaultValue || null;
  }
}

/**
 * Safe localStorage setter with JSON stringifying
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set localStorage item "${key}":`, error);
  }
}

/**
 * Remove localStorage item
 */
export function removeStorageItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

/**
 * Get saved test plans from localStorage
 */
export function getSavedTestPlans(): SavedTestPlan[] {
  return getStorageItem<SavedTestPlan[]>(STORAGE_KEYS.SAVED_TEST_PLANS, []) || [];
}

/**
 * Get published test plans from localStorage
 */
export function getPublishedTestPlans(): PublishedTestPlan[] {
  return (
    getStorageItem<PublishedTestPlan[]>(STORAGE_KEYS.PUBLISHED_TEST_PLANS, []) || []
  );
}

/**
 * Save test plan to localStorage
 */
export function saveTestPlan(plan: SavedTestPlan): void {
  const plans = getSavedTestPlans();
  const existingIndex = plans.findIndex((p) => p.id === plan.id);
  
  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.push(plan);
  }
  
  setStorageItem(STORAGE_KEYS.SAVED_TEST_PLANS, plans);
}

/**
 * Save published test plan to localStorage
 */
export function savePublishedTestPlan(plan: PublishedTestPlan): void {
  const plans = getPublishedTestPlans();
  const existingIndex = plans.findIndex((p) => p.id === plan.id);

  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.push(plan);
  }

  setStorageItem(STORAGE_KEYS.PUBLISHED_TEST_PLANS, plans);
}

/**
 * Delete test plan from localStorage
 */
export function deleteTestPlan(planId: string): void {
  const plans = getSavedTestPlans();
  const filtered = plans.filter((p) => p.id !== planId);
  setStorageItem(STORAGE_KEYS.SAVED_TEST_PLANS, filtered);
}

/**
 * Get JIRA config from localStorage
 */
export function getJiraConfig(): JiraConfig {
  return (
    getStorageItem(STORAGE_KEYS.JIRA_CONFIG, { instanceUrl: "", email: "", apiToken: "" }) ||
    { instanceUrl: "", email: "", apiToken: "" }
  );
}

/**
 * Get TestMo config from localStorage
 */
export function getTestMoConfig(): TestMoConfig {
  return (
    getStorageItem(STORAGE_KEYS.TESTMO_CONFIG, { baseUrl: "", apiKey: "", projectId: "" }) ||
    { baseUrl: "", apiKey: "", projectId: "" }
  );
}

/**
 * Save JIRA config to localStorage
 */
export function saveJiraConfig(instanceUrl: string, email: string, apiToken: string): void {
  setStorageItem(STORAGE_KEYS.JIRA_CONFIG, { instanceUrl, email, apiToken });
}

/**
 * Save TestMo config to localStorage
 */
export function saveTestMoConfig(baseUrl: string, apiKey: string, projectId: string): void {
  setStorageItem(STORAGE_KEYS.TESTMO_CONFIG, { baseUrl, apiKey, projectId });
}
