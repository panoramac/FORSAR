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
  createdAt?: string;
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

        const articlesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Article[];

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
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text>Aucun article trouvé</Text>
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
              timeAgo={item.createdAt || "Récemment"}
              background={{ uri: item.imageUrl }}
            />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}
