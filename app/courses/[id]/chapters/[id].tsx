import { 
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VideoView, useVideoPlayer } from "expo-video";

interface Chapter {
  id: string;
  titre: string;
  description: string;
  contenu: string;
  videoUrl?: string;
  coursId?: string;
}

export default function ChapterDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const chapterId = id;
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const player = useVideoPlayer(chapter?.videoUrl ?? null, (player) => {
    if (player) {
      player.loop = false;
      player.muted = false;
    }
  });

  useEffect(() => {
    const fetchChapter = async () => {
      if (!chapterId) {
        console.error("❌ Aucun chapterId fourni");
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "chapters", chapterId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const chapterData = { id: docSnap.id, ...docSnap.data() } as Chapter;
          setChapter(chapterData);

          const completedChapters = await AsyncStorage.getItem("completedChapters");
          if (completedChapters) {
            const completed = JSON.parse(completedChapters);
            setIsCompleted(completed.includes(chapterId));
          }
        } else {
          console.log("❌ Chapitre introuvable dans Firestore");
        }
      } catch (error) {
        console.error("Erreur Firebase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [chapterId]);

  const handleCompleteChapter = async () => {
    if (!chapterId) return;

    try {
      const completedChapters = await AsyncStorage.getItem("completedChapters");
      let completed = completedChapters ? JSON.parse(completedChapters) : [];

      if (!completed.includes(chapterId)) {
        completed.push(chapterId);
        await AsyncStorage.setItem("completedChapters", JSON.stringify(completed));
        setIsCompleted(true);
        Alert.alert("✅ Succès!", "Chapitre terminé avec succès!");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Chapitre introuvable</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white pt-2">
      {/* Header */}
      <View className="flex-row items-center mt-2 px-4">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold mr-6">
          {chapter.titre}
        </Text>
      </View>

      <ScrollView className="flex-1 p-6">
        {chapter.videoUrl ? (
          <VideoView
            style={{ width: "100%", height: 200 }}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
          />
        ) : (
          <View className="bg-gray-200 h-48 items-center justify-center mb-6">
            <Ionicons name="videocam-off" size={40} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">Pas de vidéo</Text>
          </View>
        )}

        <Text className="text-lg font-bold mb-2">{chapter.titre}</Text>
        <Text className="text-gray-600 mb-4">{chapter.description}</Text>
        <Text className="text-gray-800 leading-6">{chapter.contenu}</Text>
      </ScrollView>

      <View className="p-6 bg-white border-t border-gray-200">
        {isCompleted ? (
          <View className="bg-green-500 py-4 rounded-full items-center">
            <Text className="text-white font-semibold text-lg">
              ✓ Chapitre Terminé
            </Text>
          </View>
        ) : (
          <Pressable
            className="bg-green-500 py-4 rounded-full items-center"
            onPress={handleCompleteChapter}
          >
            <Text className="text-white font-semibold text-lg">
              Terminer le Chapitre
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}