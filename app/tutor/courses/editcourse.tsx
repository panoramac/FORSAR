import { useEffect, useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, 
  Alert, ActivityIndicator, ScrollView, 
  Pressable, Modal
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditCourse() {
  const { courseId } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("débutant");
  const [duration, setDuration] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [showLevelPicker, setShowLevelPicker] = useState(false);

  useEffect(() => {
    loadCourse();
  }, []);

  const loadCourse = async () => {
    try {
      const snap = await getDoc(doc(db, "courses", String(courseId)));
      if (!snap.exists()) {
        Alert.alert("Erreur", "Cours introuvable");
        router.back();
        return;
      }
      const data = snap.data();
      setTitle(data.title || "");
      setCategory(data.category || "");
      setLevel(data.level || "débutant");
      setDuration(data.duration || "");
      setIntroduction(data.introduction || "");
      setDescription(data.description || "");
      setVideoUrl(data.videoUrl || "");
    } catch (e) {
      console.error("Erreur chargement cours:", e);
      Alert.alert("Erreur", "Impossible de charger le cours");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !category.trim() || !duration.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, "courses", String(courseId)), {
        title: title.trim(),
        category: category.trim(),
        level,
        duration: duration.trim(),
        introduction: introduction.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        updatedAt: new Date(),
      });
      Alert.alert("Succès", "Cours mis à jour avec succès !");
      router.back();
    } catch (e) {
      console.error("Erreur mise à jour cours:", e);
      Alert.alert("Erreur", "Échec de la mise à jour du cours");
    } finally {
      setSaving(false);
    }
  };

  const levels = [
    { label: "Débutant", value: "débutant" },
    { label: "Intermédiaire", value: "intermédiaire" },
    { label: "Avancé", value: "avancé" },
    { label: "Expert", value: "expert" }
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4361EE" />
        <Text className="mt-4 text-gray-600">Chargement du cours...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="bg-white px-6 py-4 shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Modifier le cours</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-6">Informations du cours</Text>

          {/* Titre */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">
              Titre du cours <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200 text-gray-900"
              placeholder="Entrez le titre du cours"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Catégorie */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">
              Catégorie <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200 text-gray-900"
              placeholder="Ex: Développement, Design, Marketing..."
              value={category}
              onChangeText={setCategory}
            />
          </View>

          {/* Niveau */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">Niveau</Text>
            <TouchableOpacity 
              onPress={() => setShowLevelPicker(true)}
              className="bg-gray-100 rounded-xl p-4 border border-gray-200"
            >
              <Text className="text-gray-900">{levels.find(l => l.value === level)?.label || "Sélectionner un niveau"}</Text>
            </TouchableOpacity>
          </View>

          {/* Durée */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">
              Durée <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200 text-gray-900"
              placeholder="Ex: 5h30, 10 heures, 3 jours"
              value={duration}
              onChangeText={setDuration}
            />
          </View>

          {/* Introduction */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">Introduction</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 h-20 border border-gray-200 text-gray-900"
              placeholder="Brève introduction du cours"
              multiline
              value={introduction}
              onChangeText={setIntroduction}
            />
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">Description détaillée</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 h-32 border border-gray-200 text-gray-900"
              placeholder="Description complète du cours"
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* URL de la vidéo */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">URL de la vidéo</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200 text-gray-900"
              placeholder="https://exemple.com/video.mp4"
              value={videoUrl}
              onChangeText={setVideoUrl}
              keyboardType="url"
            />
          </View>

          {/* Bouton de sauvegarde */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`rounded-xl p-4 items-center ${saving ? "bg-blue-400" : "bg-blue-600"}`}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Enregistrer les modifications</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de sélection du niveau */}
      <Modal
        visible={showLevelPicker}
        transparent={true}
        animationType="slide"
      >
        <SafeAreaView className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Sélectionner le niveau</Text>
              <TouchableOpacity onPress={() => setShowLevelPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView className="max-h-80">
              {levels.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => {
                    setLevel(item.value);
                    setShowLevelPicker(false);
                  }}
                  className="py-4 px-4 border-b border-gray-100"
                >
                  <Text className={`text-lg ${level === item.value ? "text-blue-600 font-semibold" : "text-gray-900"}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}