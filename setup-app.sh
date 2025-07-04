#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Initializing Firebase Setup Agent..."
npx tsx libs/shared/swarm-agents/src/lib/cli/setup-firebase.ts

# Add this function near the top of the file
get_package_version() {
  local package=$1
  local version=$(node -p "require('./package.json').dependencies['$package'] || require('./package.json').devDependencies['$package']" 2>/dev/null)
  echo ${version//[\"\']/}
}

# Function to prompt for input
prompt() {
  read -p "$1: " INPUT
  echo "$INPUT"
}

# Warning message for Firebase project creation
echo "WARNING: Before proceeding, please ensure that you have created a Firebase project."
echo "If you haven't created a project yet, please visit: https://console.firebase.google.com/"
echo "Create a new project or select an existing one before continuing."
read -p "Press Enter to continue once you have confirmed your Firebase project is ready..."

# Add after Firebase project creation warning
echo "WARNING: Please ensure your service account has these exact roles:"
echo "- Cloud Functions Admin"
echo "- Cloud Storage for Firebase Admin"
echo "- Firebase Admin"
echo "- Firebase Admin SDK Administrator Service Agent"
echo "- Firebase Authentication Admin"
echo "- Firebase Extensions API Service Agent"
echo "- Firebase Extensions Publisher - Extensions Admin"
echo "- Firebase Hosting Admin"
echo "- Firebase Realtime Database Admin"
echo "- Firebase Rules Admin"
echo "- Service Account Token Creator"
echo "- Service Account User"
echo "- Storage Admin"
echo "- Storage Object Admin"
echo ""
echo "IMPORTANT: You must also enable these APIs:"
echo "- Cloud Functions API"
echo "- Cloud Storage API"
echo "- Cloud Build API"
echo "- Cloud Billing API (https://console.cloud.google.com/apis/library/cloudbilling.googleapis.com)"
echo "- Firebase Management API"
echo "- Firebase Extensions API"
echo "- Firebase Hosting API"
echo "- Firebase Rules API"
echo "- Identity and Access Management (IAM) API"
echo ""
echo "Visit: https://console.cloud.google.com/apis/library"
read -p "Press Enter once you have added all required roles and enabled all APIs..."

# Get the project name from user input and remove hyphens
echo "Please enter your project name (lowercase, can include hyphens):"
read INPUT_NAME

# Convert input to acceptable format and preserve hyphens
APP_NAME=$(echo "$INPUT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
# Keep hyphens in Angular name as well
ANGULAR_NAME="$APP_NAME"

if [ -z "$APP_NAME" ]; then
  echo "Failed to get project name from Firebase setup"
  exit 1
fi

echo "Using project name: $APP_NAME"
echo "Using sanitized name for Angular: $ANGULAR_NAME"

# Generate Angular application inside apps/{app-name}/angular
nx generate @nx/angular:app "$ANGULAR_NAME" \
  --directory=apps/"$APP_NAME" \
  --projectNameAndRootFormat=as-provided \
  --bundler=esbuild \
  --ssr=false \
  --standalone \
  --routing=true \
  --style=scss \
  --no-interactive

# Add Firebase to the application
nx generate @simondotm/nx-firebase:app firebase --directory=apps/"$APP_NAME" --project="$APP_NAME"

# Add Firebase function
nx generate @simondotm/nx-firebase:function user --app="${APP_NAME}-firebase" --directory=apps/"$APP_NAME"/functions

# Create the angular directory if it doesn't exist
mkdir -p apps/"$APP_NAME"/angular

# Move all folders except firebase and functions
find apps/"$APP_NAME" -maxdepth 1 -mindepth 1 -type d -not -name "firebase" -not -name "functions" -not -name "angular" -exec mv {} apps/"$APP_NAME"/angular/ \;

# Move all files
find apps/"$APP_NAME" -maxdepth 1 -type f -exec mv {} apps/"$APP_NAME"/angular/ \;

# Check if public and src folders exist, and if not, create them
if [ ! -d "apps/$APP_NAME/angular/public" ]; then
  mkdir apps/"$APP_NAME"/angular/public
fi

if [ ! -d "apps/$APP_NAME/angular/src" ]; then
  mkdir apps/"$APP_NAME"/angular/src
fi

# Move contents from the root level to the newly created folders if they exist
if [ -d "apps/$APP_NAME/public" ]; then
  mv apps/"$APP_NAME"/public/* apps/"$APP_NAME"/angular/public/
  rmdir apps/"$APP_NAME"/public
fi

if [ -d "apps/$APP_NAME/src" ]; then
  mv apps/"$APP_NAME"/src/* apps/"$APP_NAME"/angular/src/
  rmdir apps/"$APP_NAME"/src
fi

# Move JSON files
find apps/"$APP_NAME" -maxdepth 1 -name "*.json" -exec mv {} apps/"$APP_NAME"/angular/ \;

# Fix eslint.config.js in the Angular project
ANGULAR_ESLINT_CONFIG="apps/$APP_NAME/angular/eslint.config.js"
if [ -f "$ANGULAR_ESLINT_CONFIG" ]; then
  sed -i '' "s|const baseConfig = require('.*');|const baseConfig = require('../../../eslint.config.js');|" "$ANGULAR_ESLINT_CONFIG"
  echo "Updated eslint.config.js in the Angular project."
else
  echo "Warning: eslint.config.js not found in the Angular project."
fi

# Update tsconfig.json to extend from the correct base tsconfig and set strict to false
TSCONFIG_JSON="apps/$APP_NAME/angular/tsconfig.json"
if [ -f "$TSCONFIG_JSON" ]; then
  sed -i '' 's|"extends": "../../tsconfig.base.json"|"extends": "../../../tsconfig.base.json"|g' "$TSCONFIG_JSON"
  sed -i '' 's|"strict": true|"strict": false|g' "$TSCONFIG_JSON"
  echo "Updated tsconfig.json to extend from the correct base tsconfig and set strict to false."
else
  echo "Warning: tsconfig.json not found in the Angular project."
fi

# Update jest.config.ts to use the correct preset path
JEST_CONFIG="apps/$APP_NAME/angular/jest.config.ts"
if [ -f "$JEST_CONFIG" ]; then
  sed -i '' "s|preset: '../../jest.preset.js'|preset: '../../../jest.preset.js'|g" "$JEST_CONFIG"
  echo "Updated jest.config.ts to use the correct preset path."
else
  echo "Warning: jest.config.ts not found in the Angular project."
fi
# Update project.json paths to include "angular" folder
PROJECT_JSON="apps/$APP_NAME/angular/project.json"
if [ -f "$PROJECT_JSON" ]; then
  # Update outputPath
  sed -i '' 's|"outputPath": "dist/apps/'"$ANGULAR_NAME"'"|"outputPath": "dist/apps/'"$APP_NAME"'/angular"|g' "$PROJECT_JSON"

  # Update sourceRoot
  sed -i '' 's|"sourceRoot": "apps/'"$ANGULAR_NAME"'/src"|"sourceRoot": "apps/'"$APP_NAME"'/angular/src"|g' "$PROJECT_JSON"

  # Update index path
  sed -i '' 's|"index": "apps/'"$ANGULAR_NAME"'/src/index.html"|"index": "apps/'"$APP_NAME"'/angular/src/index.html"|g' "$PROJECT_JSON"

  # Update browser path
  sed -i '' 's|"browser": "apps/'"$ANGULAR_NAME"'/src/main.ts"|"browser": "apps/'"$APP_NAME"'/angular/src/main.ts"|g' "$PROJECT_JSON"

  # Update tsConfig path
  sed -i '' 's|"tsConfig": "apps/'"$ANGULAR_NAME"'/tsconfig.app.json"|"tsConfig": "apps/'"$APP_NAME"'/angular/tsconfig.app.json"|g' "$PROJECT_JSON"

  # Update assets input path
  sed -i '' 's|"input": "apps/'"$ANGULAR_NAME"'/public"|"input": "apps/'"$APP_NAME"'/angular/public"|g' "$PROJECT_JSON"

  # Update styles path
  sed -i '' 's|"styles": \["apps/'"$ANGULAR_NAME"'/src/styles.scss"\]|"styles": ["apps/'"$APP_NAME"'/angular/src/styles.scss"]|g' "$PROJECT_JSON"

  # Update test jestConfig path
  sed -i '' 's|"jestConfig": "apps/'"$ANGULAR_NAME"'/jest.config.ts"|"jestConfig": "apps/'"$APP_NAME"'/angular/jest.config.ts"|g' "$PROJECT_JSON"

  # Update serve-static staticFilePath
  sed -i '' 's|"staticFilePath": "dist/apps/'"$ANGULAR_NAME"'/browser"|"staticFilePath": "dist/apps/'"$APP_NAME"'/angular"|g' "$PROJECT_JSON"

  echo "Updated project.json paths to include 'angular' folder and corrected paths."
else
  echo "Warning: project.json not found in the Angular project."
fi

# Remove eslint.config.js from the functions folder
ESLINT_CONFIG="apps/$APP_NAME/functions/user/eslint.config.js"
if [ -f "$ESLINT_CONFIG" ]; then
  rm "$ESLINT_CONFIG"
  echo "Removed eslint.config.js from the functions folder."
else
  echo "Warning: eslint.config.js not found in the functions folder."
fi


echo "Setup and deployment completed successfully."



# Add initial function code to main.ts
cat << EOF > apps/"$APP_NAME"/functions/user/src/main.ts
import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();

export const deleteAnonUser = functions.https.onCall(async (data) => {
  const { uid } = data;
  try {
    const auth = getAuth();
    const firestore = getFirestore();

    const anonUser = await auth.getUser(uid);
    if (anonUser) {
      await auth.deleteUser(uid);
    }

    const userDoc = await firestore.collection('users').doc(uid).get();
    if (userDoc.exists) {
      await firestore.collection('users').doc(uid).delete();
    }

    const cartDoc = await firestore.collection('carts').doc(uid).get();
    if (cartDoc.exists) {
      await firestore.collection('carts').doc(uid).delete();
    }

    return { deletedCart: true, deletedUser: true };
  } catch (error) {
    console.error('Error deleting anonymous user:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to delete anonymous user'
    );
  }
});
EOF

# TODO: User needs to provide the Firebase configuration from the Firebase Console
# Reminder: Obtain the Firebase config object from the Firebase Console and add it to the appropriate configuration file

# Update package.json
PACKAGE_JSON="apps/$APP_NAME/functions/user/package.json"
if [ -f "$PACKAGE_JSON" ]; then
  cat << EOF > "$PACKAGE_JSON"
{
  "name": "$APP_NAME-functions-user",
  "version": "0.0.1",
  "description": "Firebase Function, auto generated by @simondotm/nx-firebase",
  "scripts": {
    "test": "nx test $APP_NAME-functions-user",
    "lint": "nx lint $APP_NAME-functions-user",
    "build": "nx build $APP_NAME-functions-user",
    "deploy": "nx deploy $APP_NAME-functions-user"
  },
  "engines": {
    "node": "18"
  },
  "main": "main.js",
  "dependencies": {
    "firebase-admin": "^11.11.1",
    "firebase-functions": "^5.0.1"
  },
  "devDependencies": {
    "typescript": "^4.9.0"
  },
  "private": true
}
EOF

  echo "Updated package.json for the Firebase function."
else
  echo "Warning: package.json not found in the functions folder."
fi

echo "Added initial function code and package.json for the Firebase function."

# Ask user if they want to install Angular Material
read -p "Do you want to install Angular Material? (y/n): " install_material
if [ "$install_material" = "y" ]; then
  MATERIAL_VERSION=$(get_package_version "@angular/material")
  nx add @angular/material@18.2.9 --project="$APP_NAME"
fi

# Ask user if they want to install Ionic
read -p "Do you want to install Ionic? (y/n): " install_ionic
if [ "$install_ionic" = "y" ]; then
  IONIC_VERSION=$(get_package_version "@ionic/angular")
  nx add @ionic/angular@8.4.0 --project="$APP_NAME"

  # Update app.component.ts
  sed -i '' 's/import { Component } from '"'"'@angular\/core'"'"';/import { Component } from '"'"'@angular\/core'"'"';\nimport { CommonModule } from '"'"'@angular\/common'"'"';\nimport { IonRouterOutlet, IonApp } from '"'"'@ionic\/angular\/standalone'"'"';/' "apps/$APP_NAME/angular/src/app/app.component.ts"
  sed -i '' 's/imports: \[/imports: [CommonModule, IonRouterOutlet, IonApp, /' "apps/$APP_NAME/angular/src/app/app.component.ts"

  # Update app.component.html
  echo "<ion-app>" > "apps/$APP_NAME/angular/src/app/app.component.html"
  echo "  <ion-router-outlet></ion-router-outlet>" >> "apps/$APP_NAME/angular/src/app/app.component.html"
  echo "</ion-app>" >> "apps/$APP_NAME/angular/src/app/app.component.html"

  # Update styles.scss
  cat << EOF >> "apps/$APP_NAME/angular/src/styles.scss"

// Import Angular Material theming
@use '@angular/material' as mat;

// Include the common styles for Angular Material
@include mat.core();


// Ionic styles
@import '@ionic/angular/css/core.css';
@import '@ionic/angular/css/normalize.css';
@import '@ionic/angular/css/structure.css';
@import '@ionic/angular/css/typography.css';
@import '@ionic/angular/css/display.css';
@import '@ionic/angular/css/padding.css';
@import '@ionic/angular/css/float-elements.css';
@import '@ionic/angular/css/text-alignment.css';
@import '@ionic/angular/css/text-transformation.css';
@import '@ionic/angular/css/flex-utils.css';

// Global styles
html, body {
  height: 100%;
  margin: 0;
  font-family: Roboto, "Helvetica Neue", sans-serif;
}

// Add any additional global styles here
EOF

  # Update project.json to include Ionic styles
  sed -i '' '/"styles": \[/,/\]/c\
    "styles": [\
      "apps/'"$APP_NAME"'/angular/src/styles.scss",\
      {\
        "input": "node_modules/@ionic/angular/css/core.css"\
      },\
      {\
        "input": "node_modules/@ionic/angular/css/normalize.css"\
      },\
      {\
        "input": "node_modules/@ionic/angular/css/structure.css"\
      },\
      {\
        "input": "node_modules/@ionic/angular/css/typography.css"\
      },\
      {\
        "input": "node_modules/@ionic/angular/css/display.css"\
      },\
      {\
        "input": "node_modules/@ionic/angular/css/padding.css"\
      },\
      {\
        "input": "node_modules/@ionic/angular/css/float-elements.css"\
      },\
      {\
        "input": "node_modules/@ionic/angular/css/text-alignment.css"\
      },\
      {\
        "input": "node_modules/@ionic/angular/css/text-transformation.css"\
      },\
      {\
        "input": "node_modules/@ionic/angular/css/flex-utils.css"\
      },\
      {\
        "input": "apps/'"$APP_NAME"'/angular/src/theme/variables.css"\
      }\
    ],' "apps/$APP_NAME/angular/project.json"

  # Create theme/variables.css file
  mkdir -p "apps/$APP_NAME/angular/src/theme"
  cat << EOF > "apps/$APP_NAME/angular/src/theme/variables.css"
/**
 * Ionic Dark Theme
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import "@ionic/angular/css/palettes/dark.always.css"; */
/* @import "@ionic/angular/css/palettes/dark.class.css"; */
@import "@ionic/angular/css/palettes/dark.system.css";
EOF

  echo "Ionic has been installed and configured for the project."
fi

# Check if app.routes.ts exists, and if so, overwrite it
APP_ROUTES_FILE="apps/$APP_NAME/angular/src/app/app.routes.ts"
if [ -f "$APP_ROUTES_FILE" ]; then
  echo "Existing app.routes.ts found. Overwriting with specified content."
else
  echo "Creating new app.routes.ts with specified content."
fi

# Create or overwrite app.routes.ts file with the specified content
cat << EOF > "$APP_ROUTES_FILE"
import { Route } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: NxWelcomeComponent,
  },
];
EOF

