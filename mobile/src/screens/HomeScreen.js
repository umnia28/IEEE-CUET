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
} from "react-native";
import * as SecureStore from "expo-secure-store";

import {
  startSos,
  startLocationUpdates,
  stopLocationUpdates,
  resolveSos,
} from "../services/sosService";

const PRIMARY = "#ED234F";
const SAFE_GREEN = "#21A67A";

export default function HomeScreen() {
  const [user, setUser] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [activeSos, setActiveSos] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const blinkAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    loadUser();
    startPulseAnimation();

    return () => {
      stopLocationUpdates();
    };
  }, []);

  const loadUser = async () => {
    const storedUser = await SecureStore.getItemAsync("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
          style: "default",
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

  const getInitials = () => {
    if (!user?.name) return "U";

    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.phoneFrame}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.name}>{user?.name || "User"}</Text>
          </View>

          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarText}>{getInitials()}</Text>

            <View style={[styles.badge, activeSos && styles.activeBadge]}>
              <Text style={styles.badgeText}>{activeSos ? "!" : "1"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            {activeSos ? "SOS is active" : "Are you in danger?"}
          </Text>

          <Text style={styles.subtitle}>
            {activeSos
              ? "Your live location is being updated every 30 seconds"
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
                <Text style={styles.sosText}>{activeSos ? "ACTIVE" : "SOS"}</Text>
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
                <Text style={styles.safeButtonText}>✓ I'm Safe — Resolve SOS</Text>
              )}
            </TouchableOpacity>
          )}

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

          <View style={[styles.card, styles.locationCard]}>
            <View style={styles.iconRed} />

            <View>
              <Text style={styles.locationLabel}>Your location</Text>
              <Text style={styles.locationText}>
                Kafrul, Dhaka — Zone: Safe ✓
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomLine} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDF1F4",
    alignItems: "center",
  },

  phoneFrame: {
    flex: 1,
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
    backgroundColor: "#FF9900",
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
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
    width: 280,
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 12,
  },

  outerPulse: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: PRIMARY,
  },

  middlePulse: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "#FFDCE4",
  },

  sosButton: {
    width: 165,
    height: 165,
    borderRadius: 83,
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
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 2,
  },

  safeButton: {
    width: "100%",
    backgroundColor: SAFE_GREEN,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
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
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
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

  locationCard: {
    backgroundColor: "#FFF0F3",
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

  bottomLine: {
    height: 1,
    backgroundColor: "#FFE1E7",
  },
});