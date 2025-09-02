import { 
  View, Text, ScrollView, TouchableOpacity, 
  Alert, ActivityIndicator, RefreshControl,
  Modal, Pressable
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { 
  collection, query, where, getDocs, deleteDoc, doc, orderBy, getDoc 
} from "firebase/firestore";
import { db, auth } from '@/configs/FirebaseConfig';

interface Course {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  description?: string;
  videoUrl?: string;
  reviewsCount?: number;
  studentsCount?: number;
  createdAt?: any;
  userId: string;
  chapters?: number;
}

interface Chapter {
  id: string;
  titre: string;
  contenu: string;
  coursId: string;
  ordre: number;
  description?: string;
  videoUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  userId?: string;
}

export default function CoursesIndex() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [chaptersModalVisible, setChaptersModalVisible] = useState(false);
  const [courseDetailsModalVisible, setCourseDetailsModalVisible] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);

  useEffect(() => {
    loadUserAndCourses();
  }, []);

  const loadUserAndCourses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Erreur", "Utilisateur non connecté");
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        Alert.alert("Erreur", "Données utilisateur introuvables");
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const realUserId = userData.userId;
      
      if (!realUserId) {
        Alert.alert("Erreur", "ID utilisateur non trouvé");
        setLoading(false);
        return;
      }

      setUserId(realUserId);
      await loadCourses(realUserId);
    } catch (error) {
      console.error("❌ Erreur loadUserAndCourses:", error);
      Alert.alert("Erreur", "Impossible de charger les données utilisateur");
      setLoading(false);
    }
  };

  const loadCourses = async (realUserId: string) => {
    try {
      const q = query(
        collection(db, "courses"),
        where("userId", "==", realUserId)
      );
      
      const snapshot = await getDocs(q);
      const coursesList: Course[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const chaptersCount = await getChaptersCount(docSnap.id);
        
        coursesList.push({
          id: docSnap.id,
          title: data.title || "Sans titre",
          category: data.category || "Non catégorisé",
          level: data.level || "débutant",
          duration: data.duration || "0 min",
          description: data.description || "",
          videoUrl: data.videoUrl || "",
          reviewsCount: data.reviewsCount || data.reviewCount || 0,
          studentsCount: data.studentsCount || data.students || 0,
          userId: data.userId || "",
          createdAt: data.createdAt,
          chapters: chaptersCount,
        });
      }

      coursesList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        }
        return 0;
      });

      setCourses(coursesList);

    } catch (error: any) {
      console.error("❌ Erreur chargement cours:", error);
      Alert.alert("Erreur", "Impossible de charger les cours");
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getChaptersCount = async (coursId: string): Promise<number> => {
    try {
      const q = query(
        collection(db, "chapters"), // ✅ Correction: "chapters" au lieu de "chapitres"
        where("coursId", "==", coursId)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("❌ Erreur comptage chapitres:", error);
      return 0;
    }
  };

  const loadChaptersForCourse = async (coursId: string) => {
    try {
      setLoadingChapters(true);
      console.log("🔄 Chargement des chapitres pour le cours:", coursId);
      
      // Essayer avec orderBy si l'index existe
      try {
        const q = query(
          collection(db, "chapters"), // ✅ Correction: "chapters" au lieu de "chapitres"
          where("coursId", "==", coursId),
          orderBy("ordre", "asc")
        );
        const snapshot = await getDocs(q);
        console.log("✅ Chapitres chargés avec orderBy:", snapshot.size);
        
        const chaptersList: Chapter[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          console.log("📖 Chapitre data:", data);
          return {
            id: docSnap.id,
            titre: data.titre || "Sans titre",
            contenu: data.contenu || "",
            description: data.description || "",
            videoUrl: data.videoUrl || "",
            coursId: data.coursId || "",
            ordre: data.ordre || 0,
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
            userId: data.userId || "",
          };
        });

        setChapters(chaptersList);
        return chaptersList;
      } catch (orderError: any) {
        console.log("⚠️ Erreur avec orderBy, tentative sans tri:", orderError);
        
        // Fallback sans orderBy
        const q = query(
          collection(db, "chapters"), // ✅ Correction: "chapters" au lieu de "chapitres"
          where("coursId", "==", coursId)
        );
        const snapshot = await getDocs(q);
        console.log("✅ Chapitres chargés sans orderBy:", snapshot.size);
        
        const chaptersList: Chapter[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          console.log("📖 Chapitre data:", data);
          return {
            id: docSnap.id,
            titre: data.titre || "Sans titre",
            contenu: data.contenu || "",
            description: data.description || "",
            videoUrl: data.videoUrl || "",
            coursId: data.coursId || "",
            ordre: data.ordre || 0,
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
            userId: data.userId || "",
          };
        });

        // Trier manuellement par ordre
        chaptersList.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
        setChapters(chaptersList);
        return chaptersList;
      }

    } catch (error: any) {
      console.error("❌ Erreur chargement chapitres:", error);
      Alert.alert("Erreur", "Impossible de charger les chapitres");
      return [];
    } finally {
      setLoadingChapters(false);
    }
  };

  const showChaptersForCourse = async (course: Course) => {
    console.log("👁️ Affichage des chapitres pour:", course.title);
    setSelectedCourse(course);
    setChaptersModalVisible(true);
    await loadChaptersForCourse(course.id);
  };

  const showCourseDetails = (course: Course) => {
    setSelectedCourse(course);
    setCourseDetailsModalVisible(true);
  };

  const handleDeleteCourse = (courseId: string, courseTitle: string) => {
    Alert.alert(
      "Supprimer le cours",
      `Êtes-vous sûr de vouloir supprimer "${courseTitle}" ? Cette action supprimera également tous ses chapitres.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              // Supprimer d'abord les chapitres associés
              const chaptersQuery = query(
                collection(db, "chapters"), // ✅ Correction: "chapters" au lieu de "chapitres"
                where("coursId", "==", courseId)
              );
              const chaptersSnapshot = await getDocs(chaptersQuery);
              
              for (const chapterDoc of chaptersSnapshot.docs) {
                await deleteDoc(doc(db, "chapters", chapterDoc.id)); // ✅ Correction
              }
              
              // Puis supprimer le cours
              await deleteDoc(doc(db, "courses", courseId));
              Alert.alert("Succès", "Cours et chapitres supprimés");
              if (userId) loadCourses(userId);
            } catch (error) {
              console.error("❌ Erreur suppression:", error);
              Alert.alert("Erreur", "Impossible de supprimer le cours");
            }
          }
        }
      ]
    );
  };

  const handleDeleteChapter = (chapterId: string, chapterTitle: string) => {
    Alert.alert(
      "Supprimer le chapitre",
      `Êtes-vous sûr de vouloir supprimer "${chapterTitle}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "chapters", chapterId)); // ✅ Correction
              Alert.alert("Succès", "Chapitre supprimé");
              if (selectedCourse) {
                await loadChaptersForCourse(selectedCourse.id);
                loadCourses(userId || ""); // Rafraîchir le compteur de chapitres
              }
            } catch (error) {
              console.error("❌ Erreur suppression chapitre:", error);
              Alert.alert("Erreur", "Impossible de supprimer le chapitre");
            }
          }
        }
      ]
    );
  };

  const closeChaptersModal = () => {
    setChaptersModalVisible(false);
    setSelectedCourse(null);
    setChapters([]);
  };

  const closeCourseDetailsModal = () => {
    setCourseDetailsModalVisible(false);
    setSelectedCourse(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (userId) {
      loadCourses(userId);
    } else {
      loadUserAndCourses();
    }
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "débutant": return "bg-green-100 text-green-800";
      case "intermédiaire": return "bg-blue-100 text-blue-800";
      case "avancé": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (createdAt: any): string => {
    try {
      if (!createdAt) return "Date inconnue";
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return date.toLocaleDateString("fr-FR");
    } catch (error) {
      return "Date invalide";
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4361EE" />
        <Text className="mt-4 text-gray-600">Chargement des cours...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-6 pb-4 bg-white shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Mes Cours</Text>
            <Text className="text-gray-500 mt-1">{courses.length} cours créé(s)</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push("/tutor/courses/newcourse")}
            className="bg-green-600 p-3 rounded-full shadow-md"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des cours */}
      <ScrollView 
        className="flex-1 px-5 pt-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#4361EE"]}
          />
        }
      >
        {courses.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center justify-center shadow-sm">
            <Ionicons name="book-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg mt-4 text-center">
              Vous n'avez pas encore créé de cours
            </Text>
            <TouchableOpacity 
              className="bg-green-600 rounded-xl p-4 mt-6 shadow-md"
              onPress={() => router.push("/tutor/courses/newcourse")}
            >
              <Text className="text-white font-semibold">Créer mon premier cours</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="pb-20">
            {courses.map((course) => (
              <View key={course.id} className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-2">
                      {course.title}
                    </Text>
                    
                    <View className="flex-row items-center flex-wrap mb-3">
                      <View className="bg-blue-100 px-3 py-1 rounded-full mr-2">
                        <Text className="text-blue-800 text-xs font-medium">
                          {course.category}
                        </Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${getLevelColor(course.level)}`}>
                        <Text className="text-xs font-medium">
                          {course.level}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center space-x-4 mb-2">
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-500 text-sm ml-1">{course.duration}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="list-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-500 text-sm ml-1">{course.chapters || 0} chapitres</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-500 text-sm ml-1">{formatDate(course.createdAt)}</Text>
                      </View>
                    </View>

                    {course.description && (
                      <Text className="text-gray-600 text-sm mt-2" numberOfLines={2}>
                        {course.description}
                      </Text>
                    )}
                  </View>
                  
                  {/* Boutons actions */}
                  <View className="flex-row bg-gray-50 rounded-lg p-1 ml-2">
                    {/* Voir détails */}
                    <TouchableOpacity 
                      onPress={() => showCourseDetails(course)}
                      className="p-2 rounded-lg hover:bg-gray-200"
                    >
                      <Ionicons name="eye-outline" size={18} color="#6B7280" />
                    </TouchableOpacity>

                    {/* Voir chapitres */}
                    <TouchableOpacity 
                      onPress={() => showChaptersForCourse(course)}
                      className="p-2 rounded-lg hover:bg-gray-200"
                    >
                      <Ionicons name="list-outline" size={18} color="#3B82F6" />
                    </TouchableOpacity>

                    {/* Modifier cours */}
                    <TouchableOpacity 
                      onPress={() => router.push({
                        pathname: "/tutor/courses/editcourse",
                        params: { courseId: course.id }
                      })}
                      className="p-2 rounded-lg hover:bg-gray-200"
                    >
                      <Ionicons name="create-outline" size={18} color="#10B981" />
                    </TouchableOpacity>

                    {/* Supprimer cours */}
                    <TouchableOpacity 
                      onPress={() => handleDeleteCourse(course.id, course.title)}
                      className="p-2 rounded-lg hover:bg-gray-200"
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal chapitres */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={chaptersModalVisible}
        onRequestClose={closeChaptersModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-4/5">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">
                Chapitres: {selectedCourse?.title}
              </Text>
              <TouchableOpacity onPress={closeChaptersModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {loadingChapters ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#4361EE" />
                <Text className="text-gray-600 mt-4">Chargement des chapitres...</Text>
              </View>
            ) : (
              <>
                <ScrollView className="flex-1 mb-4">
                  {chapters.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-12">
                      <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                      <Text className="text-gray-500 text-lg mt-4 text-center">
                        Aucun chapitre pour ce cours
                      </Text>
                    </View>
                  ) : (
                    chapters.map((chapter, index) => (
                      <View key={chapter.id} className="bg-gray-50 rounded-xl p-4 mb-3">
                        <View className="flex-row justify-between items-start">
                          <View className="flex-1">
                            <View className="flex-row items-center mb-2">
                              <View className="bg-blue-100 w-6 h-6 rounded-full items-center justify-center mr-2">
                                <Text className="text-blue-800 font-bold text-xs">
                                  {index + 1}
                                </Text>
                              </View>
                              <Text className="text-gray-900 font-semibold flex-1">
                                {chapter.titre}
                              </Text>
                            </View>
                            
                            {chapter.description && (
                              <Text className="text-gray-600 text-sm mb-2" numberOfLines={2}>
                                {chapter.description}
                              </Text>
                            )}
                            
                            <View className="flex-row items-center space-x-3">
                              {chapter.videoUrl && (
                                <View className="flex-row items-center">
                                  <Ionicons name="videocam-outline" size={12} color="#6B7280" />
                                  <Text className="text-gray-500 text-xs ml-1">Vidéo</Text>
                                </View>
                              )}
                              <Text className="text-gray-500 text-xs">
                                Ordre: {chapter.ordre}
                              </Text>
                            </View>
                          </View>
                          
                          <View className="flex-row space-x-1">
                            <TouchableOpacity 
                              onPress={() => router.push({
                                pathname: "/tutor/courses/editchapitre",
                                params: { 
                                  chapterId: chapter.id,
                                  coursId: chapter.coursId
                                }
                              })}
                              className="p-2 bg-blue-100 rounded-lg"
                            >
                              <Ionicons name="create-outline" size={16} color="#3B82F6" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleDeleteChapter(chapter.id, chapter.titre)}
                              className="p-2 bg-red-100 rounded-lg"
                            >
                              <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>

                <TouchableOpacity 
                  onPress={() => router.push({
                    pathname: "/tutor/courses/newchapitre",
                    params: { coursId: selectedCourse?.id }
                  })}
                  className="bg-blue-600 rounded-xl p-4 items-center shadow-md"
                >
                  <Text className="text-white font-semibold">+ Ajouter un chapitre</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal détails du cours */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={courseDetailsModalVisible}
        onRequestClose={closeCourseDetailsModal}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={closeCourseDetailsModal}
        >
          <View className="bg-white rounded-2xl p-6 w-11/12 max-h-3/4" onStartShouldSetResponder={() => true}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Détails du cours</Text>
              <TouchableOpacity onPress={closeCourseDetailsModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
              <View className="space-y-4">
                <View>
                  <Text className="text-gray-700 font-semibold mb-1">Titre:</Text>
                  <Text className="text-gray-900 text-lg">{selectedCourse?.title}</Text>
                </View>
                
                <View className="flex-row space-x-4">
                  <View className="flex-1">
                    <Text className="text-gray-700 font-semibold mb-1">Catégorie:</Text>
                    <Text className="text-gray-900">{selectedCourse?.category}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-700 font-semibold mb-1">Niveau:</Text>
                    <Text className="text-gray-900">{selectedCourse?.level}</Text>
                  </View>
                </View>

                <View className="flex-row space-x-4">
                  <View className="flex-1">
                    <Text className="text-gray-700 font-semibold mb-1">Durée:</Text>
                    <Text className="text-gray-900">{selectedCourse?.duration}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-700 font-semibold mb-1">Chapitres:</Text>
                    <Text className="text-gray-900">{selectedCourse?.chapters || 0}</Text>
                  </View>
                </View>

                <View className="flex-row space-x-4">
                  <View className="flex-1">
                    <Text className="text-gray-700 font-semibold mb-1">Étudiants:</Text>
                    <Text className="text-gray-900">{selectedCourse?.studentsCount || 0}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-700 font-semibold mb-1">Avis:</Text>
                    <Text className="text-gray-900">{selectedCourse?.reviewsCount || 0}</Text>
                  </View>
                </View>

                <View>
                  <Text className="text-gray-700 font-semibold mb-1">Description:</Text>
                  <Text className="text-gray-900">{selectedCourse?.description || "Aucune description"}</Text>
                </View>

                <View>
                  <Text className="text-gray-700 font-semibold mb-1">Date de création:</Text>
                  <Text className="text-gray-900">{selectedCourse?.createdAt ? formatDate(selectedCourse.createdAt) : "Date inconnue"}</Text>
                </View>

                {selectedCourse?.videoUrl && (
                  <View>
                    <Text className="text-gray-700 font-semibold mb-1">Vidéo:</Text>
                    <Text className="text-blue-600" numberOfLines={1}>
                      {selectedCourse.videoUrl}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}