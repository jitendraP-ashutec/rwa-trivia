// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
import { IConfig } from './iconfig';

export const environment = {
  production: false
};

export const CONFIG: IConfig = {
  'firebaseConfig': {
    apiKey: 'AIzaSyAqSJgn64UBZUbc7p7UDKSLOoburAENGDw',
    authDomain: 'rwa-trivia-dev-e57fc.firebaseapp.com',
    databaseURL: 'https://rwa-trivia-dev-e57fc.firebaseio.com',
    projectId: 'rwa-trivia-dev-e57fc',
    storageBucket: 'rwa-trivia-dev-e57fc.appspot.com',
    messagingSenderId: '701588063269',
    googlePlayUrl: 'https://play.google.com/store/apps/details?id=io.bitwiser.trivia.dev',
    iTunesUrl: 'https://itunes.apple.com/us/app/bitwiser-trivia/id1447131917?ls=1&mt=8'
  },
  'functionsUrl': 'https://rwa-trivia-dev-e57fc.firebaseapp.com'
};
