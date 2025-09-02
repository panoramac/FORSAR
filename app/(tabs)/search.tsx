import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";
import SearchBar from "@/components/SearchBar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// Types Firebase
interface Course {
  id: string;
  category?: string;
  chapters?: string[];
  description?: string;
  duration?: string;
  introduction?: string;
  level?: string;
  reviewCount?: number;
  title?: string;
  videoUrl?: string;
  type: "course";
}

interface Chapter {
  id: string;
  contenu?: string;
  coursId: string;
  createdAt?: any;
  description?: string;
  ordre?: number;
  titre?: string;
  updatedAt?: any;
  videoUrl?: string;
  type: "chapter";
}

interface Article {
  id: string;
  auteur?: string;
  contenu?: string;
  createdAt?: any;
  imageUrl?: string;
  titre?: string;
  updatedAt?: any;
  type: "article";
}

type SearchResult = Course | Chapter | Article;

export default function SearchScreen() {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const router = useRouter();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // ✅ Fix pour Timeout
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Fonction de recherche
  const searchContent = async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const [coursesSnapshot, chaptersSnapshot, articlesSnapshot] =
        await Promise.all([
          getDocs(collection(db, "courses")),
          getDocs(collection(db, "chapters")),
          getDocs(collection(db, "articles")),
        ]);

      const lowercaseText = text.toLowerCase();

      const coursesResults = coursesSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data(), type: "course" } as Course))
        .filter(
          (course) =>
            course.title?.toLowerCase().includes(lowercaseText) ||
            course.description?.toLowerCase().includes(lowercaseText) ||
            course.category?.toLowerCase().includes(lowercaseText)
        );

      const chaptersResults = chaptersSnapshot.docs
        .map(
          (doc) => ({ id: doc.id, ...doc.data(), type: "chapter" } as Chapter)
        )
        .filter(
          (chapter) =>
            chapter.titre?.toLowerCase().includes(lowercaseText) ||
            chapter.description?.toLowerCase().includes(lowercaseText)
        );

      const articlesResults = articlesSnapshot.docs
        .map(
          (doc) => ({ id: doc.id, ...doc.data(), type: "article" } as Article)
        )
        .filter(
          (article) =>
            article.titre?.toLowerCase().includes(lowercaseText) ||
            article.auteur?.toLowerCase().includes(lowercaseText) ||
            article.contenu?.toLowerCase().includes(lowercaseText)
        );

      const allResults = [
        ...coursesResults,
        ...chaptersResults,
        ...articlesResults,
      ];
      setResults(allResults);

      if (text && !searchHistory.includes(text)) {
        const newHistory = [text, ...searchHistory.slice(0, 4)];
        setSearchHistory(newHistory);
      }
    } catch (error) {
      console.error("Erreur de recherche:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ debounce avec Timeout
  const handleSearch = (text: string) => {
    setSearchText(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchContent(text);
    }, 300);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const navigateToResult = (item: SearchResult) => {
    if (item.type === "course") {
      router.push(`/courses/${item.id}`);
    } else if (item.type === "chapter") {
      const chapter = item as Chapter;
      router.push(`/courses/${chapter.coursId}/chapters/${chapter.id}`);
    } else if (item.type === "article") {
      router.push(`/articles/${item.id}`);
    }
  };

  // ✅ Fonction pour mettre en surbrillance les mots trouvés
  const highlightText = (text: string, query: string) => {
    if (!query) return <Text>{text}</Text>;

    const words = query.trim().split(/\s+/); // split multi-mots
    const regex = new RegExp(`\\b(${words.join("|")})\\b`, "gi");
    const parts = text.split(regex);

    return (
      <Text>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <Text
              key={index}
              style={{ color: "#2563eb", fontWeight: "bold" }}
            >
              {part}
            </Text>
          ) : (
            <Text key={index}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      className="bg-white p-4 rounded-xl mb-3 shadow-sm active:opacity-70"
      onPress={() => navigateToResult(item)}
    >
      <View className="flex-row items-center">
        <Ionicons
          name={
            item.type === "course"
              ? "book"
              : item.type === "chapter"
              ? "document"
              : "newspaper"
          }
          size={22}
          color="#3b82f6"
          className="mr-3"
        />
        <View className="flex-1">
          {/* ✅ Highlight sur le titre */}
          <Text className="text-lg font-semibold text-gray-900">
            {highlightText(
              item.type === "course"
                ? item.title || ""
                : item.type === "chapter"
                ? item.titre || ""
                : item.titre || "",
              searchText
            )}
          </Text>
          <Text className="text-sm text-gray-500 capitalize mt-1">
            {item.type === "course"
              ? `Cours • ${item.level}`
              : item.type === "chapter"
              ? "Chapitre"
              : `Article par ${(item as Article).auteur || "Inconnu"}`}
          </Text>
          {/* ✅ Highlight sur la description/contenu */}
          <Text numberOfLines={2} className="text-sm text-gray-600 mt-1">
            {highlightText(
              item.type === "course"
                ? item.description || ""
                : item.type === "chapter"
                ? item.description || ""
                : (item as Article).contenu?.substring(0, 100) + "..." || "",
              searchText
            )}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }} className="p-4">
        {/* Header avec barre de recherche */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-full bg-gray-100 mr-2"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <SearchBar
              placeholder="Search courses, chapters, articles..."
              onSearch={handleSearch}
            />
          </View>
        </View>

        {/* Historique */}
        {searchText === "" && searchHistory.length > 0 && (
          <View className="mt-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-700 font-medium text-base">
                Recent Searches
              </Text>
              <TouchableOpacity onPress={clearSearchHistory}>
                <Text className="text-blue-500 text-sm">Clear</Text>
              </TouchableOpacity>
            </View>
            {searchHistory.map((term, index) => (
              <TouchableOpacity
                key={index}
                className="bg-white p-3 rounded-lg mb-2 flex-row items-center active:opacity-70"
                onPress={() => {
                  setSearchText(term);
                  searchContent(term);
                }}
              >
                <Ionicons name="time-outline" size={18} color="#6b7280" />
                <Text className="ml-2 text-gray-800">{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Résultats */}
        {searchText !== "" && (
          <View className="mt-4 flex-1">
            <Text className="text-gray-700 font-medium mb-3">
              {results.length} result(s) for "{searchText}"
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  !loading && (
                    <View className="items-center mt-10">
                      <Ionicons name="search-outline" size={50} color="#d1d5db" />
                      <Text className="text-gray-500 mt-3 text-center text-base">
                        No results found for "{searchText}"
                      </Text>
                      <Text className="text-gray-400 mt-1 text-center text-sm">
                        Try different keywords or check spelling
                      </Text>
                    </View>
                  )
                }
              />
            )}
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
