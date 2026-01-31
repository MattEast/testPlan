export interface JiraIssue {
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

export interface TestApproachSection {
  name: string;
  details: string;
}

export interface SavedTestPlan {
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

export interface PublishedTestPlan extends SavedTestPlan {
  publishedAt: string;
}

export interface JiraConfig {
  instanceUrl: string;
  email: string;
  apiToken: string;
}

export interface TestMoConfig {
  baseUrl: string;
  apiKey: string;
  projectId: string;
}

export type ModalType = "save" | "load" | "publish" | "updateSection" | null;

export interface UIState {
  nameForm: boolean;
  title: boolean;
  introductionForm: boolean;
  projectDiscoForm: boolean;
  projectNameForm: boolean;
  testApproachForm: boolean;
  epicForm: boolean;
  testPlan: boolean;
  saveModal: boolean;
  loadModal: boolean;
  publishModal: boolean;
  updateSectionModal: boolean;
  openModal: boolean;
}
