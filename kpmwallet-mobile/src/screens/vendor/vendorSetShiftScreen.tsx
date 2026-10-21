import { View, StyleSheet, Pressable, Modal, Platform, ScrollView, Animated, Easing, Keyboard, KeyboardAvoidingView } from "react-native";
import { LocalizedTextInput as TextInput } from '../../components/LocalizedTextInput';
import { LocalizedAlert as Alert } from '../../components/LocalizedAlert';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import api from "../../services/api";

const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getFullYear()}`;
};

type ShiftCloseSummary = {
    hasActiveShift: boolean;
    starting_cash: number;
    summary: {
        total_sales: number;
        transaction_count: number;
        cash_total: number;
        qr_total: number;
        expected_cash: number;
    };
};

export default function VendorSetShiftScreen() {
    const [shiftStarted, setShiftStarted] = useState(false);
    const [activeShift, setActiveShift] = useState<any>(null);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closingCash, setClosingCash] = useState("");
    const [closingShift, setClosingShift] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [closeSummary, setCloseSummary] = useState<ShiftCloseSummary | null>(null);
    const [shiftDate, setShiftDate] = useState<Date | null>(null);
    const [tempShiftDate, setTempShiftDate] = useState<Date>(new Date()); //bahagian sini date sementara yang user pilih
    const [dateText, setDateText] = useState("");
    const [dateError, setDateError] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const navigation = useNavigation<any>();
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

    useEffect(() => {
        let mounted = true;
        api.get("/shift/current").then(({ data }) => {
            if (mounted) {
                const isOpen = data?.shift_status === "OPEN";
                setActiveShift(isOpen ? data : null);
                setShiftStarted(isOpen);
            }
        }).catch((error) => {
            console.error("Failed to load current shift:", error?.response?.data ?? error);
        });
        return () => { mounted = false; };
    }, []);

    //function akan dipanggil untuk kita buka modal
    const handleOpenCloseModal = async () => {
        setShowCloseModal(true);
        setSummaryLoading(true);
        setClosingCash("");
        setCloseSummary(null);
        slideAnim.setValue(800);

        //dekat sini kita nak buat animasi tu bergerak dari satu nilai ke satu nilai
        Animated.timing(slideAnim, {
            toValue: 0, //nilai akhir
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();

        try {
            const { data } = await api.get<ShiftCloseSummary>("/transaction/current-shift");
            if (!data.hasActiveShift) {
                setShowCloseModal(false);
                setActiveShift(null);
                setShiftStarted(false);
                Alert.alert("No active shift", "Set a new shift before recording sales.");
                return;
            }
            setCloseSummary(data);
        } catch (error: any) {
            setShowCloseModal(false);
            const message = error?.response?.data?.message;
            Alert.alert(
                "Unable to load shift totals",
                Array.isArray(message) ? message.join("\n") : message || "Please try again."
            );
        } finally {
            setSummaryLoading(false);
        }
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
                const response = await api.post("/shift", {
                    user_id: 1,
                    date: formatDateForDB(shiftDate),
                    start_shift: startShift ? `${startShift}:00`: null,
                    end_shift: endShift ? `${endShift}:00`: null,
                    starting_cash: Number(startingCash),
                    shift_status: "OPEN",
                });

                const result = response.data;
                if (result.shift_id) {
                    //bila user dh enter data then kita kosongkan terus form
                    setActiveShift(result);
                    setShiftStarted(true);
                    setDateText("");
                    setStartShift(null);
                    setEndShift(null);
                    setStartingCash("");

                    //bila user dh berjaya create then display message to user
                    Alert.alert(
                        "Success",
                        `Your shift has started. Shift ID: ${result.shift_id}`,
                        [{ text: "OK", onPress: () => navigation.goBack() }]
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
        }catch (error: any) {
            const message = error?.response?.data?.message;
            if (error?.response?.status === 409) {
                try {
                    const { data } = await api.get("/shift/current");
                    if (data?.shift_status === "OPEN") {
                        setActiveShift(data);
                        setShiftStarted(true);
                    }
                } catch (refreshError) {
                    console.error("Failed to refresh shift after start conflict:", refreshError);
                }
            }
            Alert.alert(
                "Unable to Start Shift",
                Array.isArray(message)
                    ? message.join("\n")
                    : message ?? (error?.response
                        ? `Request failed (${error.response.status}). Please try again.`
                        : "Cannot reach the server. Check your connection and try again.")
            );
        }
    };

    const startingCashTotal = Number(closeSummary?.starting_cash ?? activeShift?.starting_cash ?? 0);
    const cashSalesTotal = Number(closeSummary?.summary.cash_total ?? 0);
    const qrSalesTotal = Number(closeSummary?.summary.qr_total ?? 0);
    const totalSales = Number(closeSummary?.summary.total_sales ?? 0);
    const expectedCash = Number(closeSummary?.summary.expected_cash ?? startingCashTotal + cashSalesTotal);
    const enteredClosingCash = closingCash.trim() ? Number(closingCash) : 0;
    const safeClosingCash = Number.isFinite(enteredClosingCash) ? enteredClosingCash : 0;
    const discrepancy = Math.round((safeClosingCash - expectedCash) * 100) / 100;
    const transactionCount = Number(closeSummary?.summary.transaction_count ?? 0);

    const formatAmount = (amount: number) => `RM ${Number(amount).toFixed(2)}`;

    const handleConfirmClose = async () => {
        const amount = Number(closingCash);
        if (!closingCash.trim() || !Number.isFinite(amount) || amount < 0) {
            Alert.alert("Invalid closing cash", "Enter a valid cash amount to end the shift.");
            return;
        }

        setClosingShift(true);
        try {
            await api.patch("/shift/current/end", { closing_cash: amount });
            setShowCloseModal(false);
            setClosingCash("");
            setActiveShift(null);
            setShiftStarted(false);
            setShiftDate(null);
            setDateText("");
            setDateError(false);
            setStartShift(null);
            setEndShift(null);
            setStartingCash("");
        } catch (error: any) {
            const message = error?.response?.data?.message;
            Alert.alert("Unable to end shift", Array.isArray(message) ? message.join("\n") : message || "Please try again.");
        } finally {
            setClosingShift(false);
        }
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
                    <View style={shiftStarted ? styles.hidden : undefined}>
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
                    </View>

                    {shiftStarted && activeShift && (
                        <View style={styles.activeShiftCard}>
                            <Text style={styles.activeShiftHeading}>Active shift</Text>
                            <Text style={styles.activeShiftDate}>
                                {(() => {
                                    const [year, month, day] = String(activeShift.date).slice(0, 10).split("-").map(Number);
                                    return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
                                        weekday: "long", day: "2-digit", month: "short", year: "numeric",
                                    });
                                })()}
                            </Text>
                            <View style={styles.activeShiftTimes}>
                                <Text style={styles.activeShiftDetail}>Start  {activeShift.start_shift?.slice(0, 5) ?? "--:--"}</Text>
                                <Text style={styles.activeShiftDetail}>End  {activeShift.end_shift?.slice(0, 5) ?? "--:--"}</Text>
                            </View>
                            <Text style={styles.activeShiftDetail}>
                                Starting cash  RM {Number(activeShift.starting_cash ?? 0).toFixed(2)}
                            </Text>
                        </View>
                    )}

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
                                {shiftStarted ? "End Shift" : "Start Shift"}
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
                onRequestClose={() => {
                    Keyboard.dismiss();
                    setShowCloseModal(false);
                }}
            >
                <KeyboardAvoidingView
                    style={styles.modalAvoidingView}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View style={styles.modalOverlay}>
                        <Pressable
                            style={StyleSheet.absoluteFill}
                            onPress={() => {
                                Keyboard.dismiss();
                                setShowCloseModal(false);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Cancel end shift"
                        />
                        <Animated.View
                            style={[
                                styles.modalCard,
                                {
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                          <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalContent}
                          >

                        <View style={styles.modalIcon}>
                            <Ionicons name="cash-outline" size={30} color="#4F46E5" />
                        </View>

                        <Text style={styles.modalTitle}>Close Cash</Text>
                        <Text style={styles.modalDesc}>
                            Enter the cash counted in your register. Sales totals are for this shift.
                        </Text>

                        <View style={styles.summaryCard}>
                            {summaryLoading && !closeSummary ? (
                                <Text style={styles.summaryLoading}>Loading shift totals...</Text>
                            ) : (
                                <>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Starting Cash</Text>
                                        <Text style={styles.summaryValue}>{formatAmount(startingCashTotal)}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Cash Sales</Text>
                                        <Text style={styles.summaryValue}>{formatAmount(cashSalesTotal)}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>QR Sales</Text>
                                        <Text style={styles.summaryValue}>{formatAmount(qrSalesTotal)}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Total Sales</Text>
                                        <Text style={styles.summaryValue}>{formatAmount(totalSales)}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Expected Cash</Text>
                                        <Text style={styles.summaryValue}>{formatAmount(expectedCash)}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Closing Cash</Text>
                                        <View style={styles.summaryInput}>
                                            <Text style={styles.summaryInputPrefix}>RM</Text>
                                            <TextInput
                                                style={styles.summaryInputValue}
                                                value={closingCash}
                                                onChangeText={setClosingCash}
                                                placeholder="0.00"
                                                placeholderTextColor="#94A3B8"
                                                keyboardType="decimal-pad"
                                                returnKeyType="done"
                                                onSubmitEditing={() => Keyboard.dismiss()}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Discrepancy</Text>
                                        <Text style={[
                                            styles.summaryValue,
                                            discrepancy === 0 ? styles.discrepancyEven : styles.discrepancyMismatch,
                                        ]}>
                                            {discrepancy < 0 ? "-" : ""}{formatAmount(Math.abs(discrepancy))}
                                        </Text>
                                    </View>
                                    <View style={[styles.summaryRow, styles.summaryLastRow]}>
                                        <Text style={styles.summaryLabel}>Transactions</Text>
                                        <Text style={styles.summaryValue}>{transactionCount}</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        <Button
                            title={closingShift ? "Ending Shift..." : summaryLoading ? "Loading totals..." : "Confirm End Shift"}
                            onPress={handleConfirmClose}
                            disabled={closingShift || summaryLoading || !closeSummary}
                        />

                        <Pressable
                            onPress={() => {
                                Keyboard.dismiss();
                                setShowCloseModal(false);
                            }}
                            style={styles.cancelButton}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                          </ScrollView>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
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
        backgroundColor: "#0041C2",

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
    hidden: {
        display: "none",
    },
    activeShiftCard: {
        padding: 18,
        marginBottom: 18,
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        borderRadius: 16,
    },
    activeShiftHeading: {
        fontSize: 16,
        fontWeight: "800",
        color: "#166534",
        marginBottom: 6,
    },
    activeShiftDate: {
        fontSize: 14,
        color: "#334155",
        marginBottom: 12,
    },
    activeShiftTimes: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    activeShiftDetail: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155",
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
modalAvoidingView: {
    flex: 1,
},

modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
},
modalContent: {
    paddingBottom: 24,
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
summaryCard: {
    paddingHorizontal: 14,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAF0",
    borderRadius: 14,
},
summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 38,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E7EAF0",
},
summaryLastRow: {
    borderBottomWidth: 0,
},
summaryLabel: {
    flex: 1,
    fontSize: 12,
    color: "#64748B",
},
summaryValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    textAlign: "right",
},
summaryInput: {
    width: 126,
    height: 32,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
},
summaryInputPrefix: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginRight: 4,
},
summaryInputValue: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    textAlign: "right",
},
summaryLoading: {
    paddingVertical: 18,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
},
discrepancyEven: {
    color: "#15803D",
},
discrepancyMismatch: {
    color: "#DC2626",
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
    backgroundColor: "#0041C2",
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
