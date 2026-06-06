import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const setupNotifications = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("risk-alerts", {
      name: "Risk Zone Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      sound: "default",
    });
  }

  const existing = await Notifications.getPermissionsAsync();

  let finalStatus = existing.status;

  if (finalStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  return finalStatus === "granted";
};

export const showRiskNotification = async ({ riskLevel, riskScore, district }) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Nirvaya Risk Alert",
      body: `You are entering a ${riskLevel} risk zone${district ? ` in ${district}` : ""}. Risk score: ${riskScore}`,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null,
  });
};