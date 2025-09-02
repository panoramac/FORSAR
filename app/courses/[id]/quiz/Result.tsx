import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResultScreen() {
  const router = useRouter();
  const { score, total, coursId } = useLocalSearchParams();

  const finalScore = Number(score);
  const totalQuestions = Number(total);

  // règle : si +50% bonnes réponses => Congrats sinon Retry
  const isSuccess = finalScore >= totalQuestions / 2;

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white p-6">
      {/* Image de félicitations ou de regret */}
      <Image
        source={
          isSuccess
            ? require("@/assets/images/congrats.png")
            : require("@/assets/images/regret.png")
        }
        className="w-64 h-64 mb-6"
        resizeMode="contain"
      />

      <Text className="text-2xl font-bold mb-4">
        {isSuccess ? "🎉 Félicitations !" : "🔄 Réessayez !"}
      </Text>

      <Text className="text-lg mb-6">
        Vous avez obtenu {finalScore} sur {totalQuestions}
      </Text>

      <TouchableOpacity
        className="w-full py-3 bg-blue-500 rounded-lg mb-3"
        onPress={() => router.push("/(tabs)")}
      >
        <Text className="text-center text-white text-lg">Retour à l'accueil</Text>
      </TouchableOpacity>

      {!isSuccess && (
        <TouchableOpacity
          className="w-full py-3 bg-green-500 rounded-lg"
          onPress={() => {
            // Solution 1: Utiliser un cast as any pour contourner la vérification TypeScript
            router.replace({
              pathname: `/courses/${coursId}/quiz/${coursId}` as any,
            });
            
            // Solution alternative: Utiliser router.navigate avec une string simple
            // router.navigate(`/courses/${coursId}/quiz/${coursId}`);
          }}
        >
          <Text className="text-center text-white text-lg">Refaire le quiz</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}