// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// import { version } from "../../package.json";

export const environment = {
  // appVersion: version + "-dev",
  production: false,
  clientId:
    '855877753006-pfob72cd6k4v42p7fh0fiupltv9seud1.apps.googleusercontent.com',
  firebaseConfig: {
    apiKey: 'AIzaSyDd6JxUQe7bh2u4i9JdGFGeMcbw-cKzft4',
    authDomain: 'rizzpos-dev.firebaseapp.com',
    projectId: 'rizzpos-dev',
    storageBucket: 'rizzpos-dev.appspot.com',
    messagingSenderId: '45420923038',
    appId: '1:45420923038:web:1f14e568b864ff34d6138f',
    measurementId: 'G-8NYQBT827B',
  },
  storageConfig: {
    customMetadata: {
      app: 'RizzPos',
    },
    bucketName: 'rizzpos',
  },
  url: 'https://rizzpos-dev.web.app',
  fn_url: 'https://us-central1-rizzpos-dev.cloudfunctions.net/',
  clientName: 'RizzPos',
  clientAddress: '24 Ashley Road, Homestead Park, Johannesburg, 2092',
  clientSpUids: ['5vWIFkqS8LW9hHmiqRHBebDMcCS2'],
};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
