
import { LocalizedText as Text } from '../../components/LocalizedText';
import React, { useState } from "react";
import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  View,
  StyleSheet,
  Pressable,

  ActivityIndicator,
} from "react-native";
import { LocalizedAlert as Alert } from '../../components/LocalizedAlert';

import { Ionicons } from "@expo/vector-icons";
import { Button, Input } from "../../components";
import { colors } from "../../theme";
import api from "../../services/api";
import { useNavigation } from "@react-navigation/native";

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    // Check empty fields
    if (!newPassword || !confirmNewPassword) {
      Alert.alert("Missing Fields", "Please fill in all password fields.");
      return;
    }

    // Check minimum password length
    if (newPassword.length < 8) {
      Alert.alert(
        "Invalid Password",
        "Your new password must be at least 8 characters."
      );
      return;
    }

    // Check confirmation
    if (newPassword !== confirmNewPassword) {
      Alert.alert(
        "Password Mismatch",
        "New password and confirm password do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.patch(
        '/users/me/change-password',
        {
            newPassword,
        }
        );

      Alert.alert(
        "Success",
        response.data.message || "Password changed successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );

      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
  Alert.alert(
    "Error",
    "Unable to change password. Please try again."
  );
} finally {
  setLoading(false);
}
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Ionicons name="arrow-back" size={26} color="#000000" />
        </Pressable>

        <Text style={styles.titleChangePassword} numberOfLines={1}>
          Change Password
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Introduction */}
      <View style={styles.containChange}>
        <Text style={styles.titleChange}>
          Choose a new password
        </Text>

        <Text style={styles.paraghChange}>
          Enter your current password and choose a new password for your account.
        </Text>
      </View>

      {/* Password Form */}
      <View style={styles.containReset}>
        <View style={styles.containPassword}>

          {/* New Password */}
          <View style={styles.passwordWrapper}>
            <Input
              label="New Password"
              placeholder="Enter your new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.inputPass}
            />

            <Pressable
              onPress={() => setShowNewPassword((prev) => !prev)}
              style={styles.eyeBtn}
              hitSlop={8}
            >
              <Ionicons
                name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                size={22}
                color={colors.gray500}
              />
            </Pressable>
          </View>

          {/* Confirm New Password */}
          <View style={styles.passwordWrapper}>
            <Input
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.inputPass}
            />

            <Pressable
              onPress={() =>
                setShowConfirmPassword((prev) => !prev)
              }
              style={styles.eyeBtn}
              hitSlop={8}
            >
              <Ionicons
                name={
                  showConfirmPassword
                    ? "eye-outline"
                    : "eye-off-outline"
                }
                size={22}
                color={colors.gray500}
              />
            </Pressable>
          </View>
        </View>

        {/* Submit Button */}
        <Button
          onPress={handleChangePassword}
          title={loading ? "Updating..." : "Change Password"}
          disabled={loading}
        />

        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.gray500}
            style={styles.loading}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginHorizontal: 20,
    marginTop: 4,
  },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  backButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  headerSpacer: {
    width: 44,
  },

  titleChangePassword: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: "#0f172a",
  },

  containChange: {
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 20,
  },

  titleChange: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
    color: "#0f172a",
    marginBottom: 8,
  },

  paraghChange: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
    color: colors.gray500,
  },

  containReset: {
    flex: 1,
    justifyContent: "space-between",
    marginHorizontal: 20,
    paddingBottom: 20,
  },

  containPassword: {
    marginVertical: 10,
  },

  passwordWrapper: {
    position: "relative",
    marginVertical: 10,
  },

  eyeBtn: {
    position: "absolute",
    right: 14,
    bottom: 21,
  },

  inputPass: {
    marginBottom: 8,
  },

  loading: {
    marginTop: 10,
  },
});
