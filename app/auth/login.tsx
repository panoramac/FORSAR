import { View, Text, TextInput, TouchableOpacity, ToastAndroid, Modal, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { signInWithEmailAndPassword, updatePassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from '@/configs/FirebaseConfig';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Interface pour les données utilisateur
interface UserData {
  name?: string;
  role?: string;
  requiresPasswordReset?: boolean;
  lastPasswordUpdate?: Date;
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté au chargement de la page
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        console.log("Utilisateur déjà connecté:", user.email);
        // Rediriger directement si déjà connecté
        await redirectUser(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fonction pour rediriger l'utilisateur selon son rôle
  const redirectUser = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        
        await AsyncStorage.setItem("userName", userData.name || "");
        await AsyncStorage.setItem("userRole", userData.role || "");
        
        console.log("Rôle utilisateur:", userData.role);
        
        // Redirection selon le rôle
        if (userData.role === "student") {
          router.replace("/(tabs)");
        } else if (userData.role === "tutor") {
          router.replace("/tutor");
        } else {
          // Par défaut, rediriger vers la page étudiant
          router.replace("/(tabs)");
        }
      } else {
        console.log("Aucune donnée utilisateur trouvée");
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.log("Erreur lors de la redirection:", error);
      router.replace("/(tabs)");
    }
  };

  const OnSignIn = async () => {
    if (!email || !password) {
      ToastAndroid.show("Veuillez saisir l'email et le mot de passe", ToastAndroid.LONG);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    console.log("Tentative de connexion avec:", cleanEmail);
    
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;
      console.log("✅ Connexion réussie:", user.email);

      // Récupérer les infos utilisateur depuis Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        
        await AsyncStorage.setItem("userName", userData.name || "");
        await AsyncStorage.setItem("userRole", userData.role || "");
        
        console.log("Données utilisateur:", userData);
        
        // Vérifier si l'utilisateur doit réinitialiser son mot de passe
        if (userData.requiresPasswordReset) {
          setShowResetModal(true);
          setIsLoading(false);
          return;
        }
        
        // Rediriger selon le rôle
        await redirectUser(user.uid);
      } else {
        console.log("Aucune donnée utilisateur trouvée, redirection par défaut");
        router.replace("/(tabs)");
      }

    } catch (error: any) {
      console.log("❌ Erreur Firebase:", error.code, error.message);
      
      switch (error.code) {
        case 'auth/invalid-credential':
          ToastAndroid.show("Email ou mot de passe incorrect. Utilisez 'tempPassword123'", ToastAndroid.LONG);
          break;
        case 'auth/user-not-found':
          ToastAndroid.show("Aucun compte avec cet email", ToastAndroid.LONG);
          break;
        case 'auth/wrong-password':
          ToastAndroid.show("Mot de passe incorrect. Utilisez 'tempPassword123'", ToastAndroid.LONG);
          break;
        case 'auth/user-disabled':
          ToastAndroid.show("Ce compte a été désactivé", ToastAndroid.LONG);
          break;
        case 'auth/invalid-email':
          ToastAndroid.show("Format d'email invalide", ToastAndroid.LONG);
          break;
        default:
          ToastAndroid.show("Erreur de connexion: " + error.message, ToastAndroid.LONG);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      ToastAndroid.show("Veuillez remplir tous les champs", ToastAndroid.LONG);
      return;
    }

    if (newPassword !== confirmPassword) {
      ToastAndroid.show("Les mots de passe ne correspondent pas", ToastAndroid.LONG);
      return;
    }

    if (newPassword.length < 6) {
      ToastAndroid.show("Le mot de passe doit contenir au moins 6 caractères", ToastAndroid.LONG);
      return;
    }

    setIsResetting(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Mettre à jour le mot de passe dans Firebase Auth
        await updatePassword(user, newPassword);
        
        // Mettre à jour Firestore pour indiquer que le mot de passe a été réinitialisé
        await updateDoc(doc(db, "users", user.uid), {
          requiresPasswordReset: false,
          lastPasswordUpdate: new Date()
        });
        
        ToastAndroid.show("Mot de passe mis à jour avec succès", ToastAndroid.LONG);
        setShowResetModal(false);
        
        // Rediriger après la mise à jour du mot de passe
        await redirectUser(user.uid);
      }
    } catch (error: any) {
      console.log("Erreur lors de la mise à jour:", error.message);
      ToastAndroid.show("Erreur lors de la mise à jour: " + error.message, ToastAndroid.LONG);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      {/* Bouton Retour */}
      <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-6">
        <Ionicons name="arrow-back" size={20} color="black" />
      </TouchableOpacity>

      {/* Titre */}
      <Text className="text-3xl font-bold text-center mb-8">Hello Again!</Text>

      {/* Instructions */}
      <Text className="text-gray-600 text-center mb-6">
        Welcome back! We're so excited to see you again.
      </Text>

      {/* Champ Email */}
      <Text className="text-gray-600 mb-2">Email Address</Text>
      <TextInput
        className="bg-gray-100 rounded-xl px-4 py-3 mb-4"
        placeholder="xyz@gmail.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      {/* Champ Password avec option show/hide */}
      <Text className="text-gray-600 mb-2">Password</Text>
      <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-4">
        <TextInput
          className="flex-1"
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons 
            name={showPassword ? "eye-off-outline" : "eye-outline"} 
            size={20} 
            color="#6B7280" 
          />
        </TouchableOpacity>
      </View>

      {/* Bouton Login */}
      <TouchableOpacity
        className="bg-blue-500 rounded-xl py-4 mb-6"
        onPress={OnSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center text-lg">Sign In</Text>
        )}
      </TouchableOpacity>

      {/* Lien Register */}
      <Text className="text-center text-gray-500">
        New User?{" "}
        <Text
          className="text-blue-500"
          onPress={() => router.push("/auth/register")}
        >
          Create Account
        </Text>
      </Text>

      {/* Modal de réinitialisation de mot de passe */}
      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/70 p-5">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <Text className="text-2xl font-bold text-center mb-2">Reset Password</Text>
            <Text className="text-gray-600 text-center mb-6">
              Your account requires a password reset. Please set a new password.
            </Text>

            <Text className="text-gray-600 mb-2">New Password</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-4">
              <TextInput
                className="flex-1"
                placeholder="Enter new password"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons 
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 mb-2">Confirm Password</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-6">
              <TextInput
                className="flex-1"
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between">
              <TouchableOpacity
                className="bg-gray-300 rounded-xl py-3 px-6"
                onPress={() => {
                  setShowResetModal(false);
                  signOut(auth);
                }}
                disabled={isResetting}
              >
                <Text className="text-gray-800 text-center">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="bg-blue-500 rounded-xl py-3 px-6"
                onPress={handlePasswordUpdate}
                disabled={isResetting}
              >
                {isResetting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center">Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}