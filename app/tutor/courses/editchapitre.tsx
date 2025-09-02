import { useEffect, useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, 
  Alert, ActivityIndicator, ScrollView 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditChapter() {
  const { chapterId, coursId } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [ordre, setOrdre] = useState("1");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    loadChapter();
  }, []);

  const loadChapter = async () => {
    try {
      const snap = await getDoc(doc(db, "chapters", String(chapterId)));
      if (!snap.exists()) {
        Alert.alert("Erreur", "Chapitre introuvable");
        router.back();
        return;
      }
      const data = snap.data();
      setTitre(data.titre || "");
      setContenu(data.contenu || data.content || "");
      setOrdre(data.ordre?.toString() || data.order?.toString() || "1");
      setDescription(data.description || "");
      setVideoUrl(data.videoUrl || "");
    } catch (e) {
      console.error("Erreur chargement chapitre:", e);
      Alert.alert("Erreur", "Impossible de charger le chapitre");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!titre.trim()) {
      Alert.alert("Erreur", "Le titre est obligatoire");
      return;
    }

    const orderNumber = parseInt(ordre) || 1;
    if (orderNumber < 1) {
      Alert.alert("Erreur", "L'ordre doit être supérieur à 0");
      return;
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, "chapters", String(chapterId)), {
        titre: titre.trim(),
        contenu: contenu.trim(),
        ordre: orderNumber,
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        coursId: coursId || null,
        updatedAt: new Date(),
      });
      Alert.alert("Succès", "Chapitre mis à jour avec succès !");
      router.back();
    } catch (e) {
      console.error("Erreur mise à jour chapitre:", e);
      Alert.alert("Erreur", "Échec de la mise à jour du chapitre");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#4361EE" />
        <Text className="mt-4 text-gray-600">Chargement du chapitre...</Text>
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
          <Text className="text-xl font-bold text-gray-900">Modifier le chapitre</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-6">Informations du chapitre</Text>

          {/* Titre */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">
              Titre du chapitre <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200 text-gray-900"
              placeholder="Entrez le titre du chapitre"
              value={titre}
              onChangeText={setTitre}
            />
          </View>

          {/* Ordre */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">Ordre d'affichage</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200 text-gray-900"
              placeholder="1, 2, 3..."
              value={ordre}
              onChangeText={setOrdre}
              keyboardType="numeric"
            />
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">Description</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 h-20 border border-gray-200 text-gray-900"
              placeholder="Description du chapitre"
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Contenu */}
          <View className="mb-5">
            <Text className="text-gray-700 font-medium mb-2">Contenu détaillé</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 h-40 border border-gray-200 text-gray-900"
              placeholder="Contenu complet du chapitre..."
              multiline
              textAlignVertical="top"
              value={contenu}
              onChangeText={setContenu}
            />
          </View>

          {/* URL de la vidéo */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">URL de la vidéo</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200 text-gray-900"
              placeholder="https://exemple.com/video-chapitre.mp4"
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
    </SafeAreaView>
  );
}