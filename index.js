/**
 * @format
 */

import 'react-native-get-random-values'; // Must be first — polyfills crypto.getRandomValues
import { AppRegistry } from 'react-native';
import App from './src/app';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
