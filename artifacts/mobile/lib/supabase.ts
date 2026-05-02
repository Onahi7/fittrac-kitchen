import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          detectSessionInUrl: Platform.OS === "web",
          storage: Platform.OS === "web" ? undefined : AsyncStorage,
        },
      })
    : null;
