import { View, Text, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import * as ImagePicker from 'expo-image-picker';

export default function Profile() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editable, setEditable] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setEmail(user.email || "");
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setName(data.name || "");
            // Charger l'image de profil si elle existe dans profilePicture
            if (data.profilePicture) {
              setProfilePicture(data.profilePicture);
              console.log("Profile picture loaded:", data.profilePicture);
            } else {
              // Image par défaut si aucune image n'est définie
              setProfilePicture("https://via.placeholder.com/100");
              console.log("Using default placeholder image");
            }
          }
        } catch (error) {
          console.log("Error loading user data:", error);
          setProfilePicture("https://via.placeholder.com/100");
        } finally {
          setIsImageLoading(false);
        }
      }
    };
    loadUserData();
  }, []);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setProfilePicture(result.assets[0].uri);
        // Ici vous pouvez uploader l'image vers Firebase Storage et sauvegarder l'URL dans profilePicture
        Alert.alert('Success', 'Profile picture updated! (Note: This is a demo, image is not saved to server)');
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), { 
          name,
          profilePicture // Sauvegarder l'URL de l'image dans le champ profilePicture
        });
        await AsyncStorage.setItem("userName", name);
        Alert.alert("Success", "Profile updated successfully");
        setEditable(false);
      }
    } catch (error) {
      console.log("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setIsChangingPassword(true);
    try {
      const user = auth.currentUser;
      if (user && user.email) {
        // Réauthentifier l'utilisateur
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Mettre à jour le mot de passe
        await updatePassword(user, newPassword);
        
        Alert.alert("Success", "Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsChangingPassword(false);
      }
    } catch (error: any) {
      console.log("Error changing password:", error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert("Error", "Current password is incorrect");
      } else {
        Alert.alert("Error", "Failed to change password: " + error.message);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          onPress: async () => {
            try {
              await signOut(auth);
              await AsyncStorage.clear();
              router.replace("/auth/login");
            } catch (error) {
              console.log("Error logging out:", error);
            }
          }
        }
      ]
    );
  };

  const cancelEdit = () => {
    setEditable(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      {/* Header */}
      <View className="flex-row items-center mt-2 mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold mr-6">Profile</Text>
      </View>

      {/* Profile Picture */}
      <View className="items-center mt-4">
        {isImageLoading ? (
          <View className="w-24 h-24 rounded-full bg-gray-200 justify-center items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
          </View>
        ) : profilePicture ? (
          <Image
            source={{ uri: profilePicture }}
            className="w-24 h-24 rounded-full"
            onError={(e) => {
              console.log("Error loading image:", e.nativeEvent.error);
              setProfilePicture("https://via.placeholder.com/100");
            }}
          />
        ) : (
          <View className="w-24 h-24 rounded-full bg-gray-200 justify-center items-center">
            <Ionicons name="person" size={40} color="gray" />
          </View>
        )}
        <TouchableOpacity 
          className="absolute bottom-0 right-[38%] bg-blue-500 p-1.5 rounded-full"
          onPress={pickImage}
        >
          <Ionicons name="camera" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Name */}
      <Text className="mt-6 mb-2 text-gray-500">Your Name</Text>
      <TextInput
        className={`bg-gray-100 rounded-xl px-4 py-3 ${!editable && "opacity-60"}`}
        value={name}
        onChangeText={setName}
        editable={editable}
        placeholder="Enter your name"
      />

      {/* Email */}
      <Text className="mt-4 mb-2 text-gray-500">Email Address</Text>
      <TextInput
        className="bg-gray-100 rounded-xl px-4 py-3 opacity-60"
        value={email}
        editable={false}
      />

      {/* Current Password (only visible in edit mode) */}
      {editable && (
        <>
          <Text className="mt-4 mb-2 text-gray-500">Current Password</Text>
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 mb-2">
            <TextInput
              className="flex-1 py-3"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              placeholder="Enter current password"
            />
            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
              <Ionicons
                name={showCurrentPassword ? "eye-off" : "eye"}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* New Password (only visible in edit mode) */}
      {editable && (
        <>
          <Text className="mt-2 mb-2 text-gray-500">New Password</Text>
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 mb-2">
            <TextInput
              className="flex-1 py-3"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              placeholder="Enter new password"
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <Ionicons
                name={showNewPassword ? "eye-off" : "eye"}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Confirm Password (only visible in edit mode) */}
      {editable && (
        <>
          <Text className="mt-2 mb-2 text-gray-500">Confirm New Password</Text>
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 mb-2">
            <TextInput
              className="flex-1 py-3"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirm new password"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Edit / Save / Cancel Buttons */}
      {editable ? (
        <View className="mt-6">
          <TouchableOpacity
            className="bg-green-500 rounded-xl py-4 mb-3"
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center text-lg font-bold">Save Changes</Text>
            )}
          </TouchableOpacity>

          {(currentPassword || newPassword || confirmPassword) && (
            <TouchableOpacity
              className="bg-blue-500 rounded-xl py-4 mb-3"
              onPress={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center text-lg font-bold">Change Password</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="bg-gray-400 rounded-xl py-4"
            onPress={cancelEdit}
            disabled={isLoading || isChangingPassword}
          >
            <Text className="text-white text-center text-lg font-bold">Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          className="bg-blue-500 rounded-xl py-4 mt-6"
          onPress={() => setEditable(true)}
        >
          <Text className="text-white text-center text-lg font-bold">Edit Profile</Text>
        </TouchableOpacity>
      )}

      {/* Logout Button */}
      <TouchableOpacity
        className="bg-red-500 rounded-xl py-4 mt-4"
        onPress={handleLogout}
      >
        <Text className="text-white text-center text-lg font-bold">Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}