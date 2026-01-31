import { JiraIssue, SavedTestPlan, TestApproachSection } from "@/types";

/**
 * Generate markdown content for test plan
 */
export function generateMarkdown(plan: {
  testPlanName: string;
  introduction: string;
  projectDisco: string;
  projectName: string;
  testApproach: TestApproachSection[];
  epics: string[];
  jiraResults: JiraIssue[];
}): string {
  let content = `# Test Plan: ${plan.testPlanName}\n\n`;
  content += `**Generated:** ${new Date().toLocaleString()}\n\n`;

  if (plan.introduction) {
    content += `## Introduction\n${plan.introduction}\n\n`;
  }

  if (plan.projectDisco) {
    content += `## Project Discovery\n${plan.projectDisco}\n\n`;
  }

  if (plan.projectName) {
    content += `## Project\n**Project Name:** ${plan.projectName}\n\n`;
  }

  if (plan.epics.length > 0) {
    content += `## Epics\n${plan.epics.map((e) => `- ${e}`).join("\n")}\n\n`;
  }

  if (plan.testApproach.length > 0) {
    content += `## Test Approach\n`;
    plan.testApproach.forEach((section) => {
      content += `### ${section.name}\n`;
      if (section.details) {
        content += `${section.details}\n\n`;
      }
    });
    content += `\n`;
  }

  if (plan.jiraResults.length > 0) {
    content += generateJiraMarkdown(plan.jiraResults);
  }

  return content;
}

/**
 * Generate JIRA results markdown section
 */
function generateJiraMarkdown(jiraResults: JiraIssue[]): string {
  let content = `## JIRA Integration Results\n\n`;

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

  return content;
}

/**
 * Convert markdown to HTML
 */
function markdownToHtml(markdown: string): string {
  let html = markdown
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

  return html;
}

/**
 * Generate HTML content for test plan
 */
export function generateHtml(plan: {
  testPlanName: string;
  introduction: string;
  projectDisco: string;
  projectName: string;
  testApproach: TestApproachSection[];
  epics: string[];
  jiraResults: JiraIssue[];
}): string {
  const markdownContent = generateMarkdown(plan);
  const html = markdownToHtml(markdownContent);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${plan.testPlanName}</title>
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
}

/**
 * Download file to user's device
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename for test plan export
 */
export function generateExportFilename(
  testPlanName: string,
  format: "markdown" | "html"
): string {
  const date = new Date().toISOString().split("T")[0];
  const extension = format === "markdown" ? "md" : "html";
  return `${testPlanName.replace(/\s+/g, "_")}_${date}.${extension}`;
}
