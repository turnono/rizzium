import { SwarmAgentsService } from '../services/swarm-agents.service';
import { AgentType, AgentCapability } from '../interfaces/agent.interface';
import { FirebaseProject } from '../interfaces/firebase.interface';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import * as readline from 'readline';

dotenv.config();

export class FirebaseSetupAgent {
  private agentsService: SwarmAgentsService;
  private requiredApis = [
    'cloudfunctions.googleapis.com',
    'cloudbuild.googleapis.com',
    'storage-api.googleapis.com',
    'cloudbilling.googleapis.com',
    'firebase.googleapis.com',
    'firebaseextensions.googleapis.com',
    'firebasehosting.googleapis.com',
    'firebaserules.googleapis.com',
    'iam.googleapis.com',
    'artifactregistry.googleapis.com',
    'identitytoolkit.googleapis.com',
    'firestore.googleapis.com',
    'firebasedatabase.googleapis.com',
  ];

  private requiredRoles = [
    'roles/cloudfunctions.admin',
    'roles/storage.admin',
    'roles/firebase.admin',
    'roles/firebase.sdkAdminServiceAgent',
    'roles/firebaseauth.admin',
    'roles/firebaseextensions.admin',
    'roles/firebasehosting.admin',
    'roles/firebasedatabase.admin',
    'roles/firebaserules.admin',
    'roles/iam.serviceAccountTokenCreator',
    'roles/iam.serviceAccountUser',
    'roles/storage.objectAdmin',
  ];

  constructor() {
    this.agentsService = new SwarmAgentsService();
  }