echo "app.routes.ts has been updated with the specified content."

# Check if app.config.ts exists, and if so, overwrite it
APP_CONFIG_FILE="apps/$APP_NAME/angular/src/app/app.config.ts"
if [ -f "$APP_CONFIG_FILE" ]; then
  echo "Existing app.config.ts found. Overwriting with specified content."
else
  echo "Creating new app.config.ts with specified content."
fi

# Create or overwrite app.config.ts file with the specified content
cat << EOF > "$APP_CONFIG_FILE"
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { firebaseConfig } from './firebase-config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideFunctions(() => getFunctions()),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
  ],
};
EOF

echo "app.config.ts has been updated with the specified content."

# Check if firebase-config.ts exists, and if so, overwrite it
FIREBASE_CONFIG_FILE="apps/$APP_NAME/angular/src/app/firebase-config.ts"
if [ -f "$FIREBASE_CONFIG_FILE" ]; then
  echo "Existing firebase-config.ts found. Overwriting with placeholder content."
else
  echo "Creating new firebase-config.ts with placeholder content."
fi

# Create or overwrite firebase-config.ts file with the placeholder content
cat << EOF > "$FIREBASE_CONFIG_FILE"
export const firebaseConfig = {};
EOF

echo "firebase-config.ts has been created/updated with placeholder content."

