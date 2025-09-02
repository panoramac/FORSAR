import React, { useState, useCallback, useEffect } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  Pressable,
  RefreshControl 
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";
import CourseProgressCard from "@/components/CourseProgress";
import background from "@/assets/images/background.png";

// Types
interface Course {
  id: string;
  category: string;
  chapters: any[];
  description: string;
  duration: string;
  introduction: string;
  level: string;
  reviewCount: number;
  title: string;
  videoUrl: string;
  saved?: boolean;
  progress?: number;
  completedLessons?: number;
  totalLessons?: number;
}

export default function ContinueLearningScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger la progression des cours
  const loadCourseProgress = useCallback(async () => {
    try {
      setLoading(true);

      // Charger tous les cours depuis Firebase
      const coursesQuery = query(collection(db, "courses"));
      const coursesSnapshot = await getDocs(coursesQuery);
      let coursesList = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        saved: false,
      })) as Course[];

      // Charger les chapitres terminés
      const completedChapters = await AsyncStorage.getItem("completedChapters");
      const completedChaptersList = completedChapters ? JSON.parse(completedChapters) : [];

      // Charger tous les chapitres pour faire la correspondance
      const chaptersQuery = query(collection(db, "chapters"));
      const chaptersSnapshot = await getDocs(chaptersQuery);
      const allChapters = chaptersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculer la progression pour chaque cours
      const coursesWithProgress = coursesList.map(course => {
        // Trouver tous les chapitres de ce cours
        const courseChapters = allChapters.filter((chapter: any) => 
          chapter.coursId === course.id
        );

        // Trouver les chapitres terminés de ce cours
        const courseCompletedChapters = completedChaptersList.filter((chapterId: string) =>
          courseChapters.some((chapter: any) => chapter.id === chapterId)
        );

        const totalLessons = courseChapters.length;
        const completedLessons = courseCompletedChapters.length;
        const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

        return {
          ...course,
          progress,
          completedLessons,
          totalLessons
        };
      });

      // Filtrer les cours avec une progression > 0
      const inProgressCourses = coursesWithProgress.filter(course => course.progress > 0);
      
      // Trier par progression (du plus avancé au moins avancé)
      const sortedCourses = inProgressCourses.sort((a, b) => (b.progress || 0) - (a.progress || 0));
      
      setCourses(sortedCourses);

    } catch (error) {
      console.error("Erreur lors du chargement de la progression:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Charger les données au montage
  useEffect(() => {
    loadCourseProgress();
  }, [loadCourseProgress]);

  // Rafraîchir manuellement
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCourseProgress();
  }, [loadCourseProgress]);

  // Sauvegarde locale d'un cours
  const handleSaveCourse = async (course: Course) => {
    try {
      const savedCoursesData = await AsyncStorage.getItem("savedCoursesData");
      let savedCourses = savedCoursesData ? JSON.parse(savedCoursesData) : [];

      const alreadySaved = savedCourses.some((c: Course) => c.id === course.id);

      if (alreadySaved) {
        savedCourses = savedCourses.filter((c: Course) => c.id !== course.id);
        alert("Cours retiré des sauvegardes ❌");
      } else {
        savedCourses.push(course);
        alert("Cours bien sauvegardé ✅");
      }

      await AsyncStorage.setItem(
        "savedCoursesData",
        JSON.stringify(savedCourses)
      );

      setCourses(prev => 
        prev.map(c => 
          c.id === course.id ? { ...c, saved: !alreadySaved } : c
        )
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  // Navigation
  const navigateToCourse = (id: string) => router.push(`/courses/${id}`);
  const navigateBack = () => router.back();

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Chargement de vos progrès...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-gray-200">
        <Pressable onPress={navigateBack} className="p-2 mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </Pressable>
        <Text className="text-2xl font-bold text-gray-900">Continue Learning</Text>
      </View>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="book-outline" size={60} color="#D1D5DB" />
            <Text className="text-lg text-gray-500 font-medium mt-4 text-center">
              Aucun cours en cours
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Commencez un cours pour voir votre progression ici
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigateToCourse(item.id)}
            className="bg-white rounded-xl p-4 mb-4 shadow-sm active:opacity-70"
          >
            <CourseProgressCard
              title={item.title}
              category={item.category}
              lessons={item.totalLessons || 0}
              completedLessons={item.completedLessons || 0}
              image={background}
              duration={item.duration}
              isSaved={item.saved}
              course={item}
              onSave={handleSaveCourse}
              showProgressBar={true}
            />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
      />
    </SafeAreaView>
  );
}