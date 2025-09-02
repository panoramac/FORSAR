import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";
import CourseCard from "@/components/CourseCard";
import background from "@/assets/images/background.png";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Course {
  id: string;
  title: string;
  duration?: number;
  chapters?: number;
  saved?: boolean;
}

export default function CoursesList() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "courses"));
        let coursesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          saved: false, // 🔹 état par défaut
        })) as Course[];

        // Vérifier ce qui est déjà sauvegardé
        const savedCoursesData = await AsyncStorage.getItem("savedCoursesData");
        if (savedCoursesData) {
          const savedCourses = JSON.parse(savedCoursesData);
          coursesList = coursesList.map((course) => ({
            ...course,
            saved: savedCourses.some((c: Course) => c.id === course.id),
          }));
        }

        setCourses(coursesList);
      } catch (err) {
        console.error("❌ Erreur lors de la récupération des cours :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // 🔹 Fonction de sauvegarde locale
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

      await AsyncStorage.setItem("savedCoursesData", JSON.stringify(savedCourses));

      // Mettre à jour l'état local
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, saved: !alreadySaved } : c
        )
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-2">Chargement des cours...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      {/* Header avec retour */}
      <View className="flex-row items-center mt-2 mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold mr-6">
          All Courses
        </Text>
      </View>

      {/* Liste des cours */}
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/courses/${item.id}`)}
            className="mb-6 w-[49%]"
          >
            <CourseCard
              title={item.title}
              lessons={item.chapters ?? 0}
              duration={item.duration ?? 0}
              image={background}
              isSaved={item.saved}       // 🔹 état sauvegarde
              course={item}              // 🔹 objet complet
              onSave={handleSaveCourse}  // 🔹 callback sauvegarde
            />
          </Pressable>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}
