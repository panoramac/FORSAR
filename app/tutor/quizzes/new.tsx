import { 
  View, Text, ScrollView, TouchableOpacity, TextInput, 
  Alert, ActivityIndicator 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from '@/configs/FirebaseConfig';
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Définition des types
interface Course {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  introduction: string;
  level: string;
  reviewsCount: number;
  studentsCount: number;
  videoUrl: string;
  [key: string]: any;
}

interface Chapter {
  id: string;
  titre: string;
  numero?: number;
  coursId: string;
  [key: string]: any;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface FormData {
  title: string;
  description: string;
  coursId: string;
  chapitreId: string;
  level: string;
  duration: string;
}

export default function NewQuiz() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", "", "", ""], correctAnswer: 0 }
  ]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    coursId: "",
    chapitreId: "",
    level: "facile",
    duration: "10"
  });

  // 🔹 Charger les cours
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setFetching(true);
        const coursesQuery = query(collection(db, "courses"));
        const coursesSnapshot = await getDocs(coursesQuery);

        const coursesList: Course[] = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Course));

        setCourses(coursesList);
      } catch (error) {
        console.error("Erreur chargement cours:", error);
        Alert.alert("Erreur", "Impossible de charger les cours");
      } finally {
        setFetching(false);
      }
    };

    fetchCourses();
  }, []);

  // 🔹 Charger les chapitres d’un cours sélectionné
  useEffect(() => {
    const fetchChapters = async () => {
      if (!formData.coursId) {
        setChapters([]);
        return;
      }

      try {
        setFetching(true);
        let chaptersQuery = query(
          collection(db, "chapitres"),
          where("coursId", "==", formData.coursId)
        );

        let chaptersSnapshot = await getDocs(chaptersQuery);

        if (chaptersSnapshot.empty) {
          chaptersQuery = query(
            collection(db, "chapters"),
            where("coursId", "==", formData.coursId)
          );
          chaptersSnapshot = await getDocs(chaptersQuery);
        }

        const chaptersList: Chapter[] = chaptersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Chapter));

        setChapters(chaptersList);
      } catch (error) {
        console.error("Erreur chargement chapitres:", error);
        Alert.alert("Erreur", "Impossible de charger les chapitres");
      } finally {
        setFetching(false);
      }
    };

    fetchChapters();
  }, [formData.coursId]);

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "coursId" && { chapitreId: "" })
    }));
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const updateQuestionText = (index: number, text: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].question = text;
    setQuestions(updatedQuestions);
  };

  const updateCorrectAnswer = (questionIndex: number, answerIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].correctAnswer = answerIndex;
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  // 🔹 Enregistrer le quiz avec userId automatique
  const handleSubmit = async () => {
    if (!formData.title || !formData.coursId || !formData.chapitreId || 
        questions.some(q => !q.question || q.options.some(o => !o))) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    try {
      setLoading(true);
      const userId = (await AsyncStorage.getItem("userId")) || "";

      const quizData = {
        ...formData,
        userId, // ✅ userId de l’utilisateur connecté
        questions,
        createdAt: new Date(),
        participants: 0,
        averageScore: 0
      };

      await addDoc(collection(db, "quizs"), quizData);

      Alert.alert("Succès", "Quiz créé avec succès");
      router.back();
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Erreur lors de la création du quiz");
    } finally {
      setLoading(false);
    }
  };

  if (fetching && courses.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-2 text-gray-700">Chargement des cours...</Text>
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
          <Text className="text-2xl font-bold text-gray-900">Nouveau Quiz</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">Informations du quiz</Text>

          {/* Titre */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Titre du quiz *</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200"
              placeholder="Titre du quiz"
              value={formData.title}
              onChangeText={(text) => handleChange('title', text)}
            />
          </View>

          {/* Cours */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Cours *</Text>
            <View className="bg-gray-100 rounded-xl border border-gray-200">
              <Picker
                selectedValue={formData.coursId}
                onValueChange={(value) => handleChange('coursId', value)}
              >
                <Picker.Item label="Sélectionner un cours" value="" />
                {courses.map((course) => (
                  <Picker.Item 
                    key={course.id} 
                    label={`${course.title} (${course.category})`} 
                    value={course.id} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Chapitre */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Chapitre *</Text>
            <View className="bg-gray-100 rounded-xl border border-gray-200">
              <Picker
                selectedValue={formData.chapitreId}
                onValueChange={(value) => handleChange('chapitreId', value)}
                enabled={!!formData.coursId && chapters.length > 0}
              >
                <Picker.Item 
                  label={
                    fetching ? "Chargement..." : 
                    !formData.coursId ? "Sélectionnez d'abord un cours" : 
                    chapters.length === 0 ? "Aucun chapitre trouvé" : 
                    "Sélectionner un chapitre"
                  } 
                  value="" 
                />
                {chapters.map((chapter) => (
                  <Picker.Item 
                    key={chapter.id} 
                    label={chapter.titre || `Chapitre ${chapter.numero || ''}`} 
                    value={chapter.id} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Niveau */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Niveau de difficulté</Text>
            <View className="bg-gray-100 rounded-xl border border-gray-200">
              <Picker
                selectedValue={formData.level}
                onValueChange={(value) => handleChange('level', value)}
              >
                <Picker.Item label="Facile" value="facile" />
                <Picker.Item label="Moyen" value="moyen" />
                <Picker.Item label="Difficile" value="difficile" />
              </Picker>
            </View>
          </View>

          {/* Durée */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Durée (minutes) *</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200"
              placeholder="Ex: 10"
              keyboardType="numeric"
              value={formData.duration}
              onChangeText={(text) => handleChange('duration', text)}
            />
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-gray-700 mb-2">Description</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 h-20 border border-gray-200"
              placeholder="Description du quiz"
              multiline
              value={formData.description}
              onChangeText={(text) => handleChange('description', text)}
            />
          </View>

          {/* Questions */}
          <Text className="text-lg font-bold text-gray-900 mb-4">Questions</Text>
          {questions.map((question, questionIndex) => (
            <View key={questionIndex} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-700 font-medium">Question {questionIndex + 1}</Text>
                {questions.length > 1 && (
                  <TouchableOpacity onPress={() => removeQuestion(questionIndex)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <View className="mb-3">
                <TextInput
                  className="bg-white rounded-xl p-3 border border-gray-200"
                  placeholder="Entrez la question"
                  value={question.question}
                  onChangeText={(text) => updateQuestionText(questionIndex, text)}
                />
              </View>

              <Text className="text-gray-700 mb-2">Options de réponse *</Text>
              {question.options.map((option, optionIndex) => (
                <View key={optionIndex} className="flex-row items-center mb-2">
                  <TouchableOpacity 
                    className="mr-3"
                    onPress={() => updateCorrectAnswer(questionIndex, optionIndex)}
                  >
                    <Ionicons 
                      name={question.correctAnswer === optionIndex ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color="#4361EE" 
                    />
                  </TouchableOpacity>
                  <TextInput
                    className="flex-1 bg-white rounded-xl p-3 border border-gray-200"
                    placeholder={`Option ${optionIndex + 1}`}
                    value={option}
                    onChangeText={(text) => updateOption(questionIndex, optionIndex, text)}
                  />
                </View>
              ))}
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
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Créer le quiz</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
