import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import AuthLoadingScreen from "./src/screens/AuthLoadingScreen";
import UserProfileScreen from "./src/screens/UserProfileScreen";
import SafeRoutesScreen from "./src/screens/SafeRoutesScreen";
import "./src/tasks/locationTrackingTask";
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SafeRoutes" component={SafeRoutesScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}