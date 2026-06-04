import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../services/api";

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    nid: "",
    birth_date: "",
    gender: "female",
  });

  const [emergencyContacts, setEmergencyContacts] = useState([
    {
      name: "",
      phone: "",
      relation: "",
      is_primary: true,
    },
  ]);

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateContact = (index, field, value) => {
    const updatedContacts = [...emergencyContacts];
    updatedContacts[index][field] = value;
    setEmergencyContacts(updatedContacts);
  };

  const addContact = () => {
    setEmergencyContacts((prev) => [
      ...prev,
      {
        name: "",
        phone: "",
        relation: "",
        is_primary: false,
      },
    ]);
  };

  const removeContact = (index) => {
    if (emergencyContacts.length === 1) {
      Alert.alert("Required", "At least one emergency contact is required");
      return;
    }

    const updatedContacts = emergencyContacts.filter((_, i) => i !== index);

    updatedContacts[0].is_primary = true;

    setEmergencyContacts(updatedContacts);
  };

  const validateForm = () => {
    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.nid ||
      !form.birth_date ||
      !form.gender
    ) {
      Alert.alert("Missing Information", "Please fill in all personal information");
      return false;
    }

    if (form.password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters");
      return false;
    }

    for (const contact of emergencyContacts) {
      if (!contact.name || !contact.phone) {
        Alert.alert(
          "Missing Contact",
          "Each emergency contact must have name and phone number"
        );
        return false;
      }
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          nid: form.nid.trim(),
          birth_date: form.birth_date.trim(),
          gender: form.gender.toLowerCase(),
          emergency_contacts: emergencyContacts.map((contact, index) => ({
            name: contact.name.trim(),
            phone: contact.phone.trim(),
            relation: contact.relation.trim(),
            is_primary: index === 0,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Registration Failed", data.message || "Something went wrong");
        return;
      }

      await SecureStore.setItemAsync("token", data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));
      Alert.alert("Success", "Account created successfully");

      
      navigation.replace("Home");
    } catch (error) {
      console.log("Register error:", error);
      Alert.alert("Network Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topSection}>
        <Text style={styles.logo}>Nirvaya</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Join your personal safety network
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={form.name}
          onChangeText={(text) => updateForm("name", text)}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="example@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(text) => updateForm("email", text)}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="017XXXXXXXX"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(text) => updateForm("phone", text)}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          secureTextEntry
          value={form.password}
          onChangeText={(text) => updateForm("password", text)}
        />

        <Text style={styles.label}>NID Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your NID number"
          keyboardType="number-pad"
          value={form.nid}
          onChangeText={(text) => updateForm("nid", text)}
        />

        <Text style={styles.label}>Birth Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={form.birth_date}
          onChangeText={(text) => updateForm("birth_date", text)}
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {["female", "male", "other"].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.genderButton,
                form.gender === item && styles.genderButtonActive,
              ]}
              onPress={() => updateForm("gender", item)}
            >
              <Text
                style={[
                  styles.genderText,
                  form.gender === item && styles.genderTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <Text style={styles.helperText}>
          Add at least one trusted person who will be alerted during SOS.
        </Text>

        {emergencyContacts.map((contact, index) => (
          <View key={index} style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Text style={styles.contactTitle}>
                Contact {index + 1}
                {index === 0 ? "  • Primary" : ""}
              </Text>

              {emergencyContacts.length > 1 && (
                <TouchableOpacity onPress={() => removeContact(index)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>Contact Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Mother / Father / Friend"
              value={contact.name}
              onChangeText={(text) => updateContact(index, "name", text)}
            />

            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="018XXXXXXXX"
              keyboardType="phone-pad"
              value={contact.phone}
              onChangeText={(text) => updateContact(index, "phone", text)}
            />

            <Text style={styles.label}>Relation</Text>
            <TextInput
              style={styles.input}
              placeholder="Mother, Father, Sister, Friend"
              value={contact.relation}
              onChangeText={(text) => updateContact(index, "relation", text)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addContact}>
          <Text style={styles.addButtonText}>+ Add Another Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginText}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7F8",
  },
  topSection: {
    backgroundColor: "#c6586f",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
  },
  subtitle: {
    color: "#FFE5EA",
    fontSize: 16,
    marginTop: 8,
  },
  formCard: {
    margin: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#c6586f",
    marginTop: 10,
    marginBottom: 12,
  },
  helperText: {
    color: "#7C6B70",
    marginBottom: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6E4B55",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFF3F5",
    borderWidth: 1,
    borderColor: "#FFD1DA",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 14,
    color: "#222",
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#FFF3F5",
    borderWidth: 1,
    borderColor: "#FFD1DA",
    alignItems: "center",
  },
  genderButtonActive: {
    backgroundColor: "#c6586f",
    borderColor: "#c6586f",
  },
  genderText: {
    color: "#7C4D59",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  genderTextActive: {
    color: "#FFFFFF",
  },
  contactCard: {
    backgroundColor: "#FFF8F9",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE1E7",
    marginBottom: 16,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  contactTitle: {
    color: "#c6586f",
    fontWeight: "800",
  },
  removeText: {
    color: "#B00020",
    fontWeight: "700",
  },
  addButton: {
    borderWidth: 1,
    borderColor: "#c6586f",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: {
    color: "#c6586f ",
    fontWeight: "800",
  },
  submitButton: {
    backgroundColor: "#c6586f",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  loginText: {
    color: "#c6586f",
    textAlign: "center",
    fontWeight: "700",
    marginTop: 20,
  },
});