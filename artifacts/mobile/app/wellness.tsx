import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const SPECIALISTS = [
  {
    id: "nutritionist",
    type: "Nutritionist",
    name: "Dr. Adaeze Okonkwo",
    specialty: "Clinical Nutrition & Weight Management",
    badge: "BSN, RD, PhD",
    conditions: ["weightloss", "diabetes"],
    price: 8500,
    rating: 4.9,
    sessions: 312,
    availability: "Today",
    color: "#2D5A27",
    bg: "#E8F5E9",
    icon: "thermometer" as const,
  },
  {
    id: "dietitian",
    type: "Registered Dietitian",
    name: "Dr. Emeka Nwosu",
    specialty: "Cardiovascular Diet & Hypertension",
    badge: "RD, MSc",
    conditions: ["hypertension", "liver"],
    price: 7200,
    rating: 4.8,
    sessions: 228,
    availability: "Tomorrow",
    color: "#8B500A",
    bg: "#FFF3E0",
    icon: "heart" as const,
  },
  {
    id: "healthcoach",
    type: "Health Coach",
    name: "Coach Fatima Al-Rashid",
    specialty: "Behavioural Change & Lifestyle Medicine",
    badge: "CHC, PCC (ICF)",
    conditions: ["weightloss", "allergies"],
    price: 5500,
    rating: 4.9,
    sessions: 480,
    availability: "Today",
    color: "#493700",
    bg: "#FFF8E1",
    icon: "activity" as const,
  },
  {
    id: "gp",
    type: "General Practitioner",
    name: "Dr. Bola Fashola",
    specialty: "Metabolic Syndrome & Liver Disease",
    badge: "MBBS, MRCGP",
    conditions: ["liver", "hypertension", "diabetes"],
    price: 12000,
    rating: 4.7,
    sessions: 156,
    availability: "Friday",
    color: "#154212",
    bg: "#E8F5E9",
    icon: "user" as const,
  },
];

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "2:00 PM", "3:00 PM",
  "4:00 PM", "5:00 PM",
];

const DAYS_AHEAD = ["Today", "Tomorrow", "Wed", "Thu", "Fri", "Sat"];

