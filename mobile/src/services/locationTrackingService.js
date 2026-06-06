import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { LOCATION_TRACKING_TASK } from "../tasks/locationTrackingTask";

export const startBackgroundLocationTracking = async () => {
  const foregroundPermission =
    await Location.requestForegroundPermissionsAsync();

  if (foregroundPermission.status !== "granted") {
    throw new Error("Foreground location permission denied");
  }

  const backgroundPermission =
    await Location.requestBackgroundPermissionsAsync();

  if (backgroundPermission.status !== "granted") {
    throw new Error("Background location permission denied");
  }

  const alreadyStarted =
    await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);

  if (alreadyStarted) {
    return {
      success: true,
      message: "Location tracking already running",
    };
  }

  await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
    accuracy: Location.Accuracy.Balanced,

    /*
      Android timeInterval is a hint. The OS can still batch/delay updates.
      60 seconds is reasonable for normal tracking.
    */
    timeInterval: 60 * 1000,

    /*
      Sends update only if user moves 50m.
      This saves battery and prevents useless backend calls.
    */
    distanceInterval: 50,

    pausesUpdatesAutomatically: false,

    foregroundService: {
      notificationTitle: "Nirvaya safety tracking is active",
      notificationBody: "Nirvaya is checking nearby risk zones.",
      notificationColor: "#ED234F",
    },
  });

  return {
    success: true,
    message: "Location tracking started",
  };
};

export const stopBackgroundLocationTracking = async () => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    LOCATION_TRACKING_TASK
  );

  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
  }

  return {
    success: true,
    message: "Location tracking stopped",
  };
};

export const isBackgroundLocationTrackingRunning = async () => {
  return await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
};