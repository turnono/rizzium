export interface FirebaseProject {
  projectId: string;
  projectNumber: string;
  displayName: string;
  name: string;
  state: string;
  resources?: {
    hostingSite?: string;
    realtimeDatabaseInstance?: string;
    storageBucket?: string;
  };
}
