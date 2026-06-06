import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";

import { API_URL } from "../services/api";

const PRIMARY = "#ED234F";
const SAFE_GREEN = "#21A67A";
const ORANGE = "#FF9900";
const DARK = "#130015";
const MUTED = "#9A6A76";

export default function SafeRoutesScreen({ navigation }) {
  const mapRef = useRef(null);
  const autocompleteTimer = useRef(null);

  const [destinationText, setDestinationText] = useState("");
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const [district, setDistrict] = useState("Dhaka");

  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);

  const [routes, setRoutes] = useState([]);
  const [selectedRouteRank, setSelectedRouteRank] = useState(1);

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    getCurrentLocation();

    return () => {
      if (autocompleteTimer.current) {
        clearTimeout(autocompleteTimer.current);
      }
    };
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Location Permission Needed",
          "Please allow location permission to suggest safe routes."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);

      mapRef.current?.animateToRegion(
        {
          ...coords,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        },
        800
      );
    } catch (error) {
      Alert.alert("Location Error", error.message);
    } finally {
      setLoadingLocation(false);
    }
  };

  const getAuthToken = async () => {
    const token = await SecureStore.getItemAsync("token");

    if (!token) {
      throw new Error("User token not found. Please login again.");
    }

    return token;
  };

  const handleDestinationChange = (text) => {
    setDestinationText(text);
    setSelectedDestination(null);
    setRoutes([]);
    setDestinationLocation(null);

    if (autocompleteTimer.current) {
      clearTimeout(autocompleteTimer.current);
    }

    autocompleteTimer.current = setTimeout(() => {
      fetchDestinationSuggestions(text);
    }, 500);
  };

  const fetchDestinationSuggestions = async (text) => {
    try {
      if (!text || text.trim().length < 2) {
        setDestinationSuggestions([]);
        return;
      }

      if (!currentLocation) {
        return;
      }

      setLoadingSuggestions(true);

      const token = await getAuthToken();

      const params = new URLSearchParams({
        text: text.trim(),
        latitude: String(currentLocation.latitude),
        longitude: String(currentLocation.longitude),
      });

      const response = await fetch(
        `${API_URL}/routes/autocomplete?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load suggestions");
      }

      setDestinationSuggestions(data.suggestions || []);
    } catch (error) {
      console.log("Autocomplete error:", error.message);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setSelectedDestination(suggestion);
    setDestinationText(suggestion.label || suggestion.name || "");
    setDestinationSuggestions([]);
    Keyboard.dismiss();
  };

  const convertGeometryToMapCoords = (geometry) => {
    return geometry.map(([longitude, latitude]) => ({
      latitude,
      longitude,
    }));
  };

  const getRouteColor = (rank) => {
    if (rank === 1) return SAFE_GREEN;
    if (rank === 2) return ORANGE;
    return "#777777";
  };

  const formatDistance = (meters) => {
    if (!meters) return "Unknown distance";
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "Unknown time";
    return `${Math.round(seconds / 60)} min`;
  };

  const fitMapToRoutes = (receivedRoutes, start, destination) => {
    if (!mapRef.current || !receivedRoutes.length || !start || !destination) {
      return;
    }

    const coordinates = [];

    coordinates.push(start);

    coordinates.push({
      latitude: destination.latitude,
      longitude: destination.longitude,
    });

    receivedRoutes.forEach((route) => {
      const routeCoords = convertGeometryToMapCoords(route.geometry || []);
      coordinates.push(...routeCoords);
    });

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 80,
        right: 60,
        bottom: 360,
        left: 60,
      },
      animated: true,
    });
  };

  const getSafeRoutes = async () => {
    try {
      if (!currentLocation) {
        Alert.alert("Location Missing", "Please get your current location first.");
        return;
      }

      if (!destinationText.trim()) {
        Alert.alert("Destination Missing", "Please enter your destination.");
        return;
      }

      setLoadingRoutes(true);
      setDestinationSuggestions([]);

      const token = await getAuthToken();

      const response = await fetch(`${API_URL}/routes/safe-alternatives`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          start_latitude: currentLocation.latitude,
          start_longitude: currentLocation.longitude,
          destination: selectedDestination?.label || destinationText.trim(),
          district,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to get safe routes");
      }

      const receivedRoutes = data.routes || [];

      setRoutes(receivedRoutes);
      setDestinationLocation(data.destination);
      setSelectedRouteRank(1);

      setTimeout(() => {
        fitMapToRoutes(receivedRoutes, currentLocation, data.destination);
      }, 400);
    } catch (error) {
      Alert.alert("Route Error", error.message);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const selectRoute = (rank) => {
    setSelectedRouteRank(rank);
  };

  const selectedRoute = routes.find(
    (route) => route.safety_rank === selectedRouteRank
  );

  const initialRegion = {
    latitude: currentLocation?.latitude || 23.7456,
    longitude: currentLocation?.longitude || 90.4208,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <View style={styles.screen}>
      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your location"
            description="Starting point"
            pinColor={SAFE_GREEN}
          />
        )}

        {destinationLocation && (
          <Marker
            coordinate={{
              latitude: destinationLocation.latitude,
              longitude: destinationLocation.longitude,
            }}
            title="Destination"
            description={destinationLocation.label}
            pinColor={PRIMARY}
          />
        )}

        {routes.map((route) => (
          <Polyline
            key={route.safety_rank}
            coordinates={convertGeometryToMapCoords(route.geometry || [])}
            strokeColor={getRouteColor(route.safety_rank)}
            strokeWidth={selectedRouteRank === route.safety_rank ? 8 : 4}
            tappable
            onPress={() => selectRoute(route.safety_rank)}
          />
        ))}
      </MapView>

      <View style={styles.headerOverlay}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Safe Routes</Text>

        <View style={styles.backButton} />
      </View>

      <View style={styles.bottomSheet}>
        <KeyboardAvoidingView
  style={styles.bottomSheet}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Find a safer route</Text>
          <Text style={styles.subtitle}>
            Enter a destination. Nirvaya will rank routes from safest available
            to least preferred.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destination</Text>

            <TextInput
              style={styles.input}
              value={destinationText}
              onChangeText={handleDestinationChange}
              placeholder="Search place, e.g. Mirpur 10"
              placeholderTextColor="#B88B96"
            />

            {loadingSuggestions && (
              <View style={styles.suggestionLoading}>
                <ActivityIndicator size="small" color={PRIMARY} />
                <Text style={styles.suggestionLoadingText}>Searching...</Text>
              </View>
            )}

            {destinationSuggestions.length > 0 && (
              <View style={styles.suggestionBox}>
                {destinationSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.label}-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(item)}
                  >
                    <Text style={styles.suggestionTitle}>
                      {item.name || item.label}
                    </Text>

                    <Text style={styles.suggestionSubtitle}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>District</Text>

            <View style={styles.districtRow}>
              <TouchableOpacity
                style={[
                  styles.districtButton,
                  district === "Dhaka" && styles.districtButtonActive,
                ]}
                onPress={() => setDistrict("Dhaka")}
              >
                <Text
                  style={[
                    styles.districtText,
                    district === "Dhaka" && styles.districtTextActive,
                  ]}
                >
                  Dhaka
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.districtButton,
                  district === "Chattogram" && styles.districtButtonActive,
                ]}
                onPress={() => setDistrict("Chattogram")}
              >
                <Text
                  style={[
                    styles.districtText,
                    district === "Chattogram" && styles.districtTextActive,
                  ]}
                >
                  Chattogram
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={getCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator color={PRIMARY} />
              ) : (
                <Text style={styles.secondaryText}>Use Current</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={getSafeRoutes}
              disabled={loadingRoutes}
            >
              {loadingRoutes ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>Find Routes</Text>
              )}
            </TouchableOpacity>
          </View>

          {currentLocation && (
            <Text style={styles.coordText}>
              Start: {currentLocation.latitude.toFixed(5)},{" "}
              {currentLocation.longitude.toFixed(5)}
            </Text>
          )}

          {destinationLocation && (
            <Text style={styles.coordText}>
              Destination: {destinationLocation.label}
            </Text>
          )}

          {routes.length > 0 && (
            <View style={styles.routeList}>
              <Text style={styles.routeListTitle}>Suggested routes</Text>

              {routes.map((route) => (
                <TouchableOpacity
                  key={route.safety_rank}
                  style={[
                    styles.routeCard,
                    selectedRouteRank === route.safety_rank &&
                      styles.routeCardActive,
                  ]}
                  onPress={() => selectRoute(route.safety_rank)}
                >
                  <View style={styles.routeHeader}>
                    <View
                      style={[
                        styles.rankBadge,
                        {
                          backgroundColor: getRouteColor(route.safety_rank),
                        },
                      ]}
                    >
                      <Text style={styles.rankText}>#{route.safety_rank}</Text>
                    </View>

                    <View style={styles.routeTitleBox}>
                      <Text style={styles.routeTitle}>{route.label}</Text>
                      <Text style={styles.routeSubtitle}>
                        Tap to highlight on map
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.routeMeta}>
                    {formatDistance(route.distance_meters)} •{" "}
                    {formatDuration(route.duration_seconds)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedRoute && (
            <Text style={styles.selectedText}>
              Selected route: {selectedRoute.label}
            </Text>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  map: {
    flex: 1,
  },

  headerOverlay: {
    position: "absolute",
    top: 45,
    left: 18,
    right: 18,
    height: 54,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#FFE1E7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 34,
    color: PRIMARY,
    marginTop: -4,
  },

  headerTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: "900",
  },

  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "58%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: "#FFE1E7",
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: DARK,
  },

  subtitle: {
    marginTop: 5,
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },

  inputGroup: {
    marginTop: 14,
  },

  label: {
    color: MUTED,
    fontWeight: "800",
    fontSize: 13,
    marginBottom: 7,
  },

  input: {
    backgroundColor: "#FFF7F8",
    borderWidth: 1,
    borderColor: "#FFC9D4",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: DARK,
    fontWeight: "700",
    fontSize: 15,
  },

  suggestionLoading: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  suggestionLoadingText: {
    marginLeft: 8,
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },

  suggestionBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FFC9D4",
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
  },

  suggestionItem: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF0F3",
  },

  suggestionTitle: {
    color: DARK,
    fontWeight: "900",
    fontSize: 14,
  },

  suggestionSubtitle: {
    color: MUTED,
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
  },

  districtRow: {
    flexDirection: "row",
    gap: 10,
  },

  districtButton: {
    flex: 1,
    backgroundColor: "#FFF7F8",
    borderWidth: 1,
    borderColor: "#FFC9D4",
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: "center",
  },

  districtButtonActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },

  districtText: {
    color: MUTED,
    fontWeight: "900",
  },

  districtTextActive: {
    color: "#fff",
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: PRIMARY,
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryText: {
    color: "#fff",
    fontWeight: "900",
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderColor: PRIMARY,
    borderWidth: 1,
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryText: {
    color: PRIMARY,
    fontWeight: "900",
  },

  coordText: {
    marginTop: 9,
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
  },

  routeList: {
    marginTop: 14,
  },

  routeListTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: "900",
  },

  routeCard: {
    backgroundColor: "#FFF7F8",
    borderWidth: 1,
    borderColor: "#FFC9D4",
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
  },

  routeCardActive: {
    borderColor: PRIMARY,
    backgroundColor: "#FFF0F3",
  },

  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  rankBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    marginRight: 10,
  },

  rankText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },

  routeTitleBox: {
    flex: 1,
  },

  routeTitle: {
    color: DARK,
    fontWeight: "900",
    fontSize: 15,
  },

  routeSubtitle: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  routeMeta: {
    marginTop: 9,
    color: MUTED,
    fontWeight: "700",
  },

  selectedText: {
    marginTop: 12,
    color: PRIMARY,
    fontWeight: "800",
  },
});