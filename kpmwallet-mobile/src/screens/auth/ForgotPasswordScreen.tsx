import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import type { AuthStackParamList } from "../../navigation/authNavigator";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input } from "../../components";
import { spacing } from "../../theme";
import api from "../../services/api";


type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen ({
  navigation,
  route,
}: Props) {

    const {nric, role} = route.params;
    const [email, setEmail] = useState("");


    
const handleContinue = async () => {
  if (!email.trim()) {
    Alert.alert("Error", "Please enter your email.");
    return;
  }

  try {
    const response = await api.post(
      "/auth/forgot-password",
      {
        nric,
        role,
        email: email.trim(),
      },
    );

    const result = response.data;

    if (!result.success) {
      Alert.alert(
        "Failed",
        result.message || "Unable to send OTP.",
      );
      return;
    }

    Alert.alert(
      "OTP Sent",
      "Please check your email for the OTP.",
      [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("Verification", {
              nric: result.nric,
              role: result.role,
              email: result.email,
            });
          },
        },
      ],
    );
  } catch (error) {
    console.log("Forgot password error:", error);

    Alert.alert(
      "Server Problem",
      "Unable to connect to the server. Please try again.",
    );
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
                <Text style={styles.titleForgot}>Forgot Password</Text>
                <Text style={styles.paraghForgot}>Please enter your email to get OTP</Text>
            </View>

            {/* bahagian sini body untuk contain forgot password */}
            <View style={styles.contain}>
                <Input 
                    label="Email"
                    placeholder="Enter your Email"
                    value={email}
                    onChangeText={setEmail}
                    containerStyle={styles.input}

                />
                <Button
                    title="Continue"
                    onPress={handleContinue}
                />    
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
    titleForgot:{
        fontSize:30,
        fontWeight:700,
        marginVertical:10
    },
    paraghForgot :{
        fontSize:17,
        fontWeight:400,
    },
    contain :{
        flex: 1,
        justifyContent: "space-between",
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
        marginHorizontal: 20
    },
    input:{
        marginBottom: spacing.lg,
    }
})