import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VideoView, useVideoPlayer } from "expo-video"; // ✅ expo-video

// ✅ Types
interface Course {
  id: string;
  title: string;
  descrition?: string; // ⚡ Firestore (orthographe exacte)
  introduction?: string;
  duration?: number;
  level?: string;
  category?: string;
  chapters?: number;
  studentsCount?: number;
  reviewsCount?: number;
  videoUrl?: string;
}

interface Chapter {
  id: string;
  titre: string;
  description?: string;
  ordre?: number;
  coursId: string;
  completed?: boolean;
}

export default function CourseDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseAndChapters = async () => {
      try {
        if (!id) {
          console.error("❌ Aucun ID de cours fourni");
          return;
        }

        // 1. Charger le cours
        const docRef = doc(db, "courses", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCourse({
            id: docSnap.id,
            title: data.title,
            descrition: data.descrition,
            introduction: data.introduction,
            duration: data.duration,
            level: data.level,
            category: data.category,
            chapters: data.chapters,
            studentsCount: data.studentsCount,
            reviewsCount: data.reviewsCount,
            videoUrl: data.videoUrl,
          });
        } else {
          console.log("❌ Cours introuvable");
        }

        // 2. Charger les chapitres liés
        const q = query(collection(db, "chapters"), where("coursId", "==", id));
        const querySnapshot = await getDocs(q);

        const chaptersList: Chapter[] = [];
        querySnapshot.forEach((doc) => {
          chaptersList.push({ id: doc.id, ...doc.data() } as Chapter);
        });

        // Tri si ordre défini
        chaptersList.sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

        // 3. Charger les chapitres terminés
        const completedChaptersData = await AsyncStorage.getItem(
          "completedChapters"
        );
        if (completedChaptersData) {
          const completed = JSON.parse(completedChaptersData);
          const chaptersWithCompletion = chaptersList.map((chapter) => ({
            ...chapter,
            completed: completed.includes(chapter.id),
          }));
          setChapters(chaptersWithCompletion);
        } else {
          setChapters(chaptersList);
        }
      } catch (error) {
        console.error("Erreur Firebase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndChapters();
  }, [id]);

  // Calculer la progression
  const calculateProgress = () => {
    if (chapters.length === 0) return 0;
    const completedCount = chapters.filter((chapter) => chapter.completed)
      .length;
    return (completedCount / chapters.length) * 100;
  };

  const progress = calculateProgress();

  // ✅ Toujours appeler le hook (jamais conditionnel)
  const player = useVideoPlayer(course?.videoUrl ?? null, (player) => {
    if (player) {
      player.loop = false;
      player.muted = false;
    }
  });

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!course) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Cours introuvable</Text>
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
          Course Details
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Vidéo */}
        {course.videoUrl ? (
          <VideoView
            style={{ width: "100%", height: 200 }}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
          />
        ) : (
          <View className="bg-gray-200 h-48 items-center justify-center">
            <Ionicons name="videocam-off" size={40} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">No video available</Text>
          </View>
        )}

        {/* Infos principales */}
        <View className="p-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold flex-1">{course.title}</Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-blue-500 text-xs font-semibold">
                {course.level}
              </Text>
            </View>
          </View>
          <Text className="text-gray-500 mt-1">
            {course.category || "Category"}
          </Text>

          {/* Progression */}
          <View className="mt-4 bg-gray-100 p-3 rounded-lg">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-semibold">Progression du cours</Text>
              <Text className="text-sm text-blue-600 font-bold">
                {Math.round(progress)}%
              </Text>
            </View>
            <View className="w-full bg-gray-300 rounded-full h-2">
              <View
                className="bg-blue-600 rounded-full h-2"
                style={{ width: `${progress}%` }}
              />
            </View>
            <Text className="text-xs text-gray-600 mt-1">
              {chapters.filter((ch) => ch.completed).length} sur{" "}
              {chapters.length} chapitres terminés
            </Text>
          </View>

          {/* Stats */}
          <View className="flex-row flex-wrap mt-4">
            <View className="flex-row items-center w-1/2 mb-2">
              <Ionicons name="time-outline" size={16} color="#1F66E5" />
              <Text className="text-blue-500 ml-2">
                {course.duration ?? 0} h
              </Text>
            </View>
            <View className="flex-row items-center w-1/2 mb-2">
              <Ionicons name="book-outline" size={16} color="#1F66E5" />
              <Text className="text-blue-500 ml-2">
                {course.chapters ?? 0} chapters
              </Text>
            </View>
            <View className="flex-row items-center w-1/2 mb-2">
              <Ionicons name="people-outline" size={16} color="#1F66E5" />
              <Text className="text-blue-500 ml-2">
                {course.studentsCount ?? 0} students
              </Text>
            </View>
            <View className="flex-row items-center w-1/2 mb-2">
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={16}
                color="#1F66E5"
              />
              <Text className="text-blue-500 ml-2">
                {course.reviewsCount ?? 0} reviews
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text className="text-lg font-bold mt-6">Description</Text>
          <Text className="text-gray-600 mt-2 leading-6">
            {course.descrition || "Pas de description disponible"}
          </Text>

          {/* Introduction */}
          {course.introduction && (
            <>
              <Text className="text-lg font-bold mt-6">Introduction</Text>
              <Text className="text-gray-600 mt-2 leading-6">
                {course.introduction}
              </Text>
            </>
          )}

          {/* Chapitres */}
          {chapters.length > 0 && (
            <>
              <Text className="text-lg font-bold mt-6">Chapitres</Text>
              <View className="mt-2">
                {chapters.map((chapter) => (
                  <Pressable
                    key={chapter.id}
                    onPress={() =>
                      router.push({
                        pathname: `/courses/${id}/chapters/${chapter.id}`,
                      })
                    }
                    className="flex-row items-center justify-between py-3 border-b border-gray-200"
                  >
                    <View className="flex-row items-center flex-1">
                      <Ionicons
                        name="book-outline"
                        size={20}
                        color={chapter.completed ? "#10B981" : "#1F66E5"}
                      />
                      <Text
                        className={`ml-3 ${
                          chapter.completed
                            ? "text-green-600"
                            : "text-gray-800"
                        }`}
                      >
                        {chapter.titre}
                      </Text>
                    </View>
                    {chapter.completed && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#10B981"
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bouton quiz */}
      <View className="p-6 bg-white border-t border-gray-200">
        <Pressable
          className="bg-blue-500 py-4 rounded-full items-center"
          onPress={() =>
            router.push({
              pathname: `/courses/${id}/quiz/${id}`,
            })
          }
        >
          <Text className="text-white font-semibold text-lg">Take Quiz</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
