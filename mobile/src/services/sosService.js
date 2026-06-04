import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "./api";

let locationInterval = null;

export const startSos = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission denied");
  }

  const currentLocation = await Location.getCurrentPositionAsync({});

  const token = await SecureStore.getItemAsync("token");

  const response = await fetch(`${API_URL}/sos/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      trigger_type: "button",
    }),
  });
  console.log("Start SOS response status:", response.status);
  console.log("Start SOS response data:", response.json());
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to start SOS");
  }

  return data;
};

export const startLocationUpdates = async (sosId) => {
  const token = await SecureStore.getItemAsync("token");

  locationInterval = setInterval(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});

      await fetch(`${API_URL}/sos/${sosId}/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }),
      });

      console.log("SOS location updated");
    } catch (error) {
      console.log("Location update error:", error.message);
    }
  }, 30 * 1000);
};

export const stopLocationUpdates = () => {
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
  }
};

export const resolveSos = async (sosId) => {
  const token = await SecureStore.getItemAsync("token");

  const response = await fetch(`${API_URL}/sos/${sosId}/resolve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to resolve SOS");
  }

  return data;
};