export default function WellnessScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookConsultation, consultations, profile } = useApp();
  const { token } = useAuth();

  const [selectedSpecialist, setSelectedSpecialist] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState("Today");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  const specialist = SPECIALISTS.find((s) => s.id === selectedSpecialist);

  const handleBook = async () => {
    if (!specialist || !selectedSlot) return;
    setBooking(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    try {
      if (token) {
        await fetch("/api/auth/book-consultation", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            specialistType: specialist.type,
            specialistName: specialist.name,
            date: selectedDay,
            time: selectedSlot,
            price: specialist.price,
            notes: "",
          }),
        });
      }
      await bookConsultation({
        specialistType: specialist.type,
        specialistName: specialist.name,
        date: selectedDay,
        time: selectedSlot,
        price: specialist.price,
        notes: "",
      });
    } catch {}
    await new Promise((r) => setTimeout(r, 600));
    setBooking(false);
    setBooked(true);
  };

  const upcomingConsults = consultations.filter((c) => c.status === "upcoming");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.surfaceContainer }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerLabel, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
            TELEMEDICINE
          </Text>
          <Text style={[styles.headerTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Wellness Consultations
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40,
          },
        ]}
      >
        {upcomingConsults.length > 0 && (
          <View style={[styles.upcomingCard, { backgroundColor: colors.tertiaryFixed }]}>
            <View style={styles.upcomingHeader}>
              <Feather name="calendar" size={14} color={colors.tertiary} />
              <Text style={[styles.upcomingLabel, { color: colors.tertiary, fontFamily: "Manrope_700Bold" }]}>
                UPCOMING SESSION
              </Text>
            </View>
            <Text style={[styles.upcomingTitle, { color: colors.tertiary, fontFamily: "Epilogue_700Bold" }]}>
              {upcomingConsults[0].specialistName}
            </Text>
            <Text style={[styles.upcomingTime, { color: colors.tertiary, fontFamily: "Manrope_400Regular" }]}>
              {upcomingConsults[0].date} at {upcomingConsults[0].time} · {upcomingConsults[0].specialistType}
            </Text>
            <View style={styles.upcomingActions}>
              <Pressable
                style={[styles.joinCallBtn, { backgroundColor: colors.tertiary }]}
                onPress={() => router.push({
                  pathname: "/consultation-room",
                  params: {
                    consultationId: upcomingConsults[0].id,
                    specialistName: upcomingConsults[0].specialistName,
                    specialistType: upcomingConsults[0].specialistType,
                  },
                })}
              >
                <Feather name="video" size={15} color="#fff" />
                <Text style={[styles.joinCallText, { fontFamily: "Manrope_700Bold" }]}>Join Call</Text>
              </Pressable>
              <Pressable
                style={[styles.rxBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
                onPress={() => router.push({ pathname: "/prescription", params: { prescriptionId: "RX-DEMO001" } })}
              >
                <Text style={[styles.rxBtnText, { color: colors.tertiary, fontFamily: "Manrope_600SemiBold" }]}>View Rx</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
            Your Wellness Team
          </Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
            Select a specialist to view availability
          </Text>
        </View>

        <View style={styles.specialistList}>
          {SPECIALISTS.map((s) => {
            const selected = selectedSpecialist === s.id;
            const relevant = profile.conditions.some((c) => s.conditions.includes(c));
            return (
              <Pressable
                key={s.id}
                style={[
                  styles.specialistCard,
                  {
                    backgroundColor: selected ? colors.surfaceContainer : colors.card,
                    borderColor: selected ? colors.primary : "transparent",
                    borderWidth: selected ? 1.5 : 0,
                  },
                ]}
                onPress={() => {
                  setSelectedSpecialist(selected ? null : s.id);
                  setSelectedSlot(null);
                }}
              >
                <View style={styles.specialistTop}>
                  <View style={[styles.specialistAvatar, { backgroundColor: s.bg }]}>
                    <Feather name={s.icon} size={22} color={s.color} />
                    {relevant && (
                      <View style={[styles.relevantDot, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <View style={styles.specialistInfo}>
                    <View style={styles.typeRow}>
                      <Text style={[styles.specialistType, { color: s.color, fontFamily: "Manrope_700Bold" }]}>
                        {s.type}
                      </Text>
                      {relevant && (
                        <View style={[styles.matchBadge, { backgroundColor: "#E8F5E9" }]}>
                          <Text style={[styles.matchText, { color: colors.primary, fontFamily: "Manrope_700Bold" }]}>
                            Match
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.specialistName, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                      {s.name}
                    </Text>
                    <Text style={[styles.specialistSpec, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                      {s.specialty}
                    </Text>
                  </View>
                </View>

                <View style={styles.specialistMeta}>
                  <View style={styles.metaItem}>
                    <Feather name="star" size={12} color={colors.secondary} />
                    <Text style={[styles.metaText, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                      {s.rating}
                    </Text>
                    <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                      ({s.sessions} sessions)
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.availBadge,
                      {
                        backgroundColor:
                          s.availability === "Today" ? "#E8F5E9" : colors.surfaceContainer,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.availText,
                        {
                          color: s.availability === "Today" ? colors.primary : colors.mutedForeground,
                          fontFamily: "Manrope_600SemiBold",
                        },
                      ]}
                    >
                      {s.availability}
                    </Text>
                  </View>
                  <Text style={[styles.priceText, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
                    ₦{s.price.toLocaleString()}
                  </Text>
                </View>

                {selected && (
                  <View style={styles.slotsSection}>
                    <View style={[styles.slotsDivider, { backgroundColor: colors.surfaceContainerHigh }]} />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.daysRow}>
                        {DAYS_AHEAD.map((day) => (
                          <Pressable
                            key={day}
                            style={[
                              styles.dayChip,
                              {
                                backgroundColor:
                                  selectedDay === day ? colors.primary : colors.surfaceContainerHigh,
                              },
                            ]}
                            onPress={() => {
                              setSelectedDay(day);
                              setSelectedSlot(null);
                            }}
                          >
                            <Text
                              style={[
                                styles.dayChipText,
                                {
                                  color: selectedDay === day ? "#fff" : colors.mutedForeground,
                                  fontFamily: "Manrope_600SemiBold",
                                },
                              ]}
                            >
                              {day}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>

                    <View style={styles.slotsGrid}>
                      {TIME_SLOTS.map((slot) => {
                        const taken = slot === "10:00 AM" || slot === "2:00 PM";
                        return (
                          <Pressable
                            key={slot}
                            disabled={taken}
                            style={[
                              styles.slotChip,
                              {
                                backgroundColor:
                                  selectedSlot === slot
                                    ? colors.primary
                                    : taken
                                    ? colors.surfaceContainerHigh
                                    : colors.surfaceContainerLow,
                                opacity: taken ? 0.4 : 1,
                              },
                            ]}
                            onPress={() => setSelectedSlot(slot)}
                          >
                            <Text
                              style={[
                                styles.slotText,
                                {
                                  color:
                                    selectedSlot === slot ? "#fff" : colors.onSurface,
                                  fontFamily:
                                    selectedSlot === slot ? "Manrope_700Bold" : "Manrope_500Medium",
                                },
                              ]}
                            >
                              {slot}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {selectedSlot && (
                      <Pressable
                        style={[styles.bookBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setShowConfirm(true)}
                      >
                        <Feather name="video" size={16} color="#fff" />
                        <Text style={[styles.bookBtnText, { fontFamily: "Epilogue_700Bold" }]}>
                          Book {selectedDay} at {selectedSlot} · ₦{s.price.toLocaleString()}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surfaceContainerLow }]}>
          <Text style={[styles.infoTitle, { color: colors.onSurface, fontFamily: "Epilogue_600SemiBold" }]}>
            How It Works
          </Text>
          {[
            { icon: "user-check" as const, text: "Choose your specialist based on your health condition" },
            { icon: "calendar" as const, text: "Pick a date and time that works for you" },
            { icon: "video" as const, text: "Join the 30-min video consultation via secure link" },
            { icon: "file-text" as const, text: "Receive a personalised diet & lifestyle report" },
          ].map((step, i) => (
            <View key={i} style={styles.infoStep}>
              <View style={[styles.infoStepNum, { backgroundColor: colors.primary }]}>
                <Text style={[styles.infoStepNumText, { fontFamily: "Manrope_700Bold" }]}>
                  {i + 1}
                </Text>
              </View>
              <Feather name={step.icon} size={15} color={colors.primary} />
              <Text style={[styles.infoStepText, { color: colors.onSurface, fontFamily: "Manrope_400Regular" }]}>
                {step.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showConfirm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirm(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !booking && !booked && setShowConfirm(false)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.background }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.outlineVariant }]} />

            {booked ? (
              <View style={styles.bookedState}>
                <View style={[styles.bookedIcon, { backgroundColor: "#E8F5E9" }]}>
                  <Feather name="check" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.bookedTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                  Consultation Booked!
                </Text>
                <Text style={[styles.bookedSub, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  {specialist?.name} · {selectedDay} at {selectedSlot}
                </Text>
                <Text style={[styles.bookedNote, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                  You'll receive a secure video link 15 minutes before your session.
                </Text>
                <Pressable
                  style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setShowConfirm(false);
                    setBooked(false);
                    setSelectedSlot(null);
                    setSelectedSpecialist(null);
                    router.back();
                  }}
                >
                  <Text style={[styles.doneBtnText, { fontFamily: "Epilogue_700Bold" }]}>
                    Done
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={[styles.confirmTitle, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                  Confirm Booking
                </Text>

                <View style={[styles.confirmCard, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={styles.confirmRow}>
                    <Text style={[styles.confirmLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                      Specialist
                    </Text>
                    <Text style={[styles.confirmValue, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                      {specialist?.name}
                    </Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={[styles.confirmLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                      Type
                    </Text>
                    <Text style={[styles.confirmValue, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                      {specialist?.type}
                    </Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={[styles.confirmLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                      Date & Time
                    </Text>
                    <Text style={[styles.confirmValue, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                      {selectedDay} · {selectedSlot}
                    </Text>
                  </View>
                  <View style={styles.confirmRow}>
                    <Text style={[styles.confirmLabel, { color: colors.mutedForeground, fontFamily: "Manrope_400Regular" }]}>
                      Duration
                    </Text>
                    <Text style={[styles.confirmValue, { color: colors.onSurface, fontFamily: "Manrope_600SemiBold" }]}>
                      30 minutes
                    </Text>
                  </View>
                  <View style={[styles.confirmDivider, { backgroundColor: colors.surfaceContainerHigh }]} />
                  <View style={styles.confirmRow}>
                    <Text style={[styles.confirmTotal, { color: colors.onSurface, fontFamily: "Epilogue_700Bold" }]}>
                      Total
                    </Text>
                    <Text style={[styles.confirmPrice, { color: colors.primary, fontFamily: "Epilogue_700Bold" }]}>
                      ₦{specialist?.price.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.confirmActions}>
                  <Pressable
                    style={[styles.cancelBtn, { borderColor: colors.outlineVariant }]}
                    onPress={() => setShowConfirm(false)}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: "Manrope_500Medium" }]}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.confirmBtn, { backgroundColor: colors.primary, opacity: booking ? 0.7 : 1 }]}
                    onPress={handleBook}
                    disabled={booking}
                  >
                    <Feather name="video" size={16} color="#fff" />
                    <Text style={[styles.confirmBtnText, { fontFamily: "Manrope_700Bold" }]}>
                      {booking ? "Booking..." : "Confirm & Pay"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  headerLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: 26, lineHeight: 32 },
  scroll: { paddingHorizontal: 20, paddingTop: 4, gap: 20 },
  upcomingCard: { borderRadius: 16, padding: 16, gap: 6 },
  upcomingHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  upcomingLabel: { fontSize: 10, letterSpacing: 1.5 },
  upcomingTitle: { fontSize: 20 },
  upcomingTime: { fontSize: 13 },
  upcomingActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  joinCallBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
  joinCallText: { color: "#fff", fontSize: 14 },
  rxBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, justifyContent: "center" },
  rxBtnText: { fontSize: 14 },
  sectionHeader: { gap: 4 },
  sectionTitle: { fontSize: 22 },
  sectionSub: { fontSize: 13 },
  specialistList: { gap: 14 },
  specialistCard: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#1D1B19",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  specialistTop: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  specialistAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  relevantDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  specialistInfo: { flex: 1, gap: 3 },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  specialistType: { fontSize: 11, letterSpacing: 0.5 },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  matchText: { fontSize: 10 },
  specialistName: { fontSize: 17, lineHeight: 22 },
  specialistSpec: { fontSize: 12, lineHeight: 17 },
  specialistMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13 },
  availBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  availText: { fontSize: 12 },
  priceText: { fontSize: 17, marginLeft: "auto" },
  slotsSection: { gap: 12 },
  slotsDivider: { height: 1 },
  daysRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  dayChipText: { fontSize: 13 },
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    width: "22%",
    alignItems: "center",
  },
  slotText: { fontSize: 12 },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 100,
  },
  bookBtnText: { color: "#fff", fontSize: 15 },
  infoCard: { borderRadius: 20, padding: 18, gap: 14 },
  infoTitle: { fontSize: 18 },
  infoStep: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  infoStepNumText: { color: "#fff", fontSize: 11 },
  infoStepText: { fontSize: 13, flex: 1, lineHeight: 19 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  confirmTitle: { fontSize: 24 },
  confirmCard: { borderRadius: 16, padding: 16, gap: 10 },
  confirmRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  confirmLabel: { fontSize: 13 },
  confirmValue: { fontSize: 14 },
  confirmDivider: { height: 1 },
  confirmTotal: { fontSize: 18 },
  confirmPrice: { fontSize: 22 },
  confirmActions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15 },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 100,
  },
  confirmBtnText: { color: "#fff", fontSize: 15 },
  bookedState: { alignItems: "center", gap: 14, paddingVertical: 12 },
  bookedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bookedTitle: { fontSize: 24 },
  bookedSub: { fontSize: 15, textAlign: "center" },
  bookedNote: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  doneBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 4,
  },
  doneBtnText: { color: "#fff", fontSize: 17 },
});
