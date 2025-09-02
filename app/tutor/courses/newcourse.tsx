import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection } from "firebase/firestore";
import { db, storage } from "@/configs/FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function NewCourse() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    introduction: "",
    duration: "",
    level: "débutant",
    videoUrl: ""
  });

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission requise", "Autorisez l'accès à vos vidéos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 300,
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingVideo(true);
        setUploadProgress(0);

        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (!fileInfo.exists) {
          Alert.alert("Erreur", "Le fichier vidéo sélectionné n'existe pas");
          setUploadingVideo(false);
          return;
        }

        if (fileInfo.size && fileInfo.size > 100 * 1024 * 1024) {
          Alert.alert("Erreur", "La vidéo est trop volumineuse (max 100MB)");
          setUploadingVideo(false);
          return;
        }

        await uploadVideo(asset);
      }
    } catch (error) {
      console.error("Erreur sélection vidéo:", error);
      setUploadingVideo(false);
      Alert.alert("Erreur", "Erreur lors de la sélection de la vidéo");
    }
  };

  const uploadVideo = async (asset: any) => {
    try {
      const fileExtension = asset.uri.split('.').pop() || 'mp4';
      const fileName = `courses/videos/${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Erreur upload:", error);
          Alert.alert("Erreur", "Échec du téléchargement de la vidéo");
          setUploadingVideo(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setFormData((prev) => ({ 
              ...prev, 
              videoUrl: downloadURL
            }));
            Alert.alert("Succès", "Vidéo téléchargée avec succès");
          } catch (error) {
            console.error("Erreur URL:", error);
            Alert.alert("Erreur", "Impossible de récupérer l'URL de la vidéo");
          } finally {
            setUploadingVideo(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (error) {
      console.error("Erreur upload:", error);
      Alert.alert("Erreur", "Échec du téléchargement de la vidéo");
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.category || !formData.description || !formData.duration) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        Alert.alert("Erreur", "Utilisateur non identifié");
        setLoading(false);
        return;
      }

      const courseData = {
        ...formData,
        createdBy: userId, // ✅ Ajout du userId
        createdAt: new Date(),
        reviewCount: 0,
        students: 0,
        rating: 0,
      };

      await addDoc(collection(db, "courses"), courseData);
      Alert.alert("Succès", "Cours créé avec succès");
      router.back();
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Erreur lors de la création du cours");
    } finally {
      setLoading(false);
    }
  };

  const removeVideo = () => {
    Alert.alert("Supprimer la vidéo", "Confirmer ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => setFormData(prev => ({ ...prev, videoUrl: "" })),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="px-6 pt-6 pb-4 bg-white shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Nouveau Cours</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">Informations du cours</Text>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Titre du cours *</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200"
              placeholder="Entrez le titre du cours"
              value={formData.title}
              onChangeText={(text) => handleChange("title", text)}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Catégorie *</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200"
              placeholder="Ex: Développement, Design..."
              value={formData.category}
              onChangeText={(text) => handleChange("category", text)}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Niveau</Text>
            <View className="bg-gray-100 rounded-xl border border-gray-200">
              <Picker
                selectedValue={formData.level}
                onValueChange={(value) => handleChange("level", value)}
                style={{ height: 50 }}
              >
                <Picker.Item label="Débutant" value="débutant" />
                <Picker.Item label="Intermédiaire" value="intermédiaire" />
                <Picker.Item label="Avancé" value="avancé" />
              </Picker>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Durée (heures) *</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200"
              placeholder="Ex: 5"
              keyboardType="numeric"
              value={formData.duration}
              onChangeText={(text) => handleChange("duration", text)}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Introduction</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 h-20 border border-gray-200"
              placeholder="Brève introduction du cours"
              multiline
              value={formData.introduction}
              onChangeText={(text) => handleChange("introduction", text)}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Description détaillée *</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 h-32 border border-gray-200"
              placeholder="Description complète du cours"
              multiline
              value={formData.description}
              onChangeText={(text) => handleChange("description", text)}
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 mb-2">Vidéo d'introduction</Text>
            
            {formData.videoUrl ? (
              <View className="relative">
                <View className="bg-green-100 rounded-xl p-4 items-center border-2 border-dashed border-green-500">
                  <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                  <Text className="text-green-600 mt-2 font-medium">✓ Vidéo sélectionnée</Text>
                  <TouchableOpacity 
                    onPress={removeVideo}
                    className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
                  >
                    <Ionicons name="trash-outline" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                className="bg-blue-100 rounded-xl p-6 items-center border-2 border-dashed border-blue-400"
                onPress={pickVideo}
                disabled={uploadingVideo}
              >
                {uploadingVideo ? (
                  <View className="items-center">
                    <ActivityIndicator size="large" color="#4361EE" />
                    <Text className="text-blue-600 mt-2">Téléchargement...</Text>
                    {uploadProgress > 0 && (
                      <Text className="text-blue-600 mt-1">{uploadProgress.toFixed(0)}%</Text>
                    )}
                  </View>
                ) : (
                  <>
                    <Ionicons name="videocam-outline" size={32} color="#4361EE" />
                    <Text className="text-blue-600 mt-2 font-medium">Choisir une vidéo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            className={`rounded-xl p-4 items-center mt-4 ${loading ? "bg-blue-400" : "bg-blue-600"}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Créer le cours</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}