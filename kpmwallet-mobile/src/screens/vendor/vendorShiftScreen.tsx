import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { LocalizedText as Text } from '../../components/LocalizedText';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { VendorStackParamList } from "../../navigation/vendorNavigator";
import api from "../../services/api";

type NavigationProp = NativeStackNavigationProp<
    VendorStackParamList,
    "VendorTabs"
>;

type ShiftHistory = {
    id: string;
    date: string;
    start: string;
    end: string;
    status: string;
};
type ShiftRecord = {
    shift_id: number;
    date: string;
    start_shift: string;
    end_shift: string | null;
    starting_cash: number;
    shift_status: string;
    closed_at?: string | null;
    closing_cash?: number | string | null;
};

//kita nak kira duration from startshift to end shift
const getDuration = (start: string, end: string, language = 'en') => {
  const [startHour, startMinute] = start
    .slice(0, 5)
    .split(":")
    .map(Number);

  const [endHour, endMinute] = end
    .slice(0, 5)
    .split(":")
    .map(Number);

  let totalMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

  //dibahagian sini bila time lebih pukul 12 malam then dia jadi negative (-1200) => kita kena betulkan negative tu guna code dibawah
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  //so guna padstart untuk kita nk tambah aksara(no, simbol, huruf) dibahagian depan string
  const hourUnit = language === 'ms' ? 'jam' : 'h';
  const minuteUnit = language === 'ms' ? 'minit' : 'm';
  return `${String(hours).padStart(2, "0")} ${hourUnit} ${String(minutes).padStart(2, "0")} ${minuteUnit}`;
};

//kita nak buat progress track
const getShiftProgress = ( start: string, end: string, now = new Date()) => {
  const [startHour, startMinute] = start
    .slice(0, 5) //kita ambil 5 character daripada data
    .split(":") //kita pisahkan dia kepada hours dengan minutes
    .map(Number); // then tukarkan dia kepada number

  const [endHour, endMinute] = end
    .slice(0, 5)
    .split(":")
    .map(Number);

  //bahagian sini kita tukarkan waktu kepada minute => untuk memudahkan pengiraan duration
  const startMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;

  // Support shift yang tamat selepas tengah malam
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  //bahagian sini kita nak tukar jam dan hours sekarang kepada minutes untuk mudahkan kita untuk buat operasa tolak
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  //so dekat sini kita nk buat berapa minit atau jam dh berlalu dari masa mula shift
  let elapsedMinutes = nowMinutes - startMinutes;

  if (endMinutes > 24 * 60 && nowMinutes < startMinutes) {
    elapsedMinutes += 24 * 60;
  }

  //kita nak dapatkan jumlah masa dari start shift ke shift tamat
  const totalMinutes = endMinutes - startMinutes;

  //untuk bahagian sini adalah untuk progress bar
  //Math.max() => akan ambil nilai paling besar while Math.min() akan ambil nilai paling kecik
  return Math.max(
    0,
    Math.min(100, (elapsedMinutes / totalMinutes) * 100) //dkt sini berapa percent yang akan ditunjuk di bahagian progress
  );
};

//nk buat untuk date
const formatShiftDate = (date: string, language: string) => {
  const [year, month, day] = date
    .slice(0, 10)
    .split("-")
    .map(Number);

  //bahagian sini kenapa month kena tolak 1? sbb dalam javascript month mula dari 0
  const shiftDate = new Date(year, month - 1, day);

  //bahagian sini kita nk tukar kan object date kepada teks yang boleh dipaparkan mengikut format tertentu
  return shiftDate.toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-GB', {
    weekday: "long", //full name day
    day: "2-digit", //ambil 2 digit sahaja
    month: "short", //ambil nama month yang pendek like Oct
    year: "numeric", //mesti dalam bentuk nombor
  });
};


