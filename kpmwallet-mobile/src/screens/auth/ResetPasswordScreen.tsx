import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/authNavigator";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, Pressable, Text, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input } from "../../components";
import { colors, radii, spacing, typography } from '../../theme';
import api from "../../services/api";


type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export default function VeficationScreen({
  navigation,
  route,
}: Props){

    const {nric, role, email, otp} = route.params;
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    
const handleResetPassword = async () => {
  // 1. Semak password kosong
  if (!newPassword || !confirmPassword) {
    Alert.alert("Error", "Please fill in both password fields.");
    return;
  }

  // 2. Semak panjang password
  if (newPassword.length < 8) {
    Alert.alert(
      "Weak Password",
      "Password must be at least 8 characters.",
    );
    return;
  }

  // 3. Pastikan kedua-dua password sama
  if (newPassword !== confirmPassword) {
    Alert.alert(
      "Password Mismatch",
      "Your passwords do not match.",
    );
    return;
  }

  try {
    setLoading(true);

    // 4. Hantar password baharu kepada backend
    const response = await api.post(
      "/auth/reset-password",
      {
        nric,
        role,
        email,
        otp,
        newPassword,
      },
    );

    if (response.data.success) {
  Alert.alert(
    "Success",
    "Your password has been reset successfully.",
    [
      {
        text: "OK",
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: "RoleSelect" }],
          });
        },
      },
    ],
  );
}
  } catch (error: any) {
    const message =
      error.response?.data?.message ??
      "Unable to reset password. Please try again.";

    Alert.alert(
      "Reset Password Failed",
      Array.isArray(message) ? message.join(", ") : message,
    );
  } finally {
    setLoading(false);
  }
};


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={({ pressed }) => [
                        styles.backButton,
                        pressed && styles.backButtonPressed,
                    ]}
                >
                    <Ionicons name="arrow-back" size={30} color="#000000" />
                </Pressable>
                <Text style={styles.titleReset}>Create New Password</Text>
                <Text style={styles.paraghReset}>Create new password to your account.</Text>
            </View>

            {/* body for reset password */}
            <View style={styles.containReset}>

                <View style={styles.containPassword}>
                    {/* untuk newPassword */}
                    <View style={styles.passwordWrapper}>
                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={showPassword}
                            autoCapitalize="none"
                            containerStyle={styles.inputPass}
                        />
                        <Pressable
                            onPress={() => setShowPassword(prev => !prev)}
                            style={styles.eyeBtn}
                            hitSlop={8}
                        >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color={colors.gray500}
                        />
                        </Pressable>
                    </View>

                    {/* untuk confirm password */}
                    <View style={styles.passwordWrapper}>
                        <Input
                            label="Confirm Password"
                            placeholder="Enter your confirm password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                           secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            containerStyle={styles.inputPass}
                        />
                        <Pressable
                            onPress={() => setShowPassword(prev => !prev)}
                            style={styles.eyeBtn}
                            hitSlop={8}
                        >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color={colors.gray500}
                        />
                        </Pressable>
                    </View>
                </View>

                <Button
                onPress={handleResetPassword}
                title={loading ? "Updating..." : "Create Password"}
                disabled={loading}
                />
            </View>
        </SafeAreaView>
    )
}

const styles= StyleSheet.create({
    container: {
        flex:1,
        backgroundColor:"#ffffff"
    },
    header:{
        justifyContent:"flex-start",
        marginHorizontal: 20,
        flexDirection:"column"
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
    titleReset:{
        fontSize:30,
        fontWeight:700,
        marginVertical:10
    },
    paraghReset :{
        fontSize:17,
        fontWeight:400,
    },
   containReset:{
    flex:1,
    justifyContent:"space-between",
    marginHorizontal: 20,
    paddingBottom: 20,
},
    containPassword:{
        marginVertical:10
    },
    passwordWrapper: {
        position: 'relative',
        marginVertical:10
    },
    eyeBtn: {
        position: 'absolute',
        right: 14,
        bottom: 21,
    },
    inputPass: {
        marginBottom: 8,
    },
})