# Check if styles.scss exists, and if so, overwrite it
STYLES_FILE="apps/$APP_NAME/angular/src/styles.scss"
if [ -f "$STYLES_FILE" ]; then
  echo "Existing styles.scss found. Overwriting with specified content."
else
  echo "Creating new styles.scss with specified content."
fi

# Create or overwrite styles.scss file with the specified content
cat << EOF > "$STYLES_FILE"
// Import Angular Material theming
@use '@angular/material' as mat;

// Include the common styles for Angular Material
@include mat.core();


// Ionic styles
@import '@ionic/angular/css/core.css';
@import '@ionic/angular/css/normalize.css';
@import '@ionic/angular/css/structure.css';
@import '@ionic/angular/css/typography.css';
@import '@ionic/angular/css/display.css';
@import '@ionic/angular/css/padding.css';
@import '@ionic/angular/css/float-elements.css';
@import '@ionic/angular/css/text-alignment.css';
@import '@ionic/angular/css/text-transformation.css';
@import '@ionic/angular/css/flex-utils.css';

// Global styles
html, body {
  height: 100%;
  margin: 0;
  font-family: Roboto, "Helvetica Neue", sans-serif;
}

// Add any additional global styles here
EOF

echo "styles.scss has been updated with the specified content."

# Check if app.component.ts exists, and if so, overwrite it
APP_COMPONENT_FILE="apps/$APP_NAME/angular/src/app/app.component.ts"
if [ -f "$APP_COMPONENT_FILE" ]; then
  echo "Existing app.component.ts found. Overwriting with specified content."
