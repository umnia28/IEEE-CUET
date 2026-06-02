import { TextInput, StyleSheet } from "react-native";

export default function CustomInput({ placeholder, value, onChangeText, secureTextEntry }) {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#8a6b73"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#fff5f7",
    borderWidth: 1,
    borderColor: "#ffc6d1",
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    marginBottom: 12,
  },
});