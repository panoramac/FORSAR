import { View, Text, Image, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SingleArticle() {
  const { id } = useLocalSearchParams(); // récupère l'id depuis l'URL / route
  const router = useRouter();
  const [article, setArticle] = useState<any>(null);

  // Charger l'article depuis Firestore
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const docRef = doc(db, "articles", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setArticle(docSnap.data());
        }
      } catch (error) {
        console.error("Erreur Firebase (article) :", error);
      }
    };

    if (id) fetchArticle();
  }, [id]);

  if (!article) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text>Loading article...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        {/* Image cover */}
        <View className="relative">
          <Image
            source={{ uri: article.imageUrl }}
            className="w-full h-60"
            resizeMode="cover"
          />
          {/* Bouton retour (style Profile) */}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-4 left-4 bg-gray-200 p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={22} color="black" />
          </Pressable>
        </View>

        {/* Contenu */}
        <View className="px-5 py-6">
          {/* Date */}
          {article.createdAt && (
            <Text className="text-xs text-gray-400">
              Published on{" "}
              {new Date(article.createdAt).toLocaleDateString("en-US")}
            </Text>
          )}

          {/* Titre */}
          <Text className="text-2xl font-bold text-gray-900 mt-1">
            {article.titre}
          </Text>

          {/* Auteur */}
          {article.auteur && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="person-circle-outline" size={18} color="#6B7280" />
              <Text className="ml-1 text-sm text-gray-600">
                {article.auteur}
              </Text>
            </View>
          )}

          {/* Corps du texte */}
          <Text className="text-base text-gray-700 mt-4 leading-6">
            {article.contenu}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
