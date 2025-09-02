import { 
  View, Text, ScrollView, TouchableOpacity, 
  Image, Alert, ActivityIndicator, RefreshControl 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { 
  collection, query, where, getDocs, 
  deleteDoc, doc, orderBy 
} from "firebase/firestore";
import { db, auth } from "@/configs/FirebaseConfig";

interface Article {
  id: string;
  titre: string;
  contenu: string;
  imageUrl?: string;
  createdAt?: any;
  auteur?: string;
  authorId: string;
}

export default function ArticlesIndex() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Erreur", "Utilisateur non identifié");
      setLoading(false);
      return;
    }

    // 1️⃣ Récupérer le profil utilisateur depuis Firestore
    const usersRef = collection(db, "users");
    const qUser = query(usersRef, where("email", "==", user.email)); // ou where("uid", "==", user.uid) selon ta structure
    const userSnapshot = await getDocs(qUser);

    if (userSnapshot.empty) {
      console.log("⚠️ Aucun profil trouvé pour:", user.email);
      setArticles([]);
      setLoading(false);
      return;
    }

    const userData = userSnapshot.docs[0].data();
    const userProfileId = userData.userId; // 👈 c’est ce champ qui correspond à authorId

    console.log("👉 userId Firestore:", userProfileId);

    // 2️⃣ Charger les articles avec ce userId
    const q = query(
      collection(db, "articles"),
      where("authorId", "==", userProfileId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const list: Article[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Article[];

    console.log("📌 Articles de l'utilisateur:", list);

    setArticles(list);
  } catch (error) {
    console.error("Erreur chargement articles:", error);
    Alert.alert("Erreur", "Impossible de charger les articles");
    setArticles([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};


  const handleDelete = (articleId: string, articleTitle: string) => {
    Alert.alert(
      "Supprimer l'article",
      `Êtes-vous sûr de vouloir supprimer "${articleTitle}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "articles", articleId));
              console.log(`🗑️ Article supprimé: ${articleId}`);
              Alert.alert("Succès", "Article supprimé");
              loadArticles();
            } catch (error) {
              console.error("❌ Erreur suppression:", error);
              Alert.alert("Erreur", "Impossible de supprimer l'article");
            }
          }
        }
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadArticles();
  };

  // Formatage robuste de la date
  const formatDate = (createdAt: any): string => {
    try {
      if (!createdAt) return "Date inconnue";
      if (typeof createdAt.toDate === "function") {
        return createdAt.toDate().toLocaleDateString("fr-FR");
      } else if (createdAt instanceof Date) {
        return createdAt.toLocaleDateString("fr-FR");
      } else {
        return new Date(createdAt).toLocaleDateString("fr-FR");
      }
    } catch (error) {
      console.log("⚠️ Erreur lors du formatage de la date:", createdAt, error);
      return "Date invalide";
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4361EE" />
        <Text className="mt-4 text-gray-600">Chargement de vos articles...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-6 pb-4 bg-white">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Mes Articles</Text>
            <Text className="text-gray-500 mt-1">{articles.length} article(s)</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push("/tutor/articles/new")}
            className="bg-green-600 p-3 rounded-full"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste */}
      <ScrollView 
        className="flex-1 px-5 pt-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4361EE']}
          />
        }
      >
        {articles.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center justify-center">
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg mt-4 text-center">
              Vous n'avez pas encore créé d'article
            </Text>
            <TouchableOpacity 
              className="bg-green-600 rounded-xl p-4 mt-6"
              onPress={() => router.push("/tutor/articles/new")}
            >
              <Text className="text-white font-semibold">Créer un article</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="pb-20">
            {articles.map((article) => (
              <View key={article.id} className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
                <View className="flex-row">
                  {article.imageUrl && (
                    <Image 
                      source={{ uri: article.imageUrl }} 
                      className="w-20 h-20 rounded-lg mr-4"
                      resizeMode="cover"
                    />
                  )}
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={2}>
                      {article.titre}
                    </Text>
                    <Text className="text-gray-500 text-sm mb-2">
                      {formatDate(article.createdAt)}
                    </Text>
                    <Text className="text-gray-600 mb-3" numberOfLines={3}>
                      {article.contenu}
                    </Text>
                    
                    <View className="flex-row justify-between">
                      <TouchableOpacity 
                        onPress={() => router.push(`/tutor/articles/new?id=${article.id}`)}
                        className="bg-blue-100 px-3 py-1 rounded-full"
                      >
                        <Text className="text-blue-600 text-sm">Modifier</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={() => handleDelete(article.id, article.titre)}
                        className="bg-red-100 px-3 py-1 rounded-full"
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
