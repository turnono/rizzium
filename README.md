# Rizzium

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is almost ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Finish your CI setup

[Click here to finish setting up your workspace!](https://cloud.nx.app/connect/jpZbdZRDcI)

## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve rizzpos
```

To create a production bundle:

```sh
npx nx build rizzpos
```

To see all available targets to run for a project, run:

```sh
npx nx show project rizzpos
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/angular:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/angular:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

<!-- nx-firebase -->
<!-- create an angular project in apps/{app-name}/angular -->

nx g @nx/angular:app {app-name} --directory=apps/{app-name}

<!-- create a firebase project in firebase console and get the config -->

choose a name for the firebase project
create a prod project with your name because you want to secure the domain name
set the Environment type to production in the project settings
now create a new dev project,
add -dev to the name
add firebase config to the project in the dev environment file
make sure projects is on the blaze plan

<!-- add a firebase project to the app -->

nx g @simondotm/nx-firebase:app firebase --directory=apps/{app-name} --project={app-name}

<!-- add a function to the project -->

nx g @simondotm/nx-firebase:function {function-name} --app={app-name}-firebase --directory=apps/{app-name}/functions

<!-- build all -->

nx build {app-name} --prod

nx build {app-name}-functions-{function-name}

<!-- run the firebase project -->
<!-- npx kill-port 9099 5003 8278 9323 5004 8178 9199 9299 9324 8279 -->
<!-- firebase login -->
<!-- firebase use {app-name} -->

nx serve {app-name}-firebase

<!-- deploy -->

nx deploy {app-name}-firebase
nx deploy {app-name}-functions-{function-name}

<!--
**Script Breakdown:**

1. **Prompt for Inputs:**
   - **Application Name (`APP_NAME`):** The name of your Angular application.
   - **Firebase Project ID (`FIREBASE_PROJECT`):** Your Firebase project identifier.
   - **Function Name (`FUNCTION_NAME`):** The name of the Firebase function you wish to create.

2. **Generate Angular Application:**
   - Uses the Nx Angular generator to create a new Angular application within the specified directory.

3. **Integrate Firebase:**
   - Adds Firebase configuration to the Angular application using the `nx-firebase` plugin.

4. **Add Firebase Function:**
   - Creates a new Firebase function within the application's functions directory.

5. **Install Dependencies:**
   - Navigates to the function's directory and installs `firebase-admin` and `firebase-functions`.

6. **Build Projects:**
   - Builds both the Angular application and the Firebase function for production.

7. **Deploy to Firebase:**
   - Deploys the Angular application and Firebase function to the specified Firebase project.

### Notes

- **Manual Firebase Project Creation:**
  - Currently, creating a Firebase project via the Firebase console is a manual step and is not automated in this script. Once the Firebase project is set up, link it using:

    ```bash
    firebase use {FIREBASE_PROJECT}
    ```

- **Firebase Configuration:**
  - After creating the Firebase project, retrieve the Firebase configuration and add it to your Angular application's environment files (`environment.prod.ts` and `environment.ts`).

- **Future Automation:**
  - Automating Firebase project creation can be achieved using Firebase's REST APIs or Google Cloud SDKs in future enhancements.

### Step 4: Add Firebase Configuration to Environment Files

After running the setup script, you need to add your Firebase configuration to the Angular application's environment files.

1. **Retrieve Firebase Config:**
   - Obtain your Firebase project's configuration details from the Firebase console.

2. **Update `environment.prod.ts`:**

   ```typescript:apps/{app-name}/angular/src/environments/environment.prod.ts
   export const environment = {
     production: true,
     clientId: 'YOUR_CLIENT_ID',
     firebaseConfig: {
       apiKey: 'YOUR_API_KEY',
       authDomain: 'YOUR_AUTH_DOMAIN',
       projectId: 'YOUR_PROJECT_ID',
       storageBucket: 'YOUR_STORAGE_BUCKET',
       messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
       appId: 'YOUR_APP_ID',
       measurementId: 'YOUR_MEASUREMENT_ID',
     },
     storageConfig: {
       customMetadata: {
         app: 'YourAppName',
       },
       bucketName: 'your-app-bucket',
     },
     url: 'https://your-app.web.app/',
     fn_url: '',
     clientName: 'YourAppName',
     clientAddress: 'Your Address',
     clientSpUids: ['Your_SPUIDs'],
   };
   ```

3. **Update `environment.ts`:**

   ```typescript:apps/{app-name}/angular/src/environments/environment.ts
   export const environment = {
     production: false,
     clientId: 'YOUR_CLIENT_ID_DEV',
     firebaseConfig: {
       apiKey: 'YOUR_API_KEY_DEV',
       authDomain: 'YOUR_AUTH_DOMAIN_DEV',
       projectId: 'YOUR_PROJECT_ID_DEV',
       storageBucket: 'YOUR_STORAGE_BUCKET_DEV',
       messagingSenderId: 'YOUR_MESSAGING_SENDER_ID_DEV',
       appId: 'YOUR_APP_ID_DEV',
       measurementId: 'YOUR_MEASUREMENT_ID_DEV',
     },
     storageConfig: {
       customMetadata: {
         app: 'YourAppName',
       },
       bucketName: 'your-app-bucket',
     },
     url: 'https://your-app-dev.web.app',
     fn_url: 'https://us-central1-your-app-dev.cloudfunctions.net/',
     clientName: 'YourAppName',
     clientAddress: 'Your Address',
     clientSpUids: ['Your_SPUIDs'],
   };
   /*
    * For easier debugging in development mode, you can import the following file
    * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
    *
    * This import should be commented out in production mode because it will have a negative impact
    * on performance if an error is thrown.
    */
   ```

   > **Note:** Replace placeholders like `YOUR_CLIENT_ID`, `YOUR_API_KEY`, etc., with your actual Firebase project credentials.

### Additional Recommendations

- **Port Management:**
  - To avoid port conflicts when running Firebase emulators, you can use the `kill-port` utility, which is already included in your `package.json`. Incorporate it into your workflows as needed.

- **CI/CD Integration:**
  - Utilize the provided `.github/workflows/ci.yml` for continuous integration, ensuring that tasks are cached and executed efficiently using Nx Cloud.

- **Environment Variables Security:**
  - Ensure that sensitive information like Firebase configuration details is secured and not exposed in your code repositories. Consider using environment variables or secure storage solutions.

- **Further Automation:**
  - Automate Firebase project configuration retrieval and injection into environment files in future iterations to fully minimize manual steps.

### Conclusion

By following this automated setup guide, you can efficiently create and deploy a full-stack Angular application integrated with Firebase using Nx and `nx-firebase`. This streamlined process reduces the complexity for users with basic computer skills, ensuring a smoother development and deployment experience. Future enhancements can focus on further automating Firebase console interactions to achieve a completely hands-off setup.

For more detailed information, refer to the [Nx Documentation](https://nx.dev/) and the [`nx-firebase` GitHub Repository](https://github.com/simondotm/nx-firebase). -->
