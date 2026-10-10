import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { VendorStackParamList } from "../../navigation/vendorNavigator";

type NavigationProp = NativeStackNavigationProp<
    VendorStackParamList,
    "VendorTabs"
>;

type ShiftHistory = {
    id: string;
    date: string;
    start: string;
    end: string;
    duration: string;
    status: string;
};

export default function VendorShiftScreen() {

    const [history, setHistory] = useState<ShiftHistory[]>([]);

    const navigation = useNavigation<NavigationProp>();

    const handleStartShift = () => {
        navigation.navigate("ShiftDetails");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

                <View style={styles.containTitle}>
                    <Text style={styles.title}>Shift</Text>
                    <Text style={styles.dateText}>Friday, 09 Oct 2026</Text>
                </View>

                {/* Current Shift */}
                <View style={styles.shift}>

                    <View style={styles.shiftHeader}>
                        <Text style={styles.shiftLabel}>Current shift</Text>
 
                        <View style={styles.statusPill}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusPillText}>
                                Active
                            </Text>
                        </View>
                    </View>

                    <View style={styles.containShift}>
 
                        <View style={styles.timeContain}>
                            <Text style={styles.timeTitle}>Start</Text>
                            <Text style={styles.time}>08:30</Text>
                        </View>
 
                        <Text style={styles.arrow}>→</Text>
 
                        <View style={[styles.timeContain, styles.timeRight]}>
                            <Text style={styles.timeTitle}>End</Text>
                            <Text style={styles.time}>18:00</Text>
                        </View>
 
                    </View>
                    <View style={styles.progressTrack}>
                        <View
                            style={[
                                styles.progressFill,
                                // { width: `${currentShift.progress * 100}%` }
                                {width:"50%"},
                            ]}
                        />
                    </View>
 
                    <Text style={styles.durationText}>
                        Duration 1h 0m
                    </Text>
 
                    <View style={styles.shiftDivider} />

                    <View style={styles.containCashButton}>
                        <View style={styles.cashStart}>
                            <Text style={styles.timeTitle}>Starting cash</Text>
                            <Text style={styles.cash}>
                                <Text style={styles.currency}>RM </Text>
                                200:00
                            </Text>
                        </View>

                        <View style={styles.containButton}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.setShiftButton,
                                pressed && { opacity: 0.85 },
                            ]}
                            onPress={handleStartShift}
                        >
                            <Ionicons name="options-outline" size={18} color="#0041C2" />
                            <Text style={styles.setShiftText}>Set Shift</Text>
                        </Pressable>
                    </View>
                </View>

                </View>

                {/* History Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.titleHistory}>
                        History Shift
                    </Text>
                </View>

                {/* History */}
                <View style={styles.history}>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                    >
                        {history.length === 0 ? (

                            <View style={styles.historyFalse}>
                                <Text style={styles.historyFalseText}>
                                    No History Shift Yet
                                </Text>
                            </View>

                        ) : (

                            history.map((item, index) => (

                                <View
                                    key={item.id}
                                    style={[
                                        styles.historyRow,
                                        index !== history.length - 1 &&
                                            styles.historyDivider,
                                    ]}
                                >

                                    <View style={styles.historyLeft}>

                                        <Text style={styles.historyDate}>
                                            {item.date}
                                        </Text>

                                        <Text style={styles.historyTime}>
                                            {item.start} - {item.end}
                                        </Text>

                                    </View>

                                    <View style={styles.historyRight}>

                                        <Text style={styles.historyDuration}>
                                            {item.duration}
                                        </Text>

                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>
                                                {item.status}
                                            </Text>
                                        </View>

                                    </View>

                                </View>

                            ))
                        )}
                    </ScrollView>

                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#EEF2FF",
    },

    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    containTitle: {
        paddingHorizontal: 4,
        paddingTop: 20,
        paddingBottom: 24,
    },
     dateText: {
        fontSize: 13,
        color: "#64748B",
        marginBottom: 2,
    },
    title: {
        fontSize: 40,
        fontWeight: "700",
    },
    shift: {
        backgroundColor: "#0041C2",
        width: "100%",
        borderRadius: 24,
        padding: 20,
 
        // iOS Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
 
        // Android Shadow
        elevation: 4,
    },
    shiftHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    shiftLabel: {
        fontSize: 13,
        color: "#C7D2FE",
    },
    statusPill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#4ADE80",
        marginRight: 6,
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    containShift: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginTop: 14,
    },
    timeContain: {
        flex: 1,
    },
    timeRight: {
        alignItems: "flex-end",
    },
    timeTitle: {
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "#C7D2FE",
        marginBottom: 2,
    },
    time: {
        fontSize: 34,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    arrow: {
        fontSize: 22,
        color: "#C7D2FE",
        marginHorizontal: 10,
    },
     progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(255,255,255,0.2)",
        marginTop: 14,
        overflow: "hidden",
    },
    progressFill: {
        height: 6,
        borderRadius: 3,
        backgroundColor: "#FFFFFF",
    },
    durationText: {
        fontSize: 12,
        color: "#C7D2FE",
        marginTop: 6,
    },
 
    shiftDivider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.18)",
        marginTop: 16,
    },
    containCashButton: {
    flexDirection: "row",
    justifyContent: "space-around", 
    alignItems: "center",
    marginTop: 16,
},
   cashStart: {
        
    },
    cash: {
        fontSize: 26,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    currency: {
        fontSize: 14,
        fontWeight: "500",
        color: "#C7D2FE",
    },
    containButton: {
      
    },
    setShiftButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 14,
        paddingHorizontal: 18,            
        borderRadius: 12,
    },
    setShiftText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0041C2",
        marginLeft: 8,
    },
    titleContainer:{
        marginVertical:20,
        marginHorizontal:15,
    },
    titleHistory: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0F172A",
    },
    history: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    flex: 1,
    marginBottom: 16,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,

    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,

    // Android Shadow
    elevation: 4,
},

historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
},

historyDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
},

historyLeft: {
    flex: 1,
},

historyRight: {
    alignItems: "flex-end",
},

historyDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
},

historyTime: {
    fontSize: 14,
    color: "#64748B",
},

historyDuration: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
},

badge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
},

badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
},
historyFalse: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
},

historyFalseText: {
    fontSize: 16,
    color: "#64748B",
},
});