import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";

import { API_URL } from "../services/api";
import { showRiskNotification } from "../services/notificationService";

export const LOCATION_TRACKING_TASK = "NIRVAYA_LOCATION_TRACKING_TASK";

let lastAlertTime = 0;

TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }) => {
  if (error) {
    console.log("Background location task error:", error.message);
    return;
  }

  if (!data?.locations?.length) {
    return;
  }

  try {
    const latestLocation = data.locations[data.locations.length - 1];

    const latitude = latestLocation.coords.latitude;
    const longitude = latestLocation.coords.longitude;

    const token = await SecureStore.getItemAsync("token");

    if (!token) {
      console.log("No token found. Skipping background location update.");
      return;
    }

    const response = await fetch(`${API_URL}/location/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude,
        longitude,
      }),
    });

    const result = await response.json();

    console.log("Background location update result:", result);

    if (!response.ok || !result.success) {
      return;
    }

    const riskLevel = result.risk?.risk_level;
    const riskScore = result.risk?.risk_score;
    const district = result.risk?.district;

    const isHighRisk = riskLevel === "high" || riskLevel === "critical";

    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (isHighRisk && now - lastAlertTime > fiveMinutes) {
      lastAlertTime = now;

      await showRiskNotification({
        riskLevel,
        riskScore,
        district,
      });
    }
  } catch (err) {
    console.log("Background task failed:", err.message);
  }
});