else
  echo "Creating new app.component.ts with specified content."
fi

# Create or overwrite app.component.ts file with the specified content
cat << EOF > "$APP_COMPONENT_FILE"
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonRouterOutlet, IonApp } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  imports: [CommonModule, IonRouterOutlet, IonApp],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = '$APP_NAME';
}
EOF

echo "app.component.ts has been updated with the specified content."



# Create assets folder if it doesn't exist
ASSETS_FOLDER="apps/$APP_NAME/angular/src/assets"
mkdir -p "$ASSETS_FOLDER"

# Create google-logo.svg file in the assets folder
GOOGLE_LOGO_FILE="$ASSETS_FOLDER/google-logo.svg"
cat << EOF > "$GOOGLE_LOGO_FILE"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
</svg>
EOF

echo "Created assets folder and added google-logo.svg"

# Find and update firebase.json to use Node.js 18 for functions
FIREBASE_JSON=$(find . -maxdepth 1 -type f -name "*firebase.json" -print -quit)
if [ -n "$FIREBASE_JSON" ]; then
  sed -i '' 's/"runtime": "nodejs16"/"runtime": "nodejs18"/g' "$FIREBASE_JSON"
  echo "Updated $FIREBASE_JSON to use Node.js 18 for functions runtime."
else
  echo "Warning: No file containing 'firebase.json' found in the root directory. Make sure it's created and update the runtime manually if needed."
