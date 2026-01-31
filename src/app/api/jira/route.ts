import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { jql, username, password, instanceUrl } = await request.json();

    if (!jql) {
      return NextResponse.json(
        { error: "JQL query is required" },
        { status: 400 }
      );
    }

    const jiraUrl = instanceUrl || process.env.JIRA_INSTANCE_URL;
    
    // Use provided credentials or fall back to env variables
    const email = username || process.env.JIRA_EMAIL;
    const token = password || process.env.JIRA_API_TOKEN;

    if (!jiraUrl || !email || !token) {
      return NextResponse.json(
        { error: "JIRA credentials not configured" },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${email}:${token}`).toString("base64");

    const url = new URL(`${jiraUrl}/rest/api/3/search/jql`);
    url.searchParams.append("jql", jql);
    url.searchParams.append("maxResults", "100");
    url.searchParams.append("fields", "key,summary,status,assignee,priority,issuetype,parent,customfield_10008");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `JIRA API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("JIRA query error:", error);
    return NextResponse.json(
      { error: "Failed to query JIRA" },
      { status: 500 }
    );
  }
}
