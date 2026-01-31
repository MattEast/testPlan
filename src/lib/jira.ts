import { JiraIssue } from "@/types";

interface FetchJiraOptions {
  jql: string;
  username: string;
  password: string;
  instanceUrl?: string;
}

/**
 * Fetch JIRA issues using JQL query
 */
export async function fetchJiraIssues(options: FetchJiraOptions): Promise<JiraIssue[]> {
  try {
    const response = await fetch("/api/jira", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to query JIRA");
    }

    const data = await response.json();
    return data.issues || [];
  } catch (error) {
    console.error("JIRA API error:", error);
    throw error;
  }
}

/**
 * Fetch all epics and their stories from JIRA
 */
export async function fetchJiraProjectData(
  projectName: string,
  username: string,
  password: string,
  instanceUrl?: string
): Promise<JiraIssue[]> {
  try {
    // Fetch all epics
    const epicJql = `project = "${projectName}" AND issuetype = Epic`;
    const epics = await fetchJiraIssues({
      jql: epicJql,
      username,
      password,
      instanceUrl,
    });

    let allIssues: JiraIssue[] = [...epics];

    // Fetch stories for each epic
    for (const epic of epics) {
      try {
        const storyJql = `issuetype = Story AND parent = ${epic.key} ORDER BY created DESC`;
        const stories = await fetchJiraIssues({
          jql: storyJql,
          username,
          password,
          instanceUrl,
        });
        allIssues = [...allIssues, ...stories];
      } catch (error) {
        console.warn(`Failed to fetch stories for epic ${epic.key}:`, error);
        // Continue with other epics even if one fails
      }
    }

    return allIssues;
  } catch (error) {
    console.error("Failed to fetch JIRA project data:", error);
    throw error;
  }
}
