import { 
  View, Text, ScrollView, TouchableOpacity, TextInput, 
  Alert, ActivityIndicator 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";

interface Question {
  question: string;
  options: string[];
  reponseCorrecte: number;
  explication?: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  questions: Question[];
  userId: string;
  createdAt: any;
}

export default function EditQuiz() {
  const router = useRouter();
  const { quizId } = useLocalSearchParams<{ quizId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("10");
  const [level, setLevel] = useState("débutant");
  const [questions, setQuestions] = useState<Question[]>([]);

  /** Charger le quiz depuis Firestore */
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (!quizId) return;
        const quizRef = doc(db, "quizs", quizId);
        const quizSnap = await getDoc(quizRef);

        if (quizSnap.exists()) {
          const data = quizSnap.data() as Quiz;
          setTitle(data.title || "");
          setDescription(data.description || "");
          setDuration(String(data.duration || "10"));
          setLevel(data.level || "débutant");
          setQuestions(data.questions || []);
        } else {
          Alert.alert("Erreur", "Quiz introuvable");
          router.back();
        }
      } catch (error) {
        console.error("❌ Erreur chargement quiz:", error);
        Alert.alert("Erreur", "Impossible de charger le quiz");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const updateQuestionText = (i: number, text: string) => {
    const newQs = [...questions];
    newQs[i].question = text;
    setQuestions(newQs);
  };

  const updateOption = (qi: number, oi: number, text: string) => {
    const newQs = [...questions];
    newQs[qi].options[oi] = text;
    setQuestions(newQs);
  };

  const updateCorrectAnswer = (qi: number, oi: number) => {
    const newQs = [...questions];
    newQs[qi].reponseCorrecte = oi;
    setQuestions(newQs);
  };

  const updateExplication = (qi: number, text: string) => {
    const newQs = [...questions];
    newQs[qi].explication = text;
    setQuestions(newQs);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], reponseCorrecte: 0 }]);
  };

  const removeQuestion = (i: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, idx) => idx !== i));
    }
  };

  /** Sauvegarder les modifications */
  const handleSave = async () => {
    if (!title || questions.some(q => !q.question || q.options.some(o => !o))) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setSaving(true);
      const quizRef = doc(db, "quizs", quizId);

      await updateDoc(quizRef, {
        title,
        description,
        duration: Number(duration),
        level,
        questions,
      });

      Alert.alert("Succès", "Quiz modifié avec succès");
      router.back();
    } catch (error) {
      console.error("❌ Erreur update quiz:", error);
      Alert.alert("Erreur", "Impossible de modifier le quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#4361EE" />
        <Text className="mt-3 text-gray-600">Chargement du quiz...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="px-6 pt-6 pb-4 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Modifier Quiz</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6">
        {/* Infos Quiz */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <Text className="text-lg font-bold mb-4 text-gray-900">Informations du quiz</Text>

          <TextInput
            className="bg-gray-100 rounded-xl p-4 border border-gray-200 mb-4"
            placeholder="Titre du quiz *"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            className="bg-gray-100 rounded-xl p-4 border border-gray-200 mb-4"
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />

          <TextInput
            className="bg-gray-100 rounded-xl p-4 border border-gray-200 mb-4"
            placeholder="Durée (minutes)"
            keyboardType="numeric"
            value={duration}
            onChangeText={setDuration}
          />

          <TextInput
            className="bg-gray-100 rounded-xl p-4 border border-gray-200 mb-4"
            placeholder="Niveau (débutant, intermédiaire, avancé, expert)"
            value={level}
            onChangeText={setLevel}
          />
        </View>

        {/* Questions */}
        <Text className="text-lg font-bold text-gray-900 mb-4">Questions</Text>
        {questions.map((q, qi) => (
          <View key={qi} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-700 font-medium">Question {qi + 1}</Text>
              {questions.length > 1 && (
                <TouchableOpacity onPress={() => removeQuestion(qi)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              className="bg-white rounded-xl p-3 border border-gray-200 mb-3"
              placeholder="Texte de la question"
              value={q.question}
              onChangeText={(text) => updateQuestionText(qi, text)}
            />

            {q.options.map((opt, oi) => (
              <View key={oi} className="flex-row items-center mb-2">
                <TouchableOpacity 
                  className="mr-2"
                  onPress={() => updateCorrectAnswer(qi, oi)}
                >
                  <Ionicons 
                    name={q.reponseCorrecte === oi ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color="#4361EE" 
                  />
                </TouchableOpacity>
                <TextInput
                  className="flex-1 bg-white rounded-xl p-3 border border-gray-200"
                  placeholder={`Option ${oi + 1}`}
                  value={opt}
                  onChangeText={(text) => updateOption(qi, oi, text)}
                />
              </View>
            ))}

            <TextInput
              className="bg-white rounded-xl p-3 border border-gray-200 mt-3"
              placeholder="Explication (optionnel)"
              value={q.explication || ""}
              onChangeText={(text) => updateExplication(qi, text)}
            />
          </View>
        ))}

        <TouchableOpacity 
          className="bg-blue-100 rounded-xl p-4 items-center mb-6 border border-blue-200"
          onPress={addQuestion}
        >
          <Ionicons name="add-circle-outline" size={24} color="#4361EE" />
          <Text className="text-blue-600 mt-1">Ajouter une question</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-amber-600 rounded-xl p-4 items-center"
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Enregistrer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
