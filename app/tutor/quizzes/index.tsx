import { 
  View, Text, ScrollView, TouchableOpacity, Alert, 
  ActivityIndicator, RefreshControl 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, getDoc, query, where } from "firebase/firestore";
import { db, auth } from '@/configs/FirebaseConfig';
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Quiz {
  id: string;
  coursId: string;
  chapitreId: string;
  questions: any[];
  userId: string;
  createdAt: any;
  coursTitle?: string;
  chapitreTitle?: string;
  auteurName?: string;
}

export default function QuizzesIndex() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    loadUserAndQuizzes();
  }, []);

  /** Charger l’utilisateur connecté + ses quiz */
  const loadUserAndQuizzes = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Erreur", "Utilisateur non connecté");
        setLoading(false);
        return;
      }

      let storedUserId = await AsyncStorage.getItem("userId");

      if (!storedUserId) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          storedUserId = (userData.userId as string) || user.uid;
        } else {
          storedUserId = user.uid;
        }
        await AsyncStorage.setItem("userId", storedUserId);
      }

      setUserId(storedUserId);
      await loadQuizzes(storedUserId);
    } catch (error) {
      console.error("❌ loadUserAndQuizzes:", error);
      Alert.alert("Erreur", "Impossible de charger les données utilisateur");
      setLoading(false);
    }
  };

  /** Charger uniquement les quiz créés par cet user */
  const loadQuizzes = async (currentUserId: string) => {
    try {
      setRefreshing(true);

      const quizzesQuery = query(
        collection(db, "quizs"),
        where("userId", "==", currentUserId)
      );
      const quizzesSnapshot = await getDocs(quizzesQuery);

      const quizzesList: Quiz[] = await Promise.all(
        quizzesSnapshot.docs.map(async (docSnap) => {
          const quizData = docSnap.data();

          // 🔹 Résolution des relations
          let coursTitle = "Cours inconnu";
          let chapitreTitle = "Chapitre inconnu";
          let auteurName = "Inconnu";

          try {
            // récupérer cours
            if (quizData.coursId) {
              const coursDoc = await getDoc(doc(db, "courses", quizData.coursId));
              if (coursDoc.exists()) {
                coursTitle = coursDoc.data().title || coursTitle;
              }
            }

            // récupérer chapitre
            if (quizData.chapitreId) {
              const chapitreDoc = await getDoc(doc(db, "chapters", quizData.chapitreId));
              if (chapitreDoc.exists()) {
                chapitreTitle = chapitreDoc.data().titre || chapitreTitle;
              }
            }

            // récupérer auteur
            if (quizData.userId) {
              const userDoc = await getDoc(doc(db, "users", quizData.userId));
              if (userDoc.exists()) {
                auteurName = userDoc.data().name || auteurName;
              }
            }
          } catch (e) {
            console.error("⚠️ Erreur chargement relations:", e);
          }

          return {
            id: docSnap.id,
            coursId: quizData.coursId,
            chapitreId: quizData.chapitreId,
            questions: quizData.questions || [],
            userId: quizData.userId,
            createdAt: quizData.createdAt,
            coursTitle,
            chapitreTitle,
            auteurName,
          };
        })
      );

      // Tri par date
      quizzesList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setQuizzes(quizzesList);
    } catch (error) {
      console.error("❌ loadQuizzes:", error);
      Alert.alert("Erreur", "Impossible de charger les quiz");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (quizId: string) => {
    Alert.alert(
      "Supprimer le quiz",
      `Voulez-vous supprimer ce quiz ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "quizs", quizId));
              if (userId) loadQuizzes(userId);
            } catch (error) {
              console.error("❌ Suppression:", error);
              Alert.alert("Erreur", "Impossible de supprimer le quiz");
            }
          }
        }
      ]
    );
  };

  const handleRefresh = () => {
    if (userId) {
      loadQuizzes(userId);
    } else {
      loadUserAndQuizzes();
    }
  };

  const formatDate = (createdAt: any): string => {
    try {
      if (!createdAt) return "Date inconnue";
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return date.toLocaleDateString("fr-FR");
    } catch {
      return "Date invalide";
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4361EE" />
        <Text className="mt-4 text-gray-600">Chargement des quiz...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="px-6 pt-6 pb-4 bg-white shadow-sm">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Mes Quiz</Text>
            <Text className="text-gray-500 mt-1">{quizzes.length} quiz créé(s)</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push("/tutor/quizzes/new")}
            className="bg-amber-600 p-3 rounded-full shadow-md"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#4361EE"]}
          />
        }
      >
        {quizzes.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center justify-center shadow-sm">
            <Ionicons name="help-circle-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg mt-4 text-center">
              Vous n'avez pas encore créé de quiz
            </Text>
          </View>
        ) : (
          <View className="pb-20">
            {quizzes.map((quiz) => (
              <View key={quiz.id} className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100">
                <Text className="text-lg font-bold text-gray-900 mb-2">
                  📘 {quiz.coursTitle}
                </Text>
                <Text className="text-gray-700 mb-2">
                  📖 Chapitre: {quiz.chapitreTitle}
                </Text>
                <Text className="text-gray-700 mb-2">
                  👤 Auteur: {quiz.auteurName}
                </Text>
                <Text className="text-gray-600 mb-2">
                  ❓ {quiz.questions.length} questions
                </Text>
                <Text className="text-gray-400 text-xs mb-4">
                  Créé le {formatDate(quiz.createdAt)}
                </Text>

                <View className="flex-row space-x-2">
                  <TouchableOpacity 
                    onPress={() => router.push({
                      pathname: "/tutor/quizzes/edit",
                      params: { quizId: quiz.id }
                    })}
                    className="bg-blue-100 px-3 py-2 rounded-full flex-row items-center"
                  >
                    <Ionicons name="create-outline" size={14} color="#3B82F6" />
                    <Text className="text-blue-600 ml-1 text-xs">Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDelete(quiz.id)}
                    className="bg-red-100 px-3 py-2 rounded-full flex-row items-center"
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    <Text className="text-red-600 ml-1 text-xs">Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
