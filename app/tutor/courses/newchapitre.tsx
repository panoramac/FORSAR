import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, storage } from "@/configs/FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function NewChapter() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    ordre: "",
    description: "",
    coursId: "",
    videoUrl: ""
  });

  useEffect(() => {
    loadUserCourses();
  }, []);

  const loadUserCourses = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const coursesQuery = query(collection(db, "courses"), where("createdBy", "==", userId));
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesList: any[] = [];
      
      coursesSnapshot.forEach((doc) => {
        coursesList.push({ id: doc.id, ...doc.data() });
      });
      
      setCourses(coursesList);
    } catch (error) {
      console.error("Erreur chargement cours:", error);
    }
  };

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
      const fileName = `chapters/videos/${Date.now()}.${fileExtension}`;
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
    if (!formData.titre || !formData.contenu || !formData.coursId || !formData.ordre) {
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

      const chapterData = {
        ...formData,
        createdBy: userId, // ✅ Ajout du userId
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "chapitres"), chapterData);
      Alert.alert("Succès", "Chapitre créé avec succès");
      router.back();
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Erreur lors de la création du chapitre");
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
          <Text className="text-2xl font-bold text-gray-900">Nouveau Chapitre</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">Informations du chapitre</Text>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Cours *</Text>
            <View className="bg-gray-100 rounded-xl border border-gray-200">
              <Picker
                selectedValue={formData.coursId}
                onValueChange={(value) => handleChange("coursId", value)}
                style={{ height: 50 }}
              >
                <Picker.Item label="Sélectionner un cours" value="" />
                {courses.map((course) => (
                  <Picker.Item key={course.id} label={course.title} value={course.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Titre du chapitre *</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200"
              placeholder="Entrez le titre du chapitre"
              value={formData.titre}
              onChangeText={(text) => handleChange("titre", text)}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Ordre *</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200"
              placeholder="Numéro d'ordre (ex: 1, 2, 3...)"
              keyboardType="numeric"
              value={formData.ordre}
              onChangeText={(text) => handleChange("ordre", text)}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Description</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 h-20 border border-gray-200"
              placeholder="Description du chapitre"
              multiline
              value={formData.description}
              onChangeText={(text) => handleChange("description", text)}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Contenu *</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 h-32 border border-gray-200"
              placeholder="Contenu détaillé du chapitre"
              multiline
              value={formData.contenu}
              onChangeText={(text) => handleChange("contenu", text)}
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 mb-2">Vidéo du chapitre</Text>
            
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
              <Text className="text-white font-bold text-lg">Créer le chapitre</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}