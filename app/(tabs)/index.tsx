import SearchBar from "@/components/SearchBar";
import { Text, View, FlatList, Pressable, Animated, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CourseCard from "@/components/CourseCard";
import CourseProgressCard from "@/components/CourseProgress";
import background from "@/assets/images/background.png";

// Firebase imports
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";
import ArticleCard from "@/components/ArticleCard";
import { Ionicons } from "@expo/vector-icons";

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

interface Article {
  id: string;
  auteur: string;
  contenu: string;
  createdAt: any;
  imageUrl: string;
  titre: string;
  updatedAt: any;
  commentsCount?: number;
}

export default function Index() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressCourses, setProgressCourses] = useState<Course[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // LOGIQUE DE PROGRESSION
  const loadCourseProgress = useCallback(async (coursesList: Course[]) => {
    try {
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
      setProgressCourses(inProgressCourses);
    } catch (error) {
      console.error("Erreur lors du chargement de la progression:", error);
    }
  }, []);

  // Charger cours + articles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Charger cours
        const coursesQuery = query(collection(db, "courses"), limit(4));
        const coursesSnapshot = await getDocs(coursesQuery);
        let coursesList = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          saved: false,
        })) as Course[];

        // Récupérer sauvegardés
        const savedCoursesData = await AsyncStorage.getItem("savedCoursesData");
        if (savedCoursesData) {
          const savedCourses = JSON.parse(savedCoursesData);
          coursesList = coursesList.map((course) => ({
            ...course,
            saved: savedCourses.some((c: Course) => c.id === course.id),
          }));
        }

        setCourses(coursesList);
        
        // Charger la progression des cours
        await loadCourseProgress(coursesList);

        // Charger articles
        const articlesQuery = query(
          collection(db, "articles"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const articlesSnapshot = await getDocs(articlesQuery);
        const articlesList = articlesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Article[];
        setArticles(articlesList);
      } catch (error) {
        console.error("Erreur Firebase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadCourseProgress]);

  // Rafraîchir état des cours sauvegardés et progression
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const storedName = await AsyncStorage.getItem("userName");
        if (storedName) setName(storedName);

        const savedCoursesData = await AsyncStorage.getItem("savedCoursesData");
        if (savedCoursesData) {
          const savedCourses = JSON.parse(savedCoursesData);
          setCourses((prev) =>
            prev.map((course) => ({
              ...course,
              saved: savedCourses.some((c: Course) => c.id === course.id),
            }))
          );
        }

        // Recharger la progression si nécessaire
        if (courses.length > 0) {
          await loadCourseProgress(courses);
        }
      };
      loadData();
    }, [courses, loadCourseProgress])
  );

  // Sauvegarde locale
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

      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, saved: !alreadySaved } : c
        )
      );
      
      // Mettre à jour aussi la progression si nécessaire
      setProgressCourses(prev => 
        prev.map(c => 
          c.id === course.id ? { ...c, saved: !alreadySaved } : c
        )
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  // Fonction pour convertir la date Firebase en timestamp
  const getTimeAgo = (firebaseTimestamp: any): number => {
    if (!firebaseTimestamp) return Date.now();
    
    // Si c'est un objet Firebase Timestamp
    if (firebaseTimestamp.toDate) {
      return firebaseTimestamp.toDate().getTime();
    }
    
    // Si c'est déjà un timestamp numérique
    if (typeof firebaseTimestamp === 'number') {
      return firebaseTimestamp;
    }
    
    // Si c'est une chaîne de date
    if (typeof firebaseTimestamp === 'string') {
      return new Date(firebaseTimestamp).getTime();
    }
    
    return Date.now();
  };

  // Navigation - ROUTES ORIGINALES
  const navigateToSearch = () => router.push("/search");
  const navigateToCourse = (id: string) => router.push(`/courses/${id}`);
  const navigateToArticle = (id: string) => router.push(`/articles/${id}`);
  const navigateToAllCourses = () => router.push("/courses");
  const navigateToAllArticles = () => router.push("/articles"); 
  const navigateToSaved = () => router.push("/saved");
  const navigateToContinueLearning = () => router.push("/courses/continuelearning");

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="px-6">
              {/* Header */}
              <View className="flex-row items-center justify-between pt-6 pb-4">
                <View>
                  <Text className="text-2xl font-semibold text-gray-900">
                    Hi, {name || "Guest"}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    What do you want to learn today?
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push("/notification")}
                  className="p-2 rounded-full bg-gray-100 active:opacity-70"
                >
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color="#374151"
                  />
                </Pressable>
              </View>

              {/* Search */}
              <Pressable
                onPress={navigateToSearch}
                className="active:opacity-70"
              >
                <SearchBar
                  onPress={navigateToSearch}
                  placeholder="Search for courses, chapters, articles..."
                  onSearch={() => {}}
                  editable={false}
                />
              </Pressable>

              {/* Section Progression des Cours */}
              {progressCourses.length > 0 && (
                <>
                  <View className="mt-6 flex-row justify-between items-center mb-4">
                    <Text className="text-xl font-bold text-gray-900">
                      Continue Learning
                    </Text>
                    <Pressable
                      onPress={navigateToContinueLearning}
                      className="active:opacity-70"
                    >
                      <Text className="text-blue-500 text-sm font-medium">
                        See All
                      </Text>
                    </Pressable>
                  </View>

                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={progressCourses}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => navigateToCourse(item.id)}
                        className="active:opacity-70 mr-4"
                      >
                        <CourseProgressCard
                          title={item.title}
                          category={item.category}
                          lessons={item.totalLessons || 0}
                          completedLessons={item.completedLessons || 0}
                          image={background}
                          isSaved={item.saved}
                          course={item}
                          onSave={handleSaveCourse}
                        />
                      </Pressable>
                    )}
                    contentContainerStyle={{ paddingBottom: 16 }}
                  />
                </>
              )}

              {/* Saved */}
              <Pressable
                onPress={navigateToSaved}
                className="mt-6 bg-blue-50 py-3 px-4 rounded-lg flex-row items-center justify-between active:opacity-70"
              >
                <View className="flex-row items-center">
                  <Ionicons name="bookmark" size={20} color="#3B82F6" />
                  <Text className="text-blue-600 ml-2 font-medium">
                    View saved courses
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
              </Pressable>

              {/* Courses */}
              <View className="mt-8 flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-900">
                  Popular Courses
                </Text>
                <Pressable
                  onPress={navigateToAllCourses}
                  className="active:opacity-70"
                >
                  <Text className="text-blue-500 text-sm font-medium">
                    See More
                  </Text>
                </Pressable>
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={courses}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => navigateToCourse(item.id)}
                    className="active:opacity-70 mr-4"
                  >
                    <CourseCard
                      title={item.title}
                      lessons={item.chapters}
                      duration={item.duration}
                      image={background}
                      isSaved={item.saved}
                      course={item}
                      onSave={handleSaveCourse}
                    />
                  </Pressable>
                )}
                contentContainerStyle={{ paddingBottom: 16 }}
              />

              {/* Articles */}
              <View className="mt-8 flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-900">
                  Latest Articles
                </Text>
                <Pressable
                  onPress={navigateToAllArticles}
                  className="active:opacity-70"
                >
                  <Text className="text-blue-500 text-sm font-medium">
                    See More
                  </Text>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View className="px-6 mb-4">
              <Pressable
                onPress={() => navigateToArticle(item.id)}
                className="active:opacity-70"
              >
                <ArticleCard
                  category={item.auteur}
                  title={item.titre}
                  timeAgo={getTimeAgo(item.createdAt)}
                  commentsCount={item.commentsCount}
                  background={{ uri: item.imageUrl }}
                />
              </Pressable>
            </View>
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListFooterComponent={<View className="h-20" />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </Animated.View>
    </SafeAreaView>
  );
}