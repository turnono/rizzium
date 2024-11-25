#!/usr/bin/env node
import { FirebaseSetupAgent } from '../agents/firebase-setup.agent';
import * as readline from 'readline';
import { execSync } from 'child_process';
import { FirebaseProject } from '../interfaces/firebase.interface';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function listProjects(): Promise<FirebaseProject[]> {
  const projectsOutput = execSync('firebase projects:list --json').toString();
  const parsedOutput = JSON.parse(projectsOutput);
  return parsedOutput.result as FirebaseProject[];
}

async function promptForProjectChoice(projects: FirebaseProject[]): Promise<string> {
  console.log('\nAvailable Firebase Projects:');
  console.log('0. Create new project');

  projects.forEach((project, index) => {
    console.log(`${index + 1}. ${project.projectId} (${project.displayName})`);
  });

  const choice = await question('\nChoose a project number or 0 for new project: ');
  const choiceNum = parseInt(choice);

  if (choiceNum === 0) {
    const newProjectName = await question('Enter new project name (lowercase, no spaces): ');
    return newProjectName.toLowerCase();
  } else if (choiceNum > 0 && choiceNum <= projects.length) {
    return projects[choiceNum - 1].projectId;
  } else {
    throw new Error('Invalid choice');
  }
}

async function main() {
  try {
    const agent = new FirebaseSetupAgent();
    await agent.initialize();

    // Get existing projects
    console.log('Fetching available Firebase projects...');
    const projects = await listProjects();

    // Let user choose project or create new one
    const projectName = await promptForProjectChoice(projects);

    console.log(`\nValidating and setting up Firebase project: ${projectName}`);
    const result = await agent.setupFirebase(projectName);

    if (result.success) {
      console.log('✅ Firebase setup completed successfully');
      console.log(result.output);
    } else {
      console.error('❌ Firebase setup failed:', result.error);
      if (!projects.some((p) => p.projectId === projectName)) {
        console.log('\nPlease follow these steps:');
        console.log('1. Go to Firebase Console (https://console.firebase.google.com)');
        console.log(`2. Create a new project named "${projectName}"`);
        console.log('3. Enable required services (Firestore, Auth, Functions)');
        console.log('4. Run setup-app.sh again');
      }
    }
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

main();
