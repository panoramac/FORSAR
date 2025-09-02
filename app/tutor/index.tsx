import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "firebase/auth";
import { auth, db } from "@/configs/FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Feather } from "@expo/vector-icons";

// --- Type pour les données du tuteur ---
type TutorData = {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  profilePicture?: string;
  bio?: string;
  specialties?: string;
  createdCount?: {
    courses?: number;
    articles?: number;
    quizzes?: number;
  };
  role?: string;
};

export default function TutorDashboard() {
  const router = useRouter();
  const [tutorData, setTutorData] = useState<TutorData | null>(null);

  useEffect(() => {
    const fetchTutorData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data() as TutorData;
          if (data.role === "tutor") {
            setTutorData(data);
          } else {
            router.replace("/");
          }
        }
      } catch (error: any) {
        console.log("Erreur récupération tuteur:", error.message);
      }
    };

    fetchTutorData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.clear();
      router.replace("/auth/login");
    } catch (error: any) {
      console.log("Erreur logout:", error.message);
    }
  };

  if (!tutorData) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-400">Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* --- PROFILE HEADER --- */}
      <View className="items-center py-8 border-b border-gray-100">
        <Image
          source={{ uri: tutorData.profilePicture }}
          className="w-24 h-24 rounded-full mb-4"
        />
        <Text className="text-xl font-bold text-gray-900">{tutorData.name}</Text>
        <Text className="text-gray-500">{tutorData.email}</Text>
        <Text className="text-gray-400 mt-1">
          {tutorData.phone} • {tutorData.country}
        </Text>
      </View>

      {/* --- STATS --- */}
      <View className="flex-row justify-around py-6 border-b border-gray-100">
        <View className="items-center">
          <Text className="text-lg font-bold text-blue-600">
            {tutorData.createdCount?.courses || 0}
          </Text>
          <Text className="text-gray-500 text-sm">Cours</Text>
        </View>
        <View className="items-center">
          <Text className="text-lg font-bold text-green-600">
            {tutorData.createdCount?.articles || 0}
          </Text>
          <Text className="text-gray-500 text-sm">Articles</Text>
        </View>
        <View className="items-center">
          <Text className="text-lg font-bold text-purple-600">
            {tutorData.createdCount?.quizzes || 0}
          </Text>
          <Text className="text-gray-500 text-sm">Quiz</Text>
        </View>
      </View>

      {/* --- BIO --- */}
      <View className="px-6 py-6">
        <Text className="text-lg font-semibold text-gray-900 mb-2">À propos</Text>
        <Text className="text-gray-600 leading-6">
          {tutorData.bio || "Pas de bio renseignée"}
        </Text>
      </View>

      {/* --- SPECIALTIES --- */}
      <View className="px-6 py-6 border-t border-gray-100">
        <Text className="text-lg font-semibold text-gray-900 mb-2">
          Spécialités
        </Text>
        {tutorData.specialties ? (
          tutorData.specialties.split(",").map((spec, idx) => (
            <Text key={idx} className="text-gray-600">
              • {spec.trim()}
            </Text>
          ))
        ) : (
          <Text className="text-gray-400">Aucune spécialité renseignée</Text>
        )}
      </View>

      {/* --- QUICK ACTIONS --- */}
      <View className="px-6 py-6 border-t border-gray-100">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Actions rapides
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/tutor/courses")}
          className="flex-row items-center bg-gray-100 rounded-xl p-4 mb-3"
        >
          <Feather name="book" size={20} color="#2563eb" />
          <Text className="ml-3 text-gray-800 font-medium">
            Créer un nouveau cours
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/tutor/articles")}
          className="flex-row items-center bg-gray-100 rounded-xl p-4 mb-3"
        >
          <Feather name="file-text" size={20} color="#16a34a" />
          <Text className="ml-3 text-gray-800 font-medium">
            Publier un nouvel article
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/tutor/quizzes")}
          className="flex-row items-center bg-gray-100 rounded-xl p-4"
        >
          <Feather name="help-circle" size={20} color="#9333ea" />
          <Text className="ml-3 text-gray-800 font-medium">
            Créer un nouveau quiz
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- LOGOUT --- */}
      <TouchableOpacity
        onPress={handleLogout}
        className="mx-6 my-8 bg-red-500 rounded-xl py-4 flex-row items-center justify-center"
      >
        <Feather name="log-out" size={20} color="white" />
        <Text className="text-white text-lg font-medium ml-2">
          Se déconnecter
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
