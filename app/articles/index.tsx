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
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";
import ArticleCard from "@/components/ArticleCard";
import { Ionicons } from "@expo/vector-icons";

interface Article {
  id: string;
  titre: string;
  auteur?: string;
  createdAt?: any; // Changed to any because Firestore timestamps need conversion
  imageUrl?: string;
  commentsCount?: number;
}

export default function ArticlesList() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(
          collection(db, "articles"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);

        const articlesList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            titre: data.titre || "",
            auteur: data.auteur || "Inconnu",
            createdAt: data.createdAt ? formatDate(data.createdAt) : "Récemment",
            imageUrl: data.imageUrl || "",
            commentsCount: data.commentsCount || 0,
          };
        }) as Article[];

        console.log("✅ Articles récupérés :", articlesList);
        setArticles(articlesList);
      } catch (err) {
        console.error("❌ Erreur lors de la récupération des articles :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Fonction pour formater la date Firestore
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "Récemment";
    
    try {
      // Si c'est un timestamp Firestore
      if (timestamp.toDate) {
        const date = timestamp.toDate();
        return date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      
      // Si c'est déjà une string
      if (typeof timestamp === 'string') {
        return timestamp;
      }
      
      return "Récemment";
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return "Récemment";
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-2">Chargement des articles...</Text>
      </SafeAreaView>
    );
  }

  if (articles.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white px-4">
        <Ionicons name="newspaper-outline" size={64} color="#9CA3AF" />
        <Text className="text-gray-500 text-lg text-center mt-4">
          Aucun article disponible pour le moment
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      {/* Header avec retour */}
      <View className="flex-row items-center mt-2 mb-4">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold mr-6">
          Tous les articles
        </Text>
      </View>

      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/articles/${item.id}`)}
            className="mb-4"
          >
            <ArticleCard
              category={item.auteur || "Inconnu"}
              title={item.titre}
              timeAgo={item.createdAt}
              background={item.imageUrl ? { uri: item.imageUrl } : undefined}
            />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View className="h-4" />}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}