import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthStackParamList } from "../../navigation/authNavigator";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components";
import { spacing } from "../../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Verification">;

export default function VeficationScreen({
  navigation,
  route,
}: Props) {

    // 1. Set masa countdown kepada 5 minit (300 saat)
  const [timeLeft, setTimeLeft] = useState(300);

  // 2. Countdown setiap saat
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // 3. Tukar saat kepada minit dan saat
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
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
                            <Text style={styles.titleForgot}>Verification</Text>
                            <Text style={styles.paraghForgot}>We've sent OTP to your email. Please enter 6 digits code your receive.</Text>
                        </View>

            {/* body untuk user masukkan otp  */}
            <View style={styles.containerOtp}>
                <View style={styles.containOtp}>
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <TextInput
                            key={item}
                            style={styles.otpInput}
                            keyboardType="number-pad"
                            maxLength={1}
                            textAlign="center"
                        />
                        ))}
                </View>

                <View style={styles.containBottom}>
                    <Button 
                        title="Verify"
                        onPress={()=>{}}
                    />
                    {/* Countdown OTP */}
                        <Text style={styles.countdown}>
                            {timeLeft > 0
                                ? `OTP expires in ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
                                : "OTP has expired"}
                        </Text>
                    <View style={styles.containReceive}>
                       <Text>Didn't you receive any code?</Text>
                        <Pressable onPress={()=> {}} style={styles.receiveBtn} hitSlop={8}>
                            <Text style={styles.titleReceive}>Receive code</Text>
                        </Pressable> 
                    </View>
                    
                </View>
                
            </View>
            
        </SafeAreaView>
    )
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
    containerOtp:{
        flex: 1,
        justifyContent:"space-between",
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
        marginHorizontal: 20
    },
    containOtp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  otpInput: {
    width: 44,
    height: 52,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 10,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  containBottom:{
    flexDirection:"column"
  },
  containReceive:{
    flexDirection:"row",
    marginVertical:10,
    justifyContent: "center"
  },
  receiveBtn:{
    justifyContent:"center",
  },
  titleReceive:{
    fontSize:15,
    color: "#757171",
    marginLeft:5
  },
  countdown: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
    marginTop: 16,
},
})