fi


# Update assets in project.json
PROJECT_JSON="apps/$APP_NAME/angular/project.json"
if [ -f "$PROJECT_JSON" ]; then
  # Use sed to replace the entire "assets" array
  sed -i '' '/"assets": \[/,/\]/c\
    "assets": [\
      "apps/'"$APP_NAME"'/angular/src/favicon.ico",\
      "apps/'"$APP_NAME"'/angular/src/assets",\
      {\
        "glob": "**/*.svg",\
        "input": "node_modules/ionicons/dist/ionicons/svg",\
        "output": "./svg"\
      }\
    ],' "$PROJECT_JSON"

  echo "Updated assets configuration in project.json"
else
  echo "Warning: project.json not found in the Angular project."
fi

# Update lint configuration in project.json
PROJECT_JSON="apps/$APP_NAME/angular/project.json"
if [ -f "$PROJECT_JSON" ]; then
  # Use sed to replace the entire "lint" object
  sed -i '' '/"lint": {/,/},/c\
    "lint": {\
      "executor": "@nx/eslint:lint",\
      "outputs": ["{options.outputFile}"],\
      "options": {\
        "lintFilePatterns": [\
          "apps/'"$APP_NAME"'/angular/**/*.ts",\
          "apps/'"$APP_NAME"'/angular/**/*.html"\
        ]\
      }\
    },' "$PROJECT_JSON"

  echo "Updated lint configuration in project.json"
