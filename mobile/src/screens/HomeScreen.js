import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Switch,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";

import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";

import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  isBackgroundLocationTrackingRunning,
} from "../services/locationTrackingService";

import { setupNotifications } from "../services/notificationService";

import {
  startSos,
  startLocationUpdates,
  stopLocationUpdates,
  resolveSos,
} from "../services/sosService";

import { API_URL } from "../services/api";

const PRIMARY = "#ED234F";
const SAFE_GREEN = "#21A67A";
const MEDIUM_ORANGE = "#FF9900";
const DANGER_RED = "#D90429";

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [activeSos, setActiveSos] = useState(null);

  const [normalTrackingEnabled, setNormalTrackingEnabled] = useState(false);

  const [initialRiskLoading, setInitialRiskLoading] = useState(false);
  const [currentRisk, setCurrentRisk] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const blinkAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    loadUser();
    startPulseAnimation();
    setupInitialTrackingState();
    fetchCurrentLocationRiskOnce();

    return () => {
      stopLocationUpdates();
    };
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync("user");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log("Load user error:", error.message);
    }
  };

  const setupInitialTrackingState = async () => {
    try {
      await setupNotifications();

      const running = await isBackgroundLocationTrackingRunning();
      setNormalTrackingEnabled(running);
    } catch (error) {
      console.log("Initial tracking state error:", error.message);
    }
  };

  const fetchCurrentLocationRiskOnce = async () => {
    try {
      setInitialRiskLoading(true);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setCurrentRisk({
          risk_level: "unknown",
          risk_score: 0,
          message: "Location permission not granted",
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      setCurrentCoords({
        latitude,
        longitude,
      });

      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        throw new Error("User token not found");
      }

      const response = await fetch(`${API_URL}/location/risk-check`, {
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

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to check location risk");
      }

      setCurrentRisk(data.risk);
    } catch (error) {
      console.log("Initial risk check error:", error.message);

      setCurrentRisk({
        risk_level: "unknown",
        risk_score: 0,
        message: error.message,
      });
    } finally {
      setInitialRiskLoading(false);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 0.35,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  };

  const getInitials = () => {
    if (!user?.name) return "U";

    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const handleNormalTrackingToggle = async (value) => {
    try {
      if (value) {
        const notificationReady = await setupNotifications();

        if (!notificationReady) {
          Alert.alert(
            "Notification Permission Needed",
            "Please allow notifications so Nirvaya can alert you when you enter a risk zone."
          );
        }

        await startBackgroundLocationTracking();
        setNormalTrackingEnabled(true);

        Alert.alert(
          "Tracking Enabled",
          "Nirvaya will check your location in the background and alert you if you enter a high-risk zone."
        );
      } else {
        await stopBackgroundLocationTracking();
        setNormalTrackingEnabled(false);

        Alert.alert(
          "Tracking Disabled",
          "Background safety tracking has been stopped."
        );
      }
    } catch (error) {
      setNormalTrackingEnabled(false);
      Alert.alert("Tracking Error", error.message);
    }
  };

  const handleSosPress = async () => {
    try {
      setLoading(true);

      const data = await startSos();

      if (!data?.sos?.id) {
        throw new Error("Invalid SOS response from server");
      }

      setActiveSos(data.sos);

      await startLocationUpdates(data.sos.id);

      if (data.alreadyActive) {
        Alert.alert(
          "SOS Already Active",
          "We have already sent your location to your emergency contacts and nearest police station. We will continue updating your live location."
        );
      } else {
        Alert.alert(
          "SOS Sent",
          "Your emergency contacts and nearest police station will receive your tracking link."
        );
      }
    } catch (error) {
      Alert.alert("SOS Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveSos = () => {
    if (!activeSos?.id) {
      Alert.alert("No Active SOS", "There is no active SOS to resolve.");
      return;
    }

    Alert.alert(
      "Confirm Safety",
      "Are you safe now? This will stop live location updates and mark your SOS as resolved.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, I'm Safe",
          onPress: confirmResolveSos,
        },
      ]
    );
  };

  const confirmResolveSos = async () => {
    try {
      setResolving(true);

      await resolveSos(activeSos.id);

      stopLocationUpdates();
      setActiveSos(null);

      Alert.alert(
        "SOS Resolved",
        "Your SOS has been marked as resolved. Live location updates have stopped."
      );
    } catch (error) {
      Alert.alert("Resolve Failed", error.message);
    } finally {
      setResolving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setMenuVisible(false);

      stopLocationUpdates();
      await stopBackgroundLocationTracking();

      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("user");

      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Logout Failed", error.message);
    }
  };

  const goToUserProfile = () => {
    setMenuVisible(false);
    navigation.navigate("UserProfile");
  };
  const goToSafeRoutes = () => {
    setMenuVisible(false);
    navigation.navigate("SafeRoutes");
  }
  const goToVolunteerProfile = () => {
    setMenuVisible(false);
    navigation.navigate("VolunteerProfile");
  };

  const getRiskDisplayText = () => {
    if (initialRiskLoading) return "Checking your area...";

    if (!currentRisk) return "Risk zone not checked yet";

    const level = currentRisk.risk_level;

    if (level === "critical") return "Critical Risk Zone";
    if (level === "high") return "High Risk Zone";
    if (level === "medium") return "Medium Risk Zone";
    if (level === "low") return "Low Risk Zone";

    return "Unknown Risk Zone";
  };

  const getRiskSubtitle = () => {
    if (initialRiskLoading) return "Fetching your current location once";

    if (!currentRisk) return "Waiting for location check";

    if (currentRisk.message) return currentRisk.message;

    const score = currentRisk.risk_score ?? 0;
    const district = currentRisk.district || "Unknown district";
    const source = currentRisk.source || "system";

    return `${district} • Score: ${Number(score).toFixed(1)} • Source: ${source}`;
  };

  const getRiskIconStyle = () => {
    const level = currentRisk?.risk_level;

    if (level === "critical" || level === "high") {
      return styles.iconDanger;
    }

    if (level === "medium") {
      return styles.iconMedium;
    }

    if (level === "low") {
      return styles.iconTracking;
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.phoneFrame}>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcome}>Welcome back,</Text>
              <Text style={styles.name}>{user?.name || "User"}</Text>
            </View>

            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={() => setMenuVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarText}>{getInitials()}</Text>

              <View style={[styles.badge, activeSos && styles.activeBadge]}>
                <Text style={styles.badgeText}>{activeSos ? "!" : "1"}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>
              {activeSos ? "SOS is active" : "Are you in danger?"}
            </Text>

            <Text style={styles.subtitle}>
              {activeSos
                ? "Your live SOS location is being updated every 30 seconds"
                : "Press the button — help will reach you soon"}
            </Text>

            <View style={styles.sosArea}>
              <Animated.View
                style={[
                  styles.outerPulse,
                  {
                    opacity: blinkAnim,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />

              <View style={styles.middlePulse} />

              <TouchableOpacity
                style={[styles.sosButton, activeSos && styles.sosButtonActive]}
                onPress={handleSosPress}
                disabled={loading || resolving}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.sosText}>
                    {activeSos ? "ACTIVE" : "SOS"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {activeSos && (
              <TouchableOpacity
                style={styles.safeButton}
                onPress={handleResolveSos}
                disabled={resolving || loading}
                activeOpacity={0.85}
              >
                {resolving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.safeButtonText}>
                    ✓ I'm Safe — Resolve SOS
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <View style={[styles.card, styles.riskCard]}>
              <View style={[styles.iconRed, getRiskIconStyle()]} />

              <View style={styles.cardTextBox}>
                <Text style={styles.locationLabel}>Current area risk</Text>

                <Text style={styles.locationText}>{getRiskDisplayText()}</Text>

                <Text style={styles.zoneText}>{getRiskSubtitle()}</Text>

                {/* {currentCoords && (
                  <Text style={styles.coordText}>
                    {currentCoords.latitude.toFixed(5)},{" "}
                    {currentCoords.longitude.toFixed(5)}
                  </Text>
                )} */}
              </View>

              {initialRiskLoading ? (
                <ActivityIndicator color={PRIMARY} />
              ) : (
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={fetchCurrentLocationRiskOnce}
                  activeOpacity={0.8}
                >
                  <Text style={styles.refreshText}>↻</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.iconLight} />

              <View style={styles.cardTextBox}>
                <Text style={styles.cardTitle}>Voice keyword trigger</Text>
                <Text style={styles.cardSubtitle}>
                  Say "সাহায্য করো" to activate
                </Text>
              </View>

              <Switch
                value={voiceEnabled}
                onValueChange={setVoiceEnabled}
                trackColor={{
                  false: "#FFD1DA",
                  true: SAFE_GREEN,
                }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.card}>
              <View style={styles.iconLight} />

              <View style={styles.cardTextBox}>
                <Text style={styles.cardTitle}>Live safety tracking</Text>
                <Text style={styles.cardSubtitle}>
                  Check risk zones in background
                </Text>
              </View>

              <Switch
                value={normalTrackingEnabled}
                onValueChange={handleNormalTrackingToggle}
                trackColor={{
                  false: "#FFD1DA",
                  true: SAFE_GREEN,
                }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.card, styles.locationCard]}>
              <View
                style={[
                  styles.iconRed,
                  normalTrackingEnabled && styles.iconTracking,
                ]}
              />

              <View style={styles.cardTextBox}>
                <Text style={styles.locationLabel}>Background tracking</Text>

                <Text style={styles.locationText}>
                  {normalTrackingEnabled
                    ? "Live tracking is ON"
                    : "Live tracking is OFF"}
                </Text>

                <Text style={styles.zoneText}>
                  {normalTrackingEnabled
                    ? "Nirvaya will notify you in high-risk zones"
                    : "Turn on tracking to get risk zone alerts"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomLine} />

          <Modal
            visible={menuVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setMenuVisible(false)}
            >
              <Pressable style={styles.menuBox}>
                <View style={styles.menuHeader}>
                  <View style={styles.menuAvatar}>
                    <Text style={styles.menuAvatarText}>{getInitials()}</Text>
                  </View>

                  <View style={styles.menuUserInfo}>
                    <Text style={styles.menuName}>{user?.name || "User"}</Text>
                    <Text style={styles.menuPhone}>{user?.phone || ""}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={goToUserProfile}
                >
                  <Text style={styles.menuText}>User Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={goToVolunteerProfile}
                >
                  <Text style={styles.menuText}>Volunteer Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={goToSafeRoutes}
                >
                  <Text style={styles.menuText}>Safe Routes Recommendation</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.logoutItem}
                  onPress={handleSignOut}
                >
                  <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDF1F4",
  },

  scrollView: {
    flex: 1,
    width: "100%",
  },

  scrollContent: {
    flexGrow: 1,
  },

  phoneFrame: {
    flexGrow: 1,
    width: "100%",
    backgroundColor: "#fff",
  },

  header: {
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE1E7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcome: {
    color: "#9A6A76",
    fontSize: 14,
  },

  name: {
    color: "#130015",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 4,
  },

  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  avatarText: {
    color: PRIMARY,
    fontWeight: "900",
    fontSize: 16,
  },

  badge: {
    position: "absolute",
    right: -3,
    top: -6,
    backgroundColor: PRIMARY,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  activeBadge: {
    backgroundColor: MEDIUM_ORANGE,
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    alignItems: "center",
  },

  title: {
    fontSize: 27,
    fontWeight: "900",
    color: "#130015",
  },

  subtitle: {
    color: "#9A6A76",
    marginTop: 8,
    fontSize: 15,
    textAlign: "center",
  },

  sosArea: {
    width: 260,
    height: 260,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 10,
  },

  outerPulse: {
    position: "absolute",
    width: 245,
    height: 245,
    borderRadius: 123,
    backgroundColor: PRIMARY,
  },

  middlePulse: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FFDCE4",
  },

  sosButton: {
    width: 155,
    height: 155,
    borderRadius: 78,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  sosButtonActive: {
    backgroundColor: "#C9183F",
  },

  sosText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
  },

  safeButton: {
    width: "100%",
    backgroundColor: SAFE_GREEN,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },

  safeButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },

  card: {
    width: "100%",
    backgroundColor: "#FFF7F8",
    borderWidth: 1,
    borderColor: "#FFC9D4",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  riskCard: {
    backgroundColor: "#FFF0F3",
  },

  locationCard: {
    backgroundColor: "#FFF0F3",
  },

  iconLight: {
    width: 47,
    height: 47,
    borderRadius: 12,
    backgroundColor: "#FFEAF0",
    marginRight: 14,
  },

  iconRed: {
    width: 47,
    height: 47,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    marginRight: 14,
  },

  iconTracking: {
    backgroundColor: SAFE_GREEN,
  },

  iconMedium: {
    backgroundColor: MEDIUM_ORANGE,
  },

  iconDanger: {
    backgroundColor: DANGER_RED,
  },

  cardTextBox: {
    flex: 1,
  },

  cardTitle: {
    color: "#130015",
    fontSize: 16,
    fontWeight: "800",
  },

  cardSubtitle: {
    color: "#9A6A76",
    marginTop: 4,
    fontSize: 13,
  },

  locationLabel: {
    color: "#9A6A76",
    fontSize: 15,
  },

  locationText: {
    color: "#130015",
    fontWeight: "800",
    marginTop: 4,
  },

  zoneText: {
    color: "#9A6A76",
    marginTop: 3,
    fontSize: 13,
    fontWeight: "600",
  },

  coordText: {
    color: "#9A6A76",
    marginTop: 3,
    fontSize: 12,
    fontWeight: "500",
  },

  refreshButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFEAF0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  refreshText: {
    color: PRIMARY,
    fontSize: 20,
    fontWeight: "900",
  },

  bottomLine: {
    height: 1,
    backgroundColor: "#FFE1E7",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "flex-end",
    paddingTop: 85,
    paddingRight: 22,
  },

  menuBox: {
    width: 245,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },

  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE1E7",
    marginBottom: 8,
  },

  menuAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF0F3",
    borderWidth: 1,
    borderColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  menuAvatarText: {
    color: PRIMARY,
    fontWeight: "900",
  },

  menuUserInfo: {
    flex: 1,
  },

  menuName: {
    color: "#130015",
    fontWeight: "900",
    fontSize: 15,
  },

  menuPhone: {
    color: "#9A6A76",
    fontSize: 12,
    marginTop: 2,
  },

  menuItem: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF0F3",
  },

  menuText: {
    color: "#130015",
    fontWeight: "700",
    fontSize: 15,
  },

  logoutItem: {
    paddingVertical: 13,
  },

  logoutText: {
    color: PRIMARY,
    fontWeight: "900",
    fontSize: 15,
  },
});