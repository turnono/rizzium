# Getting Started with the Rizzium Workspace

This guide will help you set up and work with the Rizzium monorepo workspace, which uses NX, Angular, and Firebase.

## Initial Setup

1. Clone the repository and install dependencies:
   ```bash
   git clone <repo-url>
   cd rizzium
   npm install
   ```

## Creating a New App

### Automated Setup

1. Use the provided setup script:
   ```bash
   chmod +x setup-app.sh
   ./setup-app.sh
   # Follow the prompts to enter your app name
   ```

### Manual Setup (if needed)

```bash
# Create Angular app
nx g @nx/angular:app {app-name} --directory=apps/{app-name}

# Add Firebase
nx g @simondotm/nx-firebase:app firebase --directory=apps/{app-name} --project={app-name}

# Add Firebase function
nx g @simondotm/nx-firebase:function {function-name} --app={app-name}-firebase
```

## Understanding setup-app.sh

The setup script (`setup-app.sh`) automates several important setup steps:

1. **Project Structure Creation**

   - Creates Angular app in `apps/{app-name}/angular/`
   - Sets up Firebase configuration in `apps/{app-name}/firebase/`
   - Initializes Firebase Functions in `apps/{app-name}/functions/`

2. **Configuration Updates**

   - Updates paths in `project.json`
   - Configures ESLint for Angular and Functions
   - Sets up proper TypeScript configuration
   - Initializes Jest testing setup

3. **Firebase Setup**

   - Creates initial Firebase Function (user management)
   - Configures Firebase emulator ports
   - Sets up Firebase hosting
   - Initializes Firebase deployment configuration

4. **CI/CD Setup**
   - Creates GitHub Actions workflow file
   - Sets up proper deployment triggers
   - Configures caching and build steps
   - Sets up Firebase deployment

### Key Features

- **Automatic Directory Structure**

  ```
  apps/
    └── your-app/
        ├── angular/        # Angular application
        ├── firebase/       # Firebase configuration
        └── functions/      # Firebase Functions
  ```

- **Default Firebase Function**

  - Includes user management function
  - Sets up proper Node.js runtime (18)
  - Configures proper deployment settings

- **GitHub Actions Integration**
  - Creates app-specific workflow
  - Sets up proper secret requirements
  - Configures build and deploy steps

### Requirements

Before running setup-app.sh:

1. Firebase project must be created
2. Firebase CLI must be installed
3. GitHub repository must be set up
4. Node.js 18 must be installed

## Firebase Project Setup

1. Go to Firebase Console (https://console.firebase.google.com/)
2. Create a new project with the same name as your app (to secure the domain name)
3. Configure project settings:
   - Set Environment type to production
   - Enable Blaze (pay-as-you-go) plan - required for Functions
4. Enable required Firebase services:
   - Firestore Database
   - Realtime Database
   - Storage
   - Hosting
   - Functions
   - Authentication (enable Google, Anonymous, and Email providers)

## Setting up Firebase Service Account for GitHub Actions

1. Go to the Firebase Console (https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon) > Service accounts
4. Click "Generate New Private Key" button
5. Save the JSON file securely (DO NOT commit this to git)

### Required IAM Roles

Your service account needs exactly these roles:

- Cloud Functions Admin
- Cloud Storage for Firebase Admin
- Firebase Admin
- Firebase Admin SDK Administrator Service Agent
- Firebase Authentication Admin
- Firebase Extensions API Service Agent
- Firebase Extensions Publisher - Extensions Admin
- Firebase Hosting Admin
- Firebase Realtime Database Admin
- Firebase Rules Admin
- Service Account Token Creator
- Service Account User
- Storage Admin
- Storage Object Admin

To add these roles:

1. Go to Google Cloud Console IAM (https://console.cloud.google.com/iam-admin/iam)
2. Find your service account
3. Click the edit (pencil) icon
4. Add each required role
5. Save changes

### Required APIs

Ensure these APIs are enabled in your project:

1. Go to Google Cloud Console: https://console.cloud.google.com/apis/library
2. Search for and enable each API:
   - Cloud Functions API
   - Cloud Storage API
   - Cloud Build API
   - Cloud Billing API
   - Firebase Management API
   - Firebase Extensions API
   - Firebase Hosting API
   - Firebase Rules API
   - Identity and Access Management (IAM) API

Note: The Cloud Billing API is especially important for deployments. To enable it:

1. Go to https://console.cloud.google.com/apis/library/cloudbilling.googleapis.com
2. Click "Enable"
3. Ensure your project is linked to a billing account

## Adding Secrets to GitHub Repository

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets with your app's name prefix:
   - `APPNAME_FIREBASE_PROJECT_ID`: Your Firebase project ID (found in Project Settings)
   - `APPNAME_GCP_SA_KEY`: The service account key JSON

For example, for RizzPOS app:

- `RIZZPOS_FIREBASE_PROJECT_ID`: The Firebase project ID for RizzPOS
- `RIZZPOS_GCP_SA_KEY`: The service account key JSON for RizzPOS

Note: Always prefix secrets with the uppercase app name to avoid conflicts in the monorepo.

## Important Security Notes:

- Never commit service account keys to git
- Each app should have its own service account with minimum required permissions
- Regularly rotate service account keys
- Monitor service account usage in Google Cloud Console

### Serve Locally

```bash
# Serve Angular app
npx nx serve your-app-name

# Run Firebase emulators
nx serve your-app-name-firebase

# Kill emulator ports if stuck
npx kill-port 9099 5003 8278 9323 5004 8178 9199 9299 9324 8279
```

### Build

```bash
# Build Angular app
nx build your-app-name --prod

# Build Firebase components
nx build your-app-name-firebase
nx build your-app-name-functions-function-name
```

### Deploy

```bash
# Login to Firebase
firebase login
firebase use your-app-name

# Deploy
nx deploy your-app-name-firebase
nx deploy your-app-name-functions-function-name
```

## Project Structure

```
apps/
  ├── your-app/
  │   ├── angular/        # Angular application
  │   ├── firebase/       # Firebase configuration
  │   └── functions/      # Firebase Functions
libs/
  └── shared/            # Shared code
      ├── ui/            # UI components (Atomic Design)
      ├── services/      # Shared services
      └── interfaces/    # TypeScript interfaces
```

## Important Security Notes

- Never commit service account keys to git
- Each app should have its own service account with minimum required permissions
- Regularly rotate service account keys
- Monitor service account usage in Google Cloud Console

## Firebase Configuration

After setup:

1. Get Firebase config from Project Settings > General > Your Apps
2. Add config to your app's `firebase-config.ts` file

## Troubleshooting

- If emulators fail to start, use the kill-port command
- Ensure Firebase project name matches exactly what you entered in setup
- Check GitHub Actions secrets are correctly named with app prefix
- Verify Firebase project is on Blaze plan for Functions

## Additional Resources

- [NX Documentation](https://nx.dev)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Angular Documentation](https://angular.io/docs)

## If app is deployed successfully

- start building the app with cursor ai
- deploy often, by making a PR and merging to main

### Managing Firestore Indexes

To get current Firestore indexes from your project:

```bash
# Export current indexes to firestore.indexes.json
firebase firestore:indexes > apps/your-app-name/firebase/firestore.indexes.json

# For specific project/app
firebase --project=your-project-id firestore:indexes > apps/your-app-name/firebase/firestore.indexes.json
```

For RizzPOS example:

```bash
firebase --project=rizzpos firestore:indexes > apps/rizzpos/firebase/firestore.indexes.json
```
