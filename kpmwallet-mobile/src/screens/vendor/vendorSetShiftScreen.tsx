import { View, Text, StyleSheet, Pressable, TextInput, Modal, Platform, ScrollView,  Animated, Easing, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import api from "../../services/api";

const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getFullYear()}`;
};

export default function VendorSetShiftScreen() {
    const [shiftStarted, setShiftStarted] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closingCash, setClosingCash] = useState("");
    const [shiftDate, setShiftDate] = useState<Date | null>(null);
    const [tempShiftDate, setTempShiftDate] = useState<Date>(new Date()); //bahagian sini date sementara yang user pilih
    const [dateText, setDateText] = useState("");
    const [dateError, setDateError] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const navigation = useNavigation();
    const [startingCash, setStartingCash] = useState("");

    //ni untuk usestate bahagian timepicker
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [selectedHour, setSelectedHour] = useState(9);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [startShift, setStartShift] = useState<string | null>(null);
    const [endShift, setEndShift] = useState<string | null>(null);

    //dekat sini kita sedia kan list hours dan minutes
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    
    // ni untuk animation
    const slideAnim = useState(new Animated.Value(500))[0];

    const handleOpenCloseModal = () => {
        setShowCloseModal(true);
        slideAnim.setValue(800);

        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    };

    const formatDateForDB = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    //bahagian sini untuk tukar format time
    function formatTime(time: string): string {
        const [hours, minutes] = time.split('.');

        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
        }

    // bila vendor taip
    const handleDateText = (text: string) => {
        const digits = text.replace(/\D/g, "").slice(0, 8);

        let out = digits;

        if (digits.length > 2) {
            out = digits.slice(0, 2) + "/" + digits.slice(2);
        }

        if (digits.length > 4) {
            out = out.slice(0, 5) + "/" + digits.slice(4);
        }

        setDateText(out);

        if (digits.length === 0) {
            setShiftDate(null);
            setDateError(false);
            return;
        }

        if (digits.length < 8) {
            setShiftDate(null);
            setDateError(false);
            return;
        }

        const d = Number(digits.slice(0, 2));
        const m = Number(digits.slice(2, 4));
        const y = Number(digits.slice(4));

        const parsed = new Date(y, m - 1, d);

        const valid =
            parsed.getFullYear() === y &&
            parsed.getMonth() === m - 1 &&
            parsed.getDate() === d;

        if (valid) {
            setShiftDate(parsed);
            setDateError(false);
        } else {
            setShiftDate(null);
            setDateError(true);
        }
    };

    const handleMainButton = async() => {
        try{
            if (!shiftStarted) {
                //handle form empty
                if(!shiftDate || !shiftDate || !endShift || !startShift || !startingCash){
                    Alert.alert(
                        "Failed",
                        "Please fill in all fields"
                    )
                    return
                } 

                //bahagian sini if form semua diisi
                setShiftStarted(true);
                const response = await api.post("/shift", {
                    user_id: 1,
                    date: formatDateForDB(shiftDate),
                    start_shift: startShift ? `${startShift}:00`: null,
                    end_shift: endShift ? `${endShift}:00`: null,
                    starting_cash: Number(startingCash),
                    shift_status: !shiftStarted,
                });
            
                const result = response.data;
                if (result.shift_id) {
                    //bila user dh enter data then kita kosongkan terus form
                    setShiftStarted(true);
                    setDateText("");
                    setStartShift(null);
                    setEndShift(null);
                    setStartingCash("");
                    
                    //bila user dh berjaya create then display message to user
                    Alert.alert(
                        "Success",
                        `Your shift has started. Shift ID: ${result.shift_id}`
                    );
                } else {
                    Alert.alert(
                        "Failed",
                        "Unable to start shift."
                    );
                }
                return result;
            } else {
                handleOpenCloseModal();
            }
        }catch (error) {
            //console.error("Start shift error:", error);

            Alert.alert(
                "Unable to Start Shift",
                "Internal server problem. Please try again."
            );
        }
    };

    const handleConfirmClose = () => {
        //simpan closingCash
        setShowCloseModal(false);
        setClosingCash("");
        setShiftStarted(false);         
    };
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.headerContain}>
                        <Pressable
                            onPress={() => navigation.goBack()}
                            style={({ pressed }) => [
                                styles.backButton,
                                pressed && styles.backButtonPressed,
                            ]}
                        >
                            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                        </Pressable>
                        <View style={styles.containSet}>
                            <Text style={styles.titleSet}>Set Shift</Text>
                        </View>
                    </View>

                    {/* Logo dan title */}
                    <View style={styles.containerLogoTitle}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="calculator-outline" size={34} color="#4F46E5" />
                        </View>
                        <View style={styles.containTitle}>
                            <Text style={styles.titleCash}>
                                Set your time shift and also enter the cash amount in your
                                register before you begin selling.
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.containDetails}>
                    <Text style={styles.titleDetails}>Shift Details</Text>
                </View>

                {/* Body: start, end, cash dan button */}
                <View style={styles.bodyShift}>
                    <Text style={styles.label}>Shift Date</Text>
                <View
                    style={[
                        styles.field,
                        showDatePicker && styles.fieldActive,
                        dateError && styles.fieldError,
                    ]}
                >
                    
                <Pressable
                    onPress={() => {
                        setTempShiftDate(shiftDate ?? new Date());
                        setShowDatePicker(true);
                    }}
                    hitSlop={10}
                >
                    <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#000000"
                    />
                </Pressable>


                    <TextInput
                        style={[styles.input, { marginLeft: 10 }]}
                        value={dateText}
                        onChangeText={handleDateText}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        maxLength={10}
                    />
                </View>

                {dateError && <Text style={styles.errorText}>Enter a valid date</Text>}

                {/* so dekat sini date popup bila user tekan */}          
                <Modal
                    visible={showDatePicker}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowDatePicker(false)}
                >
                    <View style={styles.dateModalOverlay}>
                        <View style={styles.dateModalCard}>
                            <Text style={styles.dateModalTitle}>
                                Select Shift Date
                            </Text>

                            <DateTimePicker
                                value={tempShiftDate}
                                mode="date"
                                display="inline"
                                onValueChange={(event, date) => {
                                    if (date) {
                                        setTempShiftDate(date);
                                    }
                                }}
                            />

                            {/* Cancel dan Done */}
                            <View style={styles.dateButtonCol}>
                                <Pressable
                                    style={styles.dateDoneButton}
                                    onPress={() => {
                                        setShiftDate(tempShiftDate);
                                        setDateText(formatDate(tempShiftDate));
                                        setDateError(false);
                                        setShowDatePicker(false);
                                    }}
                                >
                                    <Text style={styles.dateDoneText}>
                                        Done
                                    </Text>
                                </Pressable>
                                
                                <Pressable
                                    style={styles.dateCancelButton}
                                    onPress={() => {
                                        setShowDatePicker(false);
                                    }}
                                >
                                    <Text style={styles.dateCancelText}>
                                        Cancel
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* so dekat bahagian sini untuk start shift time */}
                <Text style={styles.label}>Start Shift</Text>
                <Pressable
                        style={styles.field}
                        onPress={() => {
                            const [hour, minute] = (startShift ?? "09:00")
                                .split(":")
                                .map(Number);

                            setSelectedHour(hour);
                            setSelectedMinute(minute);
                            setShowStartTimePicker(true);
                        }}
                >
                    <Ionicons name="time-outline" size={20} color="#000000" style={styles.icon} />
                    <Text style={styles.input} >
                        {startShift ?? <Text style={styles.placeholderShift}> Select Start Shift</Text>}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                </Pressable>

                {/* so di bahagian sini untuk shift end time */}
                <Text style={styles.label}>End Shift</Text>
                <Pressable
                    style={styles.field}
                    onPress={() => {
                        const [hour, minute] = (endShift ?? "09:00")
                            .split(":")
                            .map(Number);
                            setSelectedHour(hour);
                            setSelectedMinute(minute);
                            setShowEndTimePicker(true);
                        }}
                >
                    <Ionicons name="time-outline" size={20} color="#000000" style={styles.icon}/>
                    <Text style={styles.input}>
                        {endShift ?? <Text style={styles.placeholderShift}>Select end time</Text>}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                </Pressable>

                {/* modal for time start shift */}
                <Modal
                    visible={showStartTimePicker}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowStartTimePicker(false)}
                >
                    <View style={styles.dateModalOverlay}>
                        <View style={styles.dateModalCard}>
                            <Text style={styles.dateModalTitle}>
                                Select Start Time
                            </Text>

                            <View style={{ flexDirection: "row", gap: 16 }}>
                                {/* Hours */}
                                <View style={{ flex: 1 }}>
                                    <Text style={{ textAlign: "center" }}>HOURS</Text>

                                    <ScrollView style={{ height: 200 }}>
                                        {hours.map((hour) => (
                                            <Pressable
                                                key={hour}
                                                onPress={() => setSelectedHour(hour)}
                                                style={{
                                                    padding: 12,
                                                    alignItems: "center",
                                                    backgroundColor:
                                                        selectedHour === hour
                                                            ? "#4F46E5"
                                                            : "#FFFFFF",
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color:
                                                            selectedHour === hour
                                                                ? "#FFFFFF"
                                                                : "#1E1B4B",
                                                        fontWeight:
                                                            selectedHour === hour
                                                                ? "700"
                                                                : "400",
                                                    }}
                                                >
                                                    {String(hour).padStart(2, "0")}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Minutes */}
                                <View style={{ flex: 1 }}>
                                    <Text style={{ textAlign: "center" }}>MINUTES</Text>

                                    <ScrollView style={{ height: 200 }}>
                                        {minutes.map((minute) => (
                                            <Pressable
                                                key={minute}
                                                onPress={() => setSelectedMinute(minute)}
                                                style={{
                                                    padding: 12,
                                                    alignItems: "center",
                                                    backgroundColor:
                                                        selectedMinute === minute
                                                            ? "#4F46E5"
                                                            : "#FFFFFF",
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color:
                                                            selectedMinute === minute
                                                                ? "#FFFFFF"
                                                                : "#1E1B4B",
                                                        fontWeight:
                                                            selectedMinute === minute
                                                                ? "700"
                                                                : "400",
                                                    }}
                                                >
                                                    {String(minute).padStart(2, "0")}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            <Pressable
                                style={styles.dateDoneButton}
                                onPress={() => {
                                    setStartShift(
                                        `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`
                                    );
                                    setShowStartTimePicker(false);
                                }}
                            >
                                <Text style={styles.dateDoneText}>
                                    Confirm
                                </Text>
                            </Pressable>

                            <Pressable
                                style={styles.dateCancelButton}
                                onPress={() => setShowStartTimePicker(false)}
                            >
                                <Text style={styles.dateCancelText}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                {/* modal for time end shift */}
                <Modal
                    visible={showEndTimePicker}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowEndTimePicker(false)}
                >
                    <View style={styles.dateModalOverlay}>
                        <View style={styles.dateModalCard}>
                            <Text style={styles.dateModalTitle}>
                                Select End Time
                            </Text>

                            <View style={{ flexDirection: "row", gap: 16 }}>
                                {/* Hours */}
                                <View style={{ flex: 1 }}>
                                    <Text style={{ textAlign: "center" }}>HOURS</Text>

                                    <ScrollView style={{ height: 200 }}>
                                        {hours.map((hour) => (
                                            <Pressable
                                                key={hour}
                                                onPress={() => setSelectedHour(hour)}
                                                style={{
                                                    padding: 12,
                                                    alignItems: "center",
                                                    backgroundColor:
                                                        selectedHour === hour
                                                            ? "#4F46E5"
                                                            : "#FFFFFF",
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color:
                                                            selectedHour === hour
                                                                ? "#FFFFFF"
                                                                : "#1E1B4B",
                                                        fontWeight:
                                                            selectedHour === hour
                                                                ? "700"
                                                                : "400",
                                                    }}
                                                >
                                                    {String(hour).padStart(2, "0")}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Minutes */}
                                <View style={{ flex: 1 }}>
                                    <Text style={{ textAlign: "center" }}>MINUTES</Text>

                                    <ScrollView style={{ height: 200 }}>
                                        {minutes.map((minute) => (
                                            <Pressable
                                                key={minute}
                                                onPress={() => setSelectedMinute(minute)}
                                                style={{
                                                    padding: 12,
                                                    alignItems: "center",
                                                    backgroundColor:
                                                        selectedMinute === minute
                                                            ? "#4F46E5"
                                                            : "#FFFFFF",
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color:
                                                            selectedMinute === minute
                                                                ? "#FFFFFF"
                                                                : "#1E1B4B",
                                                        fontWeight:
                                                            selectedMinute === minute
                                                                ? "700"
                                                                : "400",
                                                    }}
                                                >
                                                    {String(minute).padStart(2, "0")}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            <Pressable
                                style={styles.dateDoneButton}
                                onPress={() => {
                                    setEndShift(
                                        `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`
                                    );
                                    setShowEndTimePicker(false);
                                }}
                            >
                                <Text style={styles.dateDoneText}>
                                    Confirm 
                                </Text>
                            </Pressable>

                            <Pressable
                                style={styles.dateCancelButton}
                                onPress={() => setShowEndTimePicker(false)}
                            >
                                <Text style={styles.dateCancelText}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                    <Text style={styles.label}>Starting Cash</Text>

                    <View style={styles.field}>
                    <Text style={styles.currency}>RM</Text>

                    <TextInput
                        style={styles.input}
                        value={startingCash}
                        onChangeText={(text) => {
                            setStartingCash(text);
                        }}
                        placeholder="0.00"
                        placeholderTextColor="#94A3B8"
                        keyboardType="decimal-pad"
                    />
                </View>

                {/* Quick cash chips */}
                <View style={styles.chipRow}>
                    {[50, 100, 200].map((amount) => (
                        <Pressable
                            key={amount}
                            onPress={() => setStartingCash(String(amount))}
                            style={[
                                styles.chip,
                                startingCash === String(amount) && styles.chipActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    startingCash === String(amount) &&
                                        styles.chipTextActive,
                                ]}
                            >
                                RM {amount}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                    <View style={styles.containButton}>
                        <Pressable
                            onPress={handleMainButton}
                            style={({ pressed }) => [
                                styles.mainButton,
                                shiftStarted && styles.mainButtonClose,
                                pressed && styles.mainButtonPressed,
                            ]}
                        >
                            <Text style={styles.mainButtonText}>
                                {shiftStarted ? "Close Shift" : "Start Shift"}
                            </Text>
                        </Pressable>
                    </View>

                </View>
                {/* Reminder */}
                <View style={styles.reminderRow}>
                    <Ionicons name="information-circle-outline" size={18} color="#6366F1" />
                    <Text style={styles.reminderText}>
                        Make sure the cash matches your register before starting.
                    </Text>
                </View>
            </ScrollView>

            {/* Modal popup bila user end shift */}
            <Modal
                visible={showCloseModal}
                transparent
                animationType="none"
                onRequestClose={() => setShowCloseModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalCard,
                            {
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >

                        <View style={styles.modalIcon}>
                            <Ionicons name="cash-outline" size={30} color="#4F46E5" />
                        </View>

                        <Text style={styles.modalTitle}>Close Cash</Text>
                        <Text style={styles.modalDesc}>
                            Count the cash in your register and enter the exact amount.
                        </Text>

                        <View style={styles.modalField}>
                            <Text style={styles.currency}>RM</Text>
                            <TextInput
                                style={styles.input}
                                value={closingCash}
                                onChangeText={setClosingCash}
                                placeholder="0.00"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                            />
                        </View>

                        <Button title="Confirm Close Shift" onPress={handleConfirmClose} />

                        <Pressable
                            onPress={() => setShowCloseModal(false)}
                            style={styles.cancelButton}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>

                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    container: {
        flex: 1,
    },
    scrollContent: {
    paddingBottom: 30,
},

    // Header
    header: {
        flexDirection: "column",
        width: "100%",
        alignItems: "flex-start",
        justifyContent: "space-between",
        minHeight: 230,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 20,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        backgroundColor: "#4F46E5",

        // iOS Shadow
        shadowColor: "#312E81",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 14,

        // Android Shadow
        elevation: 8,
    },
    headerContain: {
        flexDirection: "row",
        width: "100%",
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
    containSet: {
        flex: 1,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 44,
    },
    titleSet: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
        letterSpacing: 0.3,
    },
    containerLogoTitle: {
        width: "100%",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
    },
    iconContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
        width: 64,
        height: 64,

        shadowColor: "#1E1B4B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    containTitle: {
        marginTop: 8,
        marginHorizontal: 24,
    },
    titleCash: {
        textAlign: "center",
        fontSize: 14,
        lineHeight: 21,
        color: "#E0E7FF",
        fontWeight: "500",
        letterSpacing: 0.2,
    },

    containDetails: {
        marginTop: 28,
        marginHorizontal: 20,
    },
    titleDetails: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1E1B4B",
    },

    bodyShift: {
        marginTop: 14,
        marginHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#E0E7FF",
        padding: 20,

        // iOS Shadow
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,

        // Android Shadow
        elevation: 4,
    },
    fieldActive: {
    borderColor: "#6366F1",
    backgroundColor: "#EEF2FF",
},
fieldError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
},
errorText: {
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
    fontSize: 12,
    color: "#DC2626",
},
    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#64748B",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    field: {
        flexDirection: "row",
        alignItems: "center",
        height: 52,
        paddingHorizontal: 14,
        marginBottom: 18,
        backgroundColor: "#fffafa",
        borderWidth: 1.5,
        borderColor: "#E0E7FF",
        borderRadius: 14,
    },
    fieldText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: "600",
        color: "#1E1B4B",
    },
    placeholder: {
        color: "#94A3B8",
        fontWeight: "500",
    },
    icon:{
        marginRight: 10,
        color:"#00000"
    },
    currency: {
        fontSize: 16,
        fontWeight: "700",
        color: "#000000",
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: "#1E1B4B",
    },

    // Duration preview
    durationRow: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginTop: -6,
        marginBottom: 18,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#EEF2FF",
        borderRadius: 999,
    },
    
    // Quick cash chips
    chipRow: {
        flexDirection: "row",
        marginTop: -6,
        marginBottom: 22,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: "#E0E7FF",
        backgroundColor: "#FFFFFF",
    },
    chipActive: {
        backgroundColor: "#4F46E5",
        borderColor: "#4F46E5",
    },
    chipText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#4F46E5",
    },
    chipTextActive: {
        color: "#FFFFFF",
    },

    // Button
    containButton: {
        marginTop: 6,
    },
    reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginHorizontal: 20,
},
reminderText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
},
modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30,27,75,0.55)",
    justifyContent: "flex-end",
},

modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: "40%",
    padding: 24,
    paddingBottom: 35,
},
modalIcon: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
},
modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E1B4B",
    textAlign: "center",
},
modalDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
},
modalField: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 14,
    marginBottom: 18,
    backgroundColor: "#F8FAFF",
    borderWidth: 1.5,
    borderColor: "#E0E7FF",
    borderRadius: 14,
},
cancelButton: {
    alignItems: "center",
    paddingVertical: 14,
},
cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
},
mainButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
},
mainButtonClose: {
    backgroundColor: "#DC2626", 
},
mainButtonPressed: {
    opacity: 0.85,
},
mainButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
},
dateModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30,27,75,0.55)",
    justifyContent: "center",
    alignItems: "center",
},

dateModalCard: {
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
},

dateModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E1B4B",
    marginBottom: 10,
},

dateButtonCol: {
    flexDirection: "column",
    width: "100%",
    gap: 10,
},

dateCancelButton: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
},

dateCancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748B",
},
dateDoneButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#4F46E5",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
},

dateDoneText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
},
placeholderShift:{
    color: "#94A3B8"
}
});