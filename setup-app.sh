#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Function to prompt for input
prompt() {
  read -p "$1: " INPUT
  echo "$INPUT"
}

# Collect necessary inputs
APP_NAME=$(prompt "Enter your application name")
FIREBASE_PROJECT=$(prompt "Enter your Firebase project ID")
FUNCTION_NAME=$(prompt "Enter your Firebase function name")

# Generate Angular application inside apps/{app-name}/angular
nx generate @nx/angular:app "$APP_NAME" --directory=apps/"$APP_NAME" --projectNameAndRootFormat=as-provided
# then move public, src folders and all files, except the firebase and functions folders to apps/{app-name}/angular


# Add Firebase to the application
nx generate @simondotm/nx-firebase:app firebase --directory=apps/"$APP_NAME" --project="$APP_NAME"

# Add Firebase function
nx generate @simondotm/nx-firebase:function "$FUNCTION_NAME" --app="${APP_NAME}-firebase" --directory=apps/"$APP_NAME"/functions

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
ESLINT_CONFIG="apps/$APP_NAME/functions/$FUNCTION_NAME/eslint.config.js"
if [ -f "$ESLINT_CONFIG" ]; then
  rm "$ESLINT_CONFIG"
  echo "Removed eslint.config.js from the functions folder."
else
  echo "Warning: eslint.config.js not found in the functions folder."
fi



echo "Setup and deployment completed successfully."

# # Install Firebase dependencies for functions
# cd apps/"$APP_NAME"/functions/"$FUNCTION_NAME"
# npm install firebase-admin firebase-functions
# cd ../../../../..

# # Build the Angular application and functions
# nx build "$APP_NAME" --prod
# nx build "${APP_NAME}-functions-$FUNCTION_NAME"

# # Deploy Firebase application and functions
# # Ensure that the Firebase project is linked via 'firebase use' before deploying
# nx deploy "${APP_NAME}-firebase"
# nx deploy "${APP_NAME}-functions-$FUNCTION_NAME"


