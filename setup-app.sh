#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

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

# Collect necessary inputs
APP_NAME=$(prompt "Enter your application name")

# Generate Angular application inside apps/{app-name}/angular
nx generate @nx/angular:app "$APP_NAME" --directory=apps/"$APP_NAME" --projectNameAndRootFormat=as-provided
# then move public, src folders and all files, except the firebase and functions folders to apps/{app-name}/angular


# Add Firebase to the application
nx generate @simondotm/nx-firebase:app firebase --directory=apps/"$APP_NAME" --project="$APP_NAME"

# Add Firebase function
#    Property 'runTime' does not match the schema. '18' should be a 'string'.
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

# Update tsconfig.json to extend from the correct base tsconfig
TSCONFIG_JSON="apps/$APP_NAME/angular/tsconfig.json"
if [ -f "$TSCONFIG_JSON" ]; then
  sed -i '' 's|"extends": "../../tsconfig.base.json"|"extends": "../../../tsconfig.base.json"|g' "$TSCONFIG_JSON"
  echo "Updated tsconfig.json to extend from the correct base tsconfig."
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
  sed -i '' 's|"outputPath": "dist/apps/'"$APP_NAME"'"|"outputPath": "dist/apps/'"$APP_NAME"'/angular"|g' "$PROJECT_JSON"

  # Update sourceRoot
  sed -i '' 's|"sourceRoot": "apps/'"$APP_NAME"'/src"|"sourceRoot": "apps/'"$APP_NAME"'/angular/src"|g' "$PROJECT_JSON"

  # Update index path
  sed -i '' 's|"index": "apps/'"$APP_NAME"'/src/index.html"|"index": "apps/'"$APP_NAME"'/angular/src/index.html"|g' "$PROJECT_JSON"

  # Update browser path
  sed -i '' 's|"browser": "apps/'"$APP_NAME"'/src/main.ts"|"browser": "apps/'"$APP_NAME"'/angular/src/main.ts"|g' "$PROJECT_JSON"

  # Update tsConfig path
  sed -i '' 's|"tsConfig": "apps/'"$APP_NAME"'/tsconfig.app.json"|"tsConfig": "apps/'"$APP_NAME"'/angular/tsconfig.app.json"|g' "$PROJECT_JSON"

  # Update assets input path
  sed -i '' 's|"input": "apps/'"$APP_NAME"'/public"|"input": "apps/'"$APP_NAME"'/angular/public"|g' "$PROJECT_JSON"

  # Update styles path
  sed -i '' 's|"styles": \["apps/'"$APP_NAME"'/src/styles.scss"\]|"styles": ["apps/'"$APP_NAME"'/angular/src/styles.scss"]|g' "$PROJECT_JSON"

  # Update test jestConfig path
  sed -i '' 's|"jestConfig": "apps/'"$APP_NAME"'/jest.config.ts"|"jestConfig": "apps/'"$APP_NAME"'/angular/jest.config.ts"|g' "$PROJECT_JSON"

  # Update serve-static staticFilePath
  sed -i '' 's|"staticFilePath": "dist/apps/'"$APP_NAME"'/browser"|"staticFilePath": "dist/apps/'"$APP_NAME"'/angular"|g' "$PROJECT_JSON"

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

# Add export statement to index.ts
echo "export * from './main';" > apps/"$APP_NAME"/functions/user/src/index.ts

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
  "main": "src/index.js",
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

echo "Added initial function code, updated index.ts, and package.json for the Firebase function."

# Ask user if they want to install Angular Material
read -p "Do you want to install Angular Material? (y/n): " install_material
if [ "$install_material" = "y" ]; then
  nx add @angular/material --project="$APP_NAME"
fi

# Ask user if they want to install Ionic
read -p "Do you want to install Ionic? (y/n): " install_ionic
if [ "$install_ionic" = "y" ]; then
  nx add @ionic/angular --project="$APP_NAME"

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

# Build the Angular application and functions
nx build "$APP_NAME" --prod
nx build "${APP_NAME}-functions-user"

echo "Build completed successfully."

firebase login
firebase use --add

# # Deploy Firebase application and functions
# # Ensure that the Firebase project is linked via 'firebase use' before deploying
nx deploy "${APP_NAME}-firebase"
nx deploy "${APP_NAME}-functions-user"

echo "Deploy completed successfully."
