import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
// {
//   "expo": {
//     "name": "mobile",
//     "slug": "mobile",
//     "version": "1.0.0",
//     "orientation": "portrait",
//     "icon": "./assets/icon.png",
//     "userInterfaceStyle": "light",
//     "newArchEnabled": true,
//     "splash": {
//       "image": "./assets/splash-icon.png",
//       "resizeMode": "contain",
//       "backgroundColor": "#ffffff"
//     },
//     "ios": {
//       "supportsTablet": true
//     },
//     "android": {
//       "adaptiveIcon": {
//         "foregroundImage": "./assets/adaptive-icon.png",
//         "backgroundColor": "#ffffff"
//       },
//       "edgeToEdgeEnabled": true
//     },
//     "web": {
//       "favicon": "./assets/favicon.png"
//     },
//     "plugins": [
//       "expo-secure-store"
//     ]
//   }
// }