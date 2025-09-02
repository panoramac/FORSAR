import { 
  View, Text, ScrollView, TouchableOpacity, 
  TextInput, Alert, Image, ActivityIndicator 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, doc, getDoc, updateDoc, setDoc, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/configs/FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Type pour article
type ArticleData = {
  id?: string;
  titre: string;
  contenu: string;
  imageUrl: string;
  auteur: string;
  authorId: string;
  createdAt?: Date;
  updatedAt: Date;
};

export default function NewArticle() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const articleId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isEditMode = !!articleId;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userName, setUserName] = useState<string>("");

  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    imageUrl: "",
    auteur: ""
  });

  useEffect(() => {
    loadUserName();
    if (isEditMode) loadArticle();
  }, [articleId]);

  // ✅ Charger le nom d'utilisateur depuis AsyncStorage
  const loadUserName = async () => {
    try {
      const name = await AsyncStorage.getItem("userName");
      if (name) {
        setUserName(name);
        setFormData(prev => ({ ...prev, auteur: name }));
      }
    } catch (error) {
      console.error("Erreur chargement username:", error);
    }
  };

  const loadArticle = async () => {
    try {
      setLoading(true);
      const articleDoc = await getDoc(doc(db, "articles", articleId));
      if (articleDoc.exists()) {
        const data = articleDoc.data();
        setFormData({
          titre: data.titre || "",
          contenu: data.contenu || "",
          imageUrl: data.imageUrl || "",
          auteur: data.auteur || userName
        });
      } else {
        Alert.alert("Erreur", "Article non trouvé");
        router.back();
      }
    } catch (error) {
      console.error("Erreur chargement article:", error);
      Alert.alert("Erreur", "Impossible de charger l'article");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    if (name === "auteur" && !isEditMode) {
      Alert.alert("Information", "Le nom d'auteur ne peut pas être modifié");
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Import image
  const pickImageAlternative = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission requise", "Autorisez l'accès à vos photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploading(true);

        if (asset.base64) {
          const base64Image = `data:image/jpeg;base64,${asset.base64}`;
          setFormData(prev => ({ ...prev, imageUrl: base64Image }));
        } else if (asset.uri) {
          setFormData(prev => ({ ...prev, imageUrl: asset.uri }));
        }
        
        Alert.alert("Succès", "Image importée !");
        setUploading(false);
      }
    } catch (error) {
      setUploading(false);
      console.error("Erreur méthode alternative:", error);
      Alert.alert("Erreur", "Impossible d'importer l'image");
    }
  };

  // ✅ Création ou édition article
  const handleSubmit = async () => {
    if (!formData.titre.trim() || !formData.contenu.trim()) {
      Alert.alert("Erreur", "Veuillez remplir les champs obligatoires");
      return;
    }

    const finalAuthor = isEditMode ? formData.auteur : userName;
    if (!finalAuthor) {
      Alert.alert("Erreur", "Nom d'auteur non disponible");
      return;
    }

    try {
      setLoading(true);

      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Erreur", "Utilisateur non connecté");
        return;
      }

      // 🔎 Récupérer le userId Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", user.email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert("Erreur", "Profil utilisateur introuvable");
        return;
      }

      const userProfile = snapshot.docs[0].data();
      const userId = userProfile.userId;

      const articleData: ArticleData = {
        titre: formData.titre.trim(),
        contenu: formData.contenu.trim(),
        imageUrl: formData.imageUrl,
        auteur: finalAuthor,
        authorId: userId,
        updatedAt: new Date(),
      };

      if (isEditMode) {
        await updateDoc(doc(db, "articles", articleId), articleData);
        Alert.alert("Succès", "Article modifié !");
      } else {
        articleData.createdAt = new Date();

        const docRef = await addDoc(collection(db, "articles"), articleData);

        // 🔥 ajouter aussi l'id dans les données
        await setDoc(doc(db, "articles", docRef.id), { ...articleData, id: docRef.id }, { merge: true });

        Alert.alert("Succès", "Article créé !");
      }

      router.back();
    } catch (error) {
      console.error("Erreur création article:", error);
      Alert.alert("Erreur", "Impossible de publier l'article");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    Alert.alert("Supprimer l'image", "Confirmer ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => setFormData(prev => ({ ...prev, imageUrl: "" })),
      },
    ]);
  };

  if (loading && isEditMode) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-2 text-gray-700">Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="px-6 pt-6 pb-4 bg-white shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">
            {isEditMode ? "Modifier l'article" : "Nouvel Article"}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6">
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          {/* Titre */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Titre *</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200"
              placeholder="Titre de l'article"
              value={formData.titre}
              onChangeText={text => handleChange("titre", text)}
              editable={!loading}
            />
          </View>

          {/* Auteur */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Auteur</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 border border-gray-200"
              placeholder="Votre nom"
              value={formData.auteur}
              onChangeText={text => handleChange("auteur", text)}
              editable={isEditMode && !loading}
              readOnly={!isEditMode}
            />
            {!isEditMode && (
              <Text className="text-blue-500 text-xs mt-1">
                Le nom d'auteur est automatiquement rempli
              </Text>
            )}
          </View>

          {/* Image */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Image</Text>
            {formData.imageUrl ? (
              <View className="relative">
                <Image 
                  source={{ uri: formData.imageUrl }} 
                  className="w-full h-48 rounded-lg mb-2"
                  resizeMode="cover"
                />
                <View className="absolute top-2 left-2 bg-green-500 rounded-full px-2 py-1">
                  <Text className="text-white text-xs">✓ Importée</Text>
                </View>
                <TouchableOpacity 
                  onPress={removeImage}
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                >
                  <Ionicons name="trash-outline" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                className="bg-blue-100 rounded-xl p-6 items-center border-2 border-dashed border-blue-300"
                onPress={pickImageAlternative}
                disabled={loading || uploading}
              >
                {uploading ? (
                  <View className="items-center">
                    <ActivityIndicator color="#3B82F6" size="large" />
                    <Text className="text-blue-600 mt-2">Chargement...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="image-outline" size={36} color="#3B82F6" />
                    <Text className="text-blue-600 mt-2 font-medium text-center">
                      Choisir une image
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Contenu */}
          <View className="mb-6">
            <Text className="text-gray-700 mb-2">Contenu *</Text>
            <TextInput
              className="bg-gray-100 rounded-xl p-4 h-64 border border-gray-200"
              placeholder="Contenu de l'article..."
              multiline
              textAlignVertical="top"
              value={formData.contenu}
              onChangeText={text => handleChange("contenu", text)}
              editable={!loading}
            />
          </View>

          {/* Bouton */}
          <TouchableOpacity 
            className={`rounded-xl p-4 items-center ${loading ? "bg-gray-400" : "bg-green-600"}`}
            onPress={handleSubmit}
            disabled={loading || uploading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {isEditMode ? "Modifier" : "Publier"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
