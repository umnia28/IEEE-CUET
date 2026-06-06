import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";

import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "../services/api";

const PRIMARY = "#ED234F";
const SAFE_GREEN = "#21A67A";

export default function UserProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nid, setNid] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        throw new Error("User token not found");
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load profile");
      }

      const profile = data.user;

      setUser(profile);
      setEmergencyContacts(data.emergency_contacts || []);

      setName(profile.name || "");
      setEmail(profile.email || "");
      setBirthDate(profile.birth_date ? profile.birth_date.slice(0, 10) : "");
      setGender(profile.gender || "");
      setPhoto(profile.photo_url ? { uri: profile.photo_url } : null);
    } catch (error) {
      Alert.alert("Profile Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please allow photo access to upload your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Image Error", error.message);
    }
  };

  const validateInputs = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Name is required.");
      return false;
    }

    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      Alert.alert("Validation Error", "Birth date must be in YYYY-MM-DD format.");
      return false;
    }

    if (gender && !["female", "male", "other"].includes(gender)) {
      Alert.alert("Validation Error", "Gender must be female, male, or other.");
      return false;
    }

    return true;
  };

  const updateProfile = async () => {
    try {
      if (!validateInputs()) return;

      setSaving(true);

      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        throw new Error("User token not found");
      }

      const formData = new FormData();

      formData.append("name", name.trim());

      if (email.trim()) {
        formData.append("email", email.trim());
      }

      if (nid.trim()) {
        formData.append("nid", nid.trim());
      }

      if (birthDate.trim()) {
        formData.append("birth_date", birthDate.trim());
      }

      if (gender.trim()) {
        formData.append("gender", gender.trim());
      }

      if (photo && photo.uri && !photo.uri.startsWith("http")) {
        const fileName = photo.uri.split("/").pop() || "profile.jpg";
        const fileType = fileName.split(".").pop();

        formData.append("photo", {
          uri: photo.uri,
          name: fileName,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
        });
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

      setUser(data.user);
      setNid("");

      if (data.user.photo_url) {
        setPhoto({ uri: data.user.photo_url });
      }

      await SecureStore.setItemAsync("user", JSON.stringify(data.user));

      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  const selectGender = (value) => {
    setGender(value);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>User Profile</Text>

          <View style={styles.backButton} />
        </View>

        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.photoBox} onPress={pickImage}>
            {photo?.uri ? (
              <Image source={{ uri: photo.uri }} style={styles.profileImage} />
            ) : (
              <Text style={styles.photoPlaceholder}>
                {name ? name[0].toUpperCase() : "U"}
              </Text>
            )}

            <View style={styles.photoEditBadge}>
              <Text style={styles.photoEditText}>+</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{user?.name || "User"}</Text>
          <Text style={styles.profilePhone}>{user?.phone}</Text>

          <View
            style={[
              styles.statusBadge,
              user?.profile_completed ? styles.completedBadge : styles.pendingBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {user?.profile_completed ? "Profile Completed" : "Profile Incomplete"}
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
            placeholderTextColor="#B88B96"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            placeholderTextColor="#B88B96"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>NID Number</Text>
          <TextInput
            style={styles.input}
            value={nid}
            onChangeText={setNid}
            placeholder={
              user?.nid_submitted
                ? "NID already submitted. Enter new NID to update."
                : "Enter NID number"
            }
            placeholderTextColor="#B88B96"
            keyboardType="number-pad"
          />

         
          <Text style={styles.label}>Birth Date</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#B88B96"
          />

          <Text style={styles.label}>Gender</Text>

          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "female" && styles.genderButtonActive,
              ]}
              onPress={() => selectGender("female")}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === "female" && styles.genderTextActive,
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "male" && styles.genderButtonActive,
              ]}
              onPress={() => selectGender("male")}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === "male" && styles.genderTextActive,
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === "other" && styles.genderButtonActive,
              ]}
              onPress={() => selectGender("other")}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === "other" && styles.genderTextActive,
                ]}
              >
                Other
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>

          {emergencyContacts.length === 0 ? (
            <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
          ) : (
            emergencyContacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                  <Text style={styles.contactRelation}>
                    {contact.relation || "No relation added"}
                  </Text>
                </View>

                {contact.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={updateProfile}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
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
  },

  scrollContent: {
    paddingBottom: 40,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#FDF1F4",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#9A6A76",
    fontWeight: "700",
  },

  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#FFE1E7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontSize: 20,
    fontWeight: "900",
    color: "#130015",
  },

  profileCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE1E7",
  },

  photoBox: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#FFF0F3",
    borderWidth: 3,
    borderColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
  },

  photoPlaceholder: {
    color: PRIMARY,
    fontSize: 42,
    fontWeight: "900",
  },

  photoEditBadge: {
    position: "absolute",
    right: 0,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  photoEditText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: -2,
  },

  profileName: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: "900",
    color: "#130015",
  },

  profilePhone: {
    marginTop: 4,
    color: "#9A6A76",
    fontWeight: "700",
  },

  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },

  completedBadge: {
    backgroundColor: "#E8FFF7",
  },

  pendingBadge: {
    backgroundColor: "#FFF0F3",
  },

  statusText: {
    color: "#130015",
    fontSize: 12,
    fontWeight: "800",
  },

  formCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#FFE1E7",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#130015",
    marginBottom: 14,
  },

  label: {
    color: "#9A6A76",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#FFF7F8",
    borderWidth: 1,
    borderColor: "#FFC9D4",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#130015",
    fontWeight: "700",
  },

  smallNote: {
    color: "#9A6A76",
    fontSize: 12,
    marginTop: 7,
  },

  genderRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 3,
  },

  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#FFF7F8",
    borderWidth: 1,
    borderColor: "#FFC9D4",
    alignItems: "center",
  },

  genderButtonActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },

  genderText: {
    color: "#9A6A76",
    fontWeight: "800",
  },

  genderTextActive: {
    color: "#fff",
  },

  emptyText: {
    color: "#9A6A76",
    fontWeight: "700",
  },

  contactCard: {
    backgroundColor: "#FFF7F8",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFC9D4",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  contactName: {
    color: "#130015",
    fontSize: 15,
    fontWeight: "900",
  },

  contactPhone: {
    color: "#130015",
    marginTop: 3,
    fontWeight: "700",
  },

  contactRelation: {
    color: "#9A6A76",
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
  },

  primaryBadge: {
    backgroundColor: "#E8FFF7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },

  primaryBadgeText: {
    color: SAFE_GREEN,
    fontSize: 12,
    fontWeight: "900",
  },

  saveButton: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: PRIMARY,
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: "center",
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});