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
   - Storage
   - Hosting
   - Functions
   - Authentication (enable Google, Anonymous, and Email providers)

## Setting up CI/CD

### Service Account Setup

1. Go to Firebase Console
2. Select your project
3. Go to Project Settings > Service accounts
4. Click "Generate New Private Key" button
5. Save the JSON file securely (DO NOT commit this to git)

### Required IAM Roles

Your service account must have these roles:

- Cloud Functions Admin
- Firebase Admin SDK Administrator Service Agent
- Firebase Authentication Admin
- Firebase Hosting Admin
- Firebase Realtime Database Admin
- Service Account Token Creator
- Service Account User
- Storage Admin

To add these roles:

1. Go to Google Cloud Console IAM (https://console.cloud.google.com/iam-admin/iam)
2. Find your service account
3. Click the edit (pencil) icon
4. Add each required role
5. Save changes

## GitHub Repository Setup

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add these secrets (replace APPNAME with your uppercase app name):
   - `APPNAME_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `APPNAME_GCP_SA_KEY`: The service account key JSON

Example for RizzPOS:

- `RIZZPOS_FIREBASE_PROJECT_ID`: The Firebase project ID
- `RIZZPOS_GCP_SA_KEY`: The service account key JSON

## Development Commands

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
