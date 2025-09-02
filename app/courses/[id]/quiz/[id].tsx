import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";
import QuizCard from "@/components/QuizCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const courseId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        console.log("🔍 Fetching quiz for courseId:", courseId);
        
        const q = query(collection(db, "quizs"), where("coursId", "==", courseId));
        const snap = await getDocs(q);

        console.log("📊 Quiz documents found:", snap.size);
        
        if (!snap.empty) {
          snap.docs.forEach((doc) => {
            console.log("📝 Quiz data:", doc.id, doc.data());
          });

          const rawData = snap.docs[0].data();
          console.log("📋 Raw quiz data:", rawData);

          // Vérification et normalisation des questions
          if (rawData.questions && Array.isArray(rawData.questions)) {
            const normalizedQuestions = rawData.questions.map((q: any, index: number) => {
              console.log(`❓ Question ${index}:`, q);
              
              // Normaliser les options
              let optionsArray: string[] = [];
              if (q.options && typeof q.options === 'object') {
                optionsArray = Object.values(q.options).filter((opt): opt is string => typeof opt === 'string');
              } else if (Array.isArray(q.options)) {
                optionsArray = q.options.filter((opt: any) => typeof opt === 'string');
              } else {
                // Fallback si options n'existe pas ou est invalide
                optionsArray = ["Option 1", "Option 2", "Option 3", "Option 4"];
              }
              
              // ✅ CORRECTION ICI : Utiliser responseCorrecte
              let correctAnswer = 0;
              if (typeof q.responseCorrecte === 'number') {
                correctAnswer = q.responseCorrecte;
              } else if (typeof q.responseCorrecte === 'string') {
                correctAnswer = parseInt(q.responseCorrecte, 10) || 0;
              }

              return {
                ...q,
                options: optionsArray,
                responseCorrecte: correctAnswer,
              };
            });

            setQuiz({
              id: snap.docs[0].id,
              ...rawData,
              questions: normalizedQuestions,
            });
          } else {
            console.log("❌ No questions array found in quiz data");
            Alert.alert("Error", "Quiz format is invalid - no questions found");
          }
        } else {
          console.log("❌ No quiz found for this course");
          Alert.alert("No Quiz", "No quiz available for this course yet");
        }
      } catch (err) {
        console.log("🔥 Error fetching quiz:", err);
        Alert.alert("Error", "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchQuiz();
    } else {
      console.log("❌ No courseId provided");
      setLoading(false);
    }
  }, [courseId]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-2 text-gray-600">Loading quiz...</Text>
      </View>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Ionicons name="alert-circle-outline" size={64} color="#6b7280" />
        <Text className="text-gray-500 text-lg text-center mt-4">
          No quiz available for this course yet
        </Text>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-lg mt-6"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];

  const handleNext = () => {
    let newScore = score;

    // ✅ CORRECTION ICI : Utiliser responseCorrecte
    if (selectedOption === currentQuestion.responseCorrecte) {
      newScore += 1;
      setScore(newScore);
    }

    // Passer à la question suivante ou afficher les résultats
    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      router.push({
        pathname: "/courses/[id]/quiz/Result",
        params: {
          score: newScore.toString(),
          total: quiz.questions.length.toString(),
          coursId: quiz.coursId,
          chapitreId: quiz.chapitreId || "",
        },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-4">
      {/* Header avec bouton de retour */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold mr-6">
          Question {currentIndex + 1} sur {quiz.questions.length}
        </Text>
      </View>

      {/* ✅ AJOUT : Afficher la question au-dessus du QuizCard */}
      <View className="mb-6 px-4">
        <Text className="text-xl font-bold text-center mb-4">
          {currentQuestion?.question || "No question text"}
        </Text>
      </View>

      {/* ✅ CORRECTION : Retirer la prop 'question' qui n'existe pas dans QuizCard */}
      {currentQuestion ? (
        <QuizCard
          index={currentIndex}
          options={currentQuestion.options || []}
          selectedOption={selectedOption}
          correctAnswer={currentQuestion.responseCorrecte}
          explanation={currentQuestion.explication || ""}
          onSelect={setSelectedOption}
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text>Question non disponible</Text>
        </View>
      )}

      <TouchableOpacity
        className={`w-full py-3 mt-6 rounded-lg ${
          selectedOption === null ? "bg-gray-300" : "bg-blue-500"
        }`}
        disabled={selectedOption === null}
        onPress={handleNext}
      >
        <Text className="text-center text-white text-lg">
          {currentIndex + 1 === quiz.questions.length ? "Finish" : "Continue"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}