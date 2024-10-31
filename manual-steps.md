## Firebase Project Setup

Before setting up service accounts, you need to:

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
4. Add each required role exactly as listed above
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

## Firebase Configuration

After setting up the project, you'll need to:

1. Get your Firebase config object from Project Settings > General > Your Apps
2. Add this config to your app's `firebase-config.ts` file

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