export default function VendorShiftScreen() {
    const { i18n } = useTranslation();

    const [currentShift, setCurrentShift] = useState<ShiftRecord | null>(null);
    const [history, setHistory] = useState<ShiftHistory[]>([]);
    const navigation = useNavigation<NavigationProp>();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 60_000);

    return () => clearInterval(timer);
    }, []);


    const progress = currentShift?.shift_status === "OPEN" && currentShift.start_shift && currentShift.end_shift
        ? getShiftProgress(currentShift.start_shift, currentShift.end_shift, currentTime)
        : 0;


    //bahagian sini kita nk handle if masa lagi 15 minit then ia akan tukar warna
    const isEndingSoon = currentShift?.shift_status === "OPEN" && currentShift.start_shift && currentShift.end_shift ? (
        () => {
                const [endHour, endMinute] = currentShift.end_shift
                .slice(0, 5)
                .split(":")
                .map(Number);

                const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

                let endMinutes = endHour * 60 + endMinute;

                // Handle shift yang tamat selepas tengah malam
                if (endMinutes <= nowMinutes) {
                endMinutes += 24 * 60;
                }

                return endMinutes - nowMinutes <= 15 &&
                    endMinutes - nowMinutes > 0;
        })() : false;


            const handleStartShift = () => {
                navigation.navigate("ShiftDetails");
            };

        useFocusEffect(
            useCallback(() => {
                const fetchCurrentShift = async () => {
                    const [currentResult, historyResult] = await Promise.allSettled([
                        api.get<ShiftRecord | null>("/shift/current"),
                        api.get<ShiftRecord[]>("/shift/history"),
                    ]);

                    if (currentResult.status === "fulfilled") {
                        const latestShift = currentResult.value.data;
                        setCurrentShift(latestShift?.shift_status === "OPEN" ? latestShift : null);
                    } else {
                        console.error(
                            "Failed to fetch current shift:",
                            currentResult.reason?.response?.data ?? currentResult.reason
                        );
                    }

                    if (historyResult.status === "fulfilled") {
                        const historyRecords = historyResult.value.data ?? [];
                        setHistory(historyRecords.map((record) => {
                            const endTime = record.closed_at
                                ? new Date(record.closed_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                                : record.end_shift?.slice(0, 5) ?? "--:--";
                            return {
                                id: String(record.shift_id),
                                date: String(record.date),
                                start: record.start_shift?.slice(0, 5) ?? "--:--",
                                end: endTime,
                                status: "Ended",
                            };
                        }));
                    } else {
                        console.error(
                            "Failed to fetch shift history:",
                            historyResult.reason?.response?.data ?? historyResult.reason
                        );
                    }
                };

                void fetchCurrentShift();
                const timer = setInterval(() => void fetchCurrentShift(), 5000);
                return () => clearInterval(timer);
            }, [])
        );



    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

                <View style={styles.containTitle}>
                    <Text style={styles.title}>Shift</Text>

                    <Text style={styles.dateText}>
                    {currentShift?.date
                        ? formatShiftDate(String(currentShift.date), i18n.language)
                        : "No shift date"}
                    </Text>

                </View>

                {/* Current Shift */}
                <View style={styles.shift}>

                    <View style={styles.shiftHeader}>
                        <Text style={styles.shiftLabel}>Current shift</Text>

                        <View style={styles.statusPill}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusPillText}>
                                {currentShift?.shift_status === "OPEN"
                                    ? "Active"
                                    : "No Active Shift"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.containShift}>

                        <View style={styles.timeContain}>
                            <Text style={styles.timeTitle}>Start</Text>
                            <Text style={styles.time}>
                                {currentShift?.start_shift?.slice(0, 5) ?? "--:--"}
                            </Text>
                        </View>

                        <Text style={styles.arrow}>→</Text>

                        <View style={[styles.timeContain, styles.timeRight]}>
                            <Text style={styles.timeTitle}>End</Text>
                            <Text style={styles.time}>
                                {currentShift?.end_shift?.slice(0, 5) ?? "--:--"}
                            </Text>
                        </View>

                    </View>

                    <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                            width: `${progress}%`,
                            backgroundColor: isEndingSoon
                                ? "#F04438"
                                : "#16A34A",
                            },
                        ]}
                    />
                    </View>

                    <View style={styles.containDuration}>
                        <Text style={styles.durationText}>
                            Duration {" "}{currentShift?.start_shift && currentShift?.end_shift
                                ? getDuration(currentShift.start_shift, currentShift.end_shift, i18n.language)
                                : "--"}
                        </Text>

                        <Text style={styles.progressText}>
                        {Math.round(progress)}% completed
                        </Text>
                    </View>


                    <View style={styles.shiftDivider} />

                    <View style={styles.containCashButton}>
                        <View style={styles.cashStart}>
                            <Text style={styles.timeTitle}>Starting cash</Text>
                            <Text style={styles.cash}>
                                <Text style={styles.currency}>RM </Text>
                                {Number(currentShift?.starting_cash ?? 0).toFixed(2)}
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
                        contentContainerStyle={styles.historyContent}
                    >
                        {history.length === 0 ? (

                            <View style={styles.historyFalse}>
                                <Text style={styles.historyFalseText}>
                                    No History Shift Yet
                                </Text>
                            </View>

                        ) : (

                            history.map((item) => (

                                <View
                                    key={item.id}
                                    style={styles.historyRow}
                                >
                                    <View style={styles.historyCardTop}>
                                        <View style={styles.historyDateGroup}>
                                            <View style={styles.historyDateIcon}>
                                                <Ionicons name="calendar-outline" size={17} color="#315B9B" />
                                            </View>
                                        <Text style={styles.historyDate}>
                                            {formatShiftDate(item.date, i18n.language)}
                                        </Text>
                                        </View>
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>
                                                {item.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.historyCardBottom}>
                                        <View style={styles.historyTimeGroup}>
                                            <Ionicons name="time-outline" size={16} color="#74839A" />
                                            <Text style={styles.historyTime}>
                                                {item.start} – {item.end}
                                            </Text>
                                        </View>
                                        <Text style={styles.historyDuration}>
                                            {item.start !== '--:--' && item.end !== '--:--'
                                                ? getDuration(item.start, item.end, i18n.language)
                                                : '--'}
                                        </Text>
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
        backgroundColor: "#FFFFFF",
    },

    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    containTitle: {
        paddingHorizontal: 4,
        paddingTop: 20,
        paddingBottom: 10,
    },
     dateText: {
        fontSize: 18,
        color: "#64748B",
        marginBottom: 2,
    },
    title: {
        fontSize: 40,
        fontWeight: "700",
        marginVertical:10
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
        fontSize: 18,
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
        fontSize: 15,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "#C7D2FE",
        marginBottom: 2,
    },
    time: {
        fontSize: 38,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    arrow: {
        fontSize: 28,
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
    containDuration:{
        flexDirection:"row",
        justifyContent:"space-between"
    },
    progressText: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 6,
        },
    durationText: {
        fontSize: 15,
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
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
},
   cashStart: {

    },
    cash: {
        fontSize: 30,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    currency: {
        fontSize: 15,
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
    width: "100%",
    flex: 1,
    minHeight: 240,
    marginBottom: 16,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: "#F5F8FC",
},

historyContent: {
    paddingBottom: 14,
},

historyRow: {
    minHeight: 98,
    justifyContent: "center",
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7EDF5",
    backgroundColor: "#FFFFFF",
    shadowColor: "#17345C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
},

historyCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
},

historyDateGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
},

historyDateIcon: {
    width: 32,
    height: 32,
    marginRight: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF4FF",
},

historyCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E9EEF5",
},

historyTimeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
},

historyDate: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
},

historyTime: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
},

historyDuration: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#335C91",
},

badge: {
    backgroundColor: "#EAF8F0",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
},

badgeText: {
    fontSize: 11,
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