else
  echo "Warning: project.json not found in the Angular project."
fi

# Update build target in firebase project.json
FIREBASE_PROJECT_JSON="apps/$APP_NAME/firebase/project.json"
if [ -f "$FIREBASE_PROJECT_JSON" ]; then
  # Use sed to replace the entire "build" target
  sed -i '' '/"build": {/,/},/c\
    "build": {\
      "executor": "nx:run-commands",\
      "cache": true,\
      "options": {\
        "commands": [\
          "nx run-many --target=build --projects=tag:firebase:dep:'"$APP_NAME"'-firebase",\
          "echo Build succeeded for all functions."\
        ],\
        "parallel": true\
      }\
    },' "$FIREBASE_PROJECT_JSON"

  echo "Updated build target in firebase project.json"
else
  echo "Warning: project.json not found in the Firebase project."
fi



# Create or update firebase.json
FIREBASE_JSON="firebase.${APP_NAME}-firebase.json"
cat << EOF > "$FIREBASE_JSON"
{
  "firestore": {
    "rules": "apps/$APP_NAME/firebase/firestore.rules",
    "indexes": "apps/$APP_NAME/firebase/firestore.indexes.json"
  },
  "hosting": {
    "public": "dist/apps/$APP_NAME/angular/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "storage": {
    "rules": "apps/$APP_NAME/firebase/storage.rules"
  },
  "functions": [
    {
      "source": "dist/apps/$APP_NAME/functions/user",
      "codebase": "${APP_NAME}-functions-user",
      "runtime": "nodejs18",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ]
    }
  ],
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5003
    },
    "firestore": {
      "port": 8278
    },
    "database": {
      "port": 9323
    },
    "hosting": {
      "port": 5004
    },
    "pubsub": {
      "port": 8178
    },
    "storage": {
      "port": 9199
    },
    "eventarc": {
      "port": 9299
    },
    "ui": {
      "enabled": true
    },
    "singleProjectMode": true
  }
}
EOF

echo "Created/updated $FIREBASE_JSON with correct hosting public path and functions configuration."