  private checkPrerequisites(): { success: boolean; error?: string } {
    try {
      // Check for Firebase CLI
      try {
        execSync('firebase --version', { stdio: 'ignore' });
      } catch {
        return { success: false, error: 'Firebase CLI is not installed. Please run: npm install -g firebase-tools' };
      }

      // Check Firebase authentication
      try {
        execSync('firebase projects:list', { stdio: 'ignore' });
      } catch {
        return { success: false, error: 'Not authenticated with Firebase. Please run: firebase login' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check prerequisites: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async initialize() {
    const firebaseAgent = this.agentsService.addAgent({
      name: 'Firebase Setup Assistant',
      type: AgentType.SPECIALIST,
      model: 'gpt-3.5-turbo',
      capabilities: ['firebase_project_setup', 'iam_role_management', 'research'] as AgentCapability[],
      instructions: `You are a Firebase setup specialist. Your tasks:
        1. Validate the project name format (lowercase, no spaces)
        2. Check if Firebase project exists using 'firebase projects:list'
        3. Create project if needed using 'firebase projects:create'
        4. Initialize Firebase features
        5. Configure project settings`,
    });

    return firebaseAgent;
  }

  private async installGcloudBeta(): Promise<void> {
    try {
      console.log('Installing gcloud beta components...');
      execSync('gcloud components install beta --quiet', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to install gcloud beta components:', error);
      throw error;
    }
  }

  private async enableBilling(projectId: string): Promise<boolean> {
    try {
      await this.installGcloudBeta();

      // Only authenticate if not already authenticated
      try {
        execSync('gcloud auth print-identity-token', { stdio: 'pipe' });
      } catch {
        // Only login if token check fails
        console.log('\n🔑 Authenticating with Google Cloud...');
        execSync('gcloud auth login --update-adc', { stdio: 'inherit' });
      }

      // Check if billing is already enabled
      const billingInfo = execSync(
        `gcloud beta billing projects describe ${projectId} --format="value(billingEnabled)"`,
        { stdio: 'pipe' }
      )
        .toString()
        .trim();

      if (billingInfo === 'true') {
        console.log('✅ Billing is already enabled');
        return true;
      }

      console.log('\n📊 Setting up billing...');

      // Get billing accounts without installing beta again
      const billingAccountsOutput = execSync('gcloud beta billing accounts list --format="json" --quiet', {
        stdio: 'pipe',
      }).toString();
      const accounts = JSON.parse(billingAccountsOutput);

      if (accounts.length === 0) {
        throw new Error('No billing accounts available. Please ensure you have a billing account set up.');
      }

      if (accounts.length === 1) {
        const billingAccount = accounts[0].name;
        console.log(`Using billing account: ${accounts[0].displayName}`);
        execSync(`gcloud beta billing projects link ${projectId} --billing-account=${billingAccount}`, {
          stdio: 'inherit',
        });
        console.log('✅ Billing enabled successfully');
        return true;
      }

      // If multiple accounts, prompt for selection
      console.log('\nAvailable Billing Accounts:');
      accounts.forEach((account, index) => {
        console.log(`${index + 1}. ${account.displayName} (${account.name.split('/').pop()})`);
      });

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question('\nSelect billing account number (1-' + accounts.length + '): ', (input) => {
          rl.close();
          resolve(input.trim());
        });
      });

      const selectedIndex = parseInt(answer) - 1;
      if (selectedIndex >= 0 && selectedIndex < accounts.length) {
        const billingAccount = accounts[selectedIndex].name;
        execSync(`gcloud beta billing projects link ${projectId} --billing-account=${billingAccount}`, {
          stdio: 'inherit',
        });
        console.log('✅ Billing enabled successfully');
        return true;
      } else {
        throw new Error('Invalid billing account selection');
      }
    } catch (error) {
      console.error('Failed to enable billing:', error);
      throw error;
    }
  }

  private async enableRequiredApis(projectId: string) {
    console.log('\nChecking billing status...');
    const billingEnabled = await this.enableBilling(projectId);
    if (!billingEnabled) {
      throw new Error('Billing must be enabled to continue with setup');
    }

    console.log('\nEnabling required APIs...');
    for (const api of this.requiredApis) {
      try {
        console.log(`Enabling ${api}...`);
        execSync(`gcloud services enable ${api} --project=${projectId}`, { stdio: 'inherit' });
      } catch (error) {
        console.error(`Failed to enable ${api}:`, error);
        throw error;
      }
    }
    console.log('✅ All required APIs enabled successfully');
  }

  private async setupIamRoles(projectId: string) {
    console.log('\nSetting up IAM roles...');
    try {
      // Get the default service account
      const serviceAccount = execSync(
        `gcloud iam service-accounts list --project=${projectId} --filter="email ~ ^firebase-adminsdk" --format="value(email)"`
      )
        .toString()
        .trim();

      // Prioritized role batches - critical roles first
      const roleBatches = [
        // Critical roles (first batch)
        ['roles/firebase.admin', 'roles/firebaseauth.admin', 'roles/firebase.sdkAdminServiceAgent'],
        // Essential service roles (second batch)
        ['roles/cloudfunctions.admin', 'roles/firebasedatabase.admin', 'roles/firebaserules.admin'],
        // Additional roles (third batch)
        ['roles/firebasehosting.admin', 'roles/storage.admin', 'roles/firebaseextensions.admin'],
      ];

      // Process each batch with significant delays
      for (let batchIndex = 0; batchIndex < roleBatches.length; batchIndex++) {
        const batch = roleBatches[batchIndex];
        let attempts = 0;
        const maxAttempts = 3;
        const baseDelay = 30000; // 30 seconds base delay

        while (attempts < maxAttempts) {
          try {
            console.log(`\nAssigning critical roles batch ${batchIndex + 1}/${roleBatches.length}...`);

            // Combine all roles in batch into a single command
            const roleBindings = batch.map((role) => `--role=${role}`).join(' ');
            const command = `gcloud projects add-iam-policy-binding ${projectId} --member=serviceAccount:${serviceAccount} ${roleBindings}`;

            execSync(command, { stdio: 'inherit' });
            console.log(`✅ Successfully assigned batch ${batchIndex + 1}`);

            // Success - add long delay before next batch
            if (batchIndex < roleBatches.length - 1) {
              console.log(`Waiting 60 seconds before next batch...`);
              await new Promise((resolve) => setTimeout(resolve, 60000)); // 1 minute between batches
            }
            break;
          } catch (error) {
            const errorStr = String(error);
            if (errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('RATE_LIMIT_EXCEEDED')) {
              attempts++;
              if (attempts < maxAttempts) {
                const delay = baseDelay * Math.pow(2, attempts); // Exponential backoff
                console.log(`\n⚠️  Rate limit hit. Waiting ${delay / 1000} seconds before retry...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
              }
            }
            // If critical first batch fails, throw error
            if (batchIndex === 0) {
              throw new Error('Failed to assign critical roles. Setup cannot continue.');
            }
            // For non-critical batches, log and continue
            console.log(`\n⚠️  Skipping non-critical batch ${batchIndex + 1} after maximum retries...`);
            break;
          }
        }
      }

      console.log('\n✅ IAM roles setup completed');
      return true;
    } catch (error) {
      if (String(error).includes('Failed to assign critical roles')) {
        throw error; // Re-throw critical errors
      }
      console.log('\n⚠️  Some non-critical IAM roles could not be assigned. Setup will continue...');
      return true;
    }
  }

  private async initializeFirebase(projectId: string) {
    console.log('\n📋 Manual Firebase Setup Required:');
    console.log('Please complete these steps in Firebase Console:');
    console.log('1. Go to https://console.firebase.google.com');
    console.log(`2. Select project "${projectId}"`);
    console.log('3. Enable and configure these services:');
    console.log('   - Firestore Database (Native mode)');
    console.log('   - Authentication (enable these providers):');
    console.log('     • Email/Password');
    console.log('     • Google');
    console.log('     • Anonymous');
    console.log('   - Functions');
    console.log('   - Hosting');
    console.log('   - Storage');
    console.log('\nOnce completed, your Firebase project will be ready for use.');

    // Return true since we're just providing instructions
    return true;
  }

  async setupFirebase(projectName: string) {
    try {
      // Check prerequisites first
      const prereqCheck = this.checkPrerequisites();
      if (!prereqCheck.success) {
        return {
          success: false,
          output: 'Prerequisites check failed',
          error: prereqCheck.error,
        };
      }

      // Execute Firebase CLI commands
      try {
        // List Firebase projects
        const projectsOutput = execSync('firebase projects:list --json').toString();
        const parsedOutput = JSON.parse(projectsOutput);
        const projects = parsedOutput.result as FirebaseProject[];

        // Check if project exists
        const projectExists = projects.some((project) => project.projectId === projectName);

        if (!projectExists) {
          console.log(`Project ${projectName} does not exist. Creating project...`);
          try {
            // Create the Firebase project with non-interactive flag
            execSync(`firebase projects:create --non-interactive ${projectName} --display-name="${projectName}"`, {
              stdio: 'inherit',
            });

            console.log('✅ Project created successfully');

            // Enable APIs (which includes billing check)
            await this.enableRequiredApis(projectName);

            // Setup IAM roles
            await this.setupIamRoles(projectName);

            // Initialize Firebase features
            await this.initializeFirebase(projectName);

            return {
              success: true,
              output: `Firebase project ${projectName} created and configured successfully.`,
            };
          } catch (createError) {
            console.error('Failed to create Firebase project:', createError);
            return {
              success: false,
              output: 'Failed to create Firebase project',
              error: createError instanceof Error ? createError.message : String(createError),
            };
          }
        }

        // If project exists, just initialize it
        console.log(`Using existing project: ${projectName}`);

        // Enable APIs (which includes billing check)
        await this.enableRequiredApis(projectName);

        // Setup IAM roles
        await this.setupIamRoles(projectName);

        // Initialize Firebase features
        await this.initializeFirebase(projectName);

        return {
          success: true,
          output: `Firebase project ${projectName} configured successfully.`,
        };
      } catch (error) {
        console.error('Firebase CLI error:', error);
        return {
          success: false,
          output: 'Failed to execute Firebase CLI commands',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    } catch (error) {
      console.error('Firebase setup failed:', error);
      return {
        success: false,
        output: 'Firebase setup failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
