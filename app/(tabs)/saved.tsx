import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import React, { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import background from "@/assets/images/background.png";

const Saved = () => {
  const router = useRouter();
  const [savedCourses, setSavedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Recharger à chaque fois que la page est affichée
  useFocusEffect(
    useCallback(() => {
      const loadSavedCourses = async () => {
        try {
          console.log("Chargement des cours sauvegardés...");
          const jsonValue = await AsyncStorage.getItem("savedCoursesData");
          if (jsonValue) {
            const parsed = JSON.parse(jsonValue);
            console.log("Cours trouvés :", parsed);
            setSavedCourses(parsed);
          } else {
            console.log("Aucun cours trouvé dans AsyncStorage");
            setSavedCourses([]);
          }
        } catch (error) {
          console.error("Erreur lors du chargement des cours sauvegardés:", error);
        } finally {
          setLoading(false);
        }
      };

      loadSavedCourses();
    }, [])
  );

  const removeSavedCourse = async (courseId: string) => {
    try {
      console.log("Suppression du cours ID:", courseId);
      const updatedCourses = savedCourses.filter((course) => course.id !== courseId);
      setSavedCourses(updatedCourses);
      await AsyncStorage.setItem("savedCoursesData", JSON.stringify(updatedCourses));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const renderCourse = ({ item }: { item: any }) => (
    <View className="mb-4 bg-white rounded-xl overflow-hidden border border-gray-200">
      <Image source={background} className="w-full h-40" resizeMode="cover" />

      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <Text className="text-lg font-semibold text-gray-900 flex-1 mr-2" numberOfLines={2}>
            {item.title}
          </Text>

          <TouchableOpacity onPress={() => removeSavedCourse(item.id)} className="p-2">
            <Ionicons name="bookmark" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
          {item.description}
        </Text>

        <View className="flex-row justify-between mt-3">
          <Text className="text-xs text-gray-500">{item.chapters} Leçons</Text>
          <Text className="text-xs text-gray-500">{item.duration}h</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push(`/courses/${item.id}`)}
          className="bg-blue-500 py-2 px-4 rounded-lg mt-3"
        >
          <Text className="text-white text-center font-medium">Continuer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold mr-6">
          Cours Sauvegardés
        </Text>
      </View>

      {savedCourses.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="bookmark-outline" size={60} color="#D1D5DB" />
          <Text className="text-gray-500 text-center mt-4 text-lg">
            Aucun cours sauvegardé
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Appuyez sur l'icône bookmark pour enregistrer des cours
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedCourses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourse}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

export default Saved;