# After Firebase setup and before deployment
echo "Building Angular application and Firebase functions..."
nx build "$ANGULAR_NAME" --prod
nx build "${APP_NAME}-firebase"
nx build "${APP_NAME}-functions-user"

# Then deploy
echo "Deploying to Firebase..."
firebase login
firebase use --add

echo "make sure to use the exact name of the project as you entered it above"
nx deploy "${APP_NAME}-firebase"

# Create GitHub Actions workflow directory and file
WORKFLOW_DIR=".github/workflows"
mkdir -p "$WORKFLOW_DIR"

# Convert APP_NAME to uppercase and replace hyphens with underscores for secrets
UPPERCASE_APP_NAME=$(echo "$APP_NAME" | tr '[:lower:]' '[:upper:]' | tr '-' '_')

# Create the workflow file for the app
WORKFLOW_FILE="$WORKFLOW_DIR/${APP_NAME}.yml"
cat << EOF > "$WORKFLOW_FILE"
name: ${APP_NAME} CI/CD

on:
  pull_request:
    branches:
      - main
    paths:
      - 'apps/${APP_NAME}/**' # Only the app
      - 'libs/shared/**' # Shared libraries used by app
      - 'firebase.${APP_NAME}-firebase.json'
      - '.github/workflows/${APP_NAME}.yml'
      - 'setup-app.sh'
      - 'package.json'
env:
  APP_NAME: ${APP_NAME}
  FIREBASE_PROJECT_ID: \${{ secrets.${UPPERCASE_APP_NAME}_FIREBASE_PROJECT_ID }}
  ACTIONS_RUNNER_DEBUG: true # Enable runner diagnostic logging
  ACTIONS_STEP_DEBUG: true # Enable step debug logging

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Cache
        uses: actions/cache@v4.1.2
        with:
          path: |
            ~/.npm
            node_modules
            .nx/cache
            dist
          key: \${{ runner.os }}-\${{ env.APP_NAME }}-\${{ hashFiles('**/package-lock.json') }}-\${{ hashFiles('**/*.ts') }}
          restore-keys: |
            \${{ runner.os }}-\${{ env.APP_NAME }}-

      - name: Install dependencies
        run: npm ci --legacy-peer-deps

      - name: Install Firebase CLI
        run: npm install -g firebase-tools@13.16.0

      - name: Connect to Nx Cloud
        run: npx nx connect-to-nx-cloud

      - uses: nrwl/nx-set-shas@v4

      # Build Angular app - NX will handle all dependencies
      - name: Build Angular app
        run:  npx nx reset && npx nx build \${{ env.APP_NAME }} --prod --verbose

      # Build Firebase components - NX will handle all dependencies
      - name: Build Firebase
        run: |
          echo "Building firebase project..."
          npx nx build \${{ env.APP_NAME }}-firebase --verbose

          echo "Building all Firebase functions..."
          npx nx run-many --target=build --projects=tag:firebase:dep:\${{ env.APP_NAME }}-firebase --verbose

      # Authenticate with service account
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: \${{ secrets.${UPPERCASE_APP_NAME}_GCP_SA_KEY }}

      # Deploy
      - name: Deploy to Firebase
        run: |
          echo "Starting deployment with debug info..."

          # Print Firebase debug info
          firebase --version
          firebase projects:list

          # Run deployment with maximum verbosity and debug flags
          FIREBASE_DEBUG=true DEBUG="@firebase/*" npx nx deploy \${{ env.APP_NAME }}-firebase --verbose

          # If deployment fails, check Firebase debug log
          if [ \$? -ne 0 ]; then
            echo "Deployment failed. Firebase debug log:"
            cat firebase-debug.log
            exit 1
          fi
        env:
          DEBUG: '*'
EOF

echo "Created GitHub Actions workflow file at $WORKFLOW_FILE"
echo "IMPORTANT: Make sure to add these secrets to your GitHub repository:"
echo "  - ${UPPERCASE_APP_NAME}_FIREBASE_PROJECT_ID: Your Firebase project ID"
echo "  - ${UPPERCASE_APP_NAME}_GCP_SA_KEY: Your Google Cloud service account key JSON"
