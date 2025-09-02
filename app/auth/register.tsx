import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '@/configs/FirebaseConfig';
import CountryPicker, { Country }  from 'react-native-country-picker-modal';

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("FR");
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const OnCreateAccount = () => {
    if (!email || !password || !name || !phone || !country) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;

        // Sauvegarde des infos utilisateur dans Firestore
        await setDoc(doc(db, "users", user.uid), {
          name,
          phone,
          country,
          role,
          email
        });

        Alert.alert("Succès", "Compte créé avec succès !");
        
        // Redirection selon le rôle après inscription
        if (role === "student") {
          router.replace("/(tabs)");
        } else {
          router.replace("/tutor");
        }
      })
      .catch((error) => {
        console.log(error.code, error.message);
        Alert.alert("Erreur", error.message);
      });
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      {/* Retour */}
      <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-6">
        <Ionicons name="arrow-back" size={20} color="black" />
      </TouchableOpacity>

      {/* Titre */}
      <Text className="text-2xl font-bold text-center mt-4">Register Account</Text>

      {/* Choix rôle */}
      <View className="flex-row mt-6">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-l-lg items-center ${role === "tutor" ? "bg-blue-500" : "bg-gray-100"}`}
          onPress={() => setRole("tutor")}
        >
          <Text className={role === "tutor" ? "text-white" : "text-black"}>Tutor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 rounded-r-lg items-center ${role === "student" ? "bg-blue-500" : "bg-gray-100"}`}
          onPress={() => setRole("student")}
        >
          <Text className={role === "student" ? "text-white" : "text-black"}>Student</Text>
        </TouchableOpacity>
      </View>

      {/* Name */}
      <Text className="mt-6 text-gray-700">Your Name</Text>
      <TextInput
        placeholder="xxxxxxxx"
        className="bg-gray-100 px-4 py-3 rounded-lg mt-1"
        onChangeText={setName}
      />

      {/* Phone */}
      <Text className="mt-4 text-gray-700">Number Phone</Text>
      <TextInput
        placeholder="+212 xxxxxxxxx"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9]/g, ""); // uniquement chiffres
          if (cleaned.length <= 10) setPhone(cleaned);
        }}
        className="bg-gray-100 px-4 py-3 rounded-lg mt-1"
      />

      {/* Country */}
      <Text className="mt-4 text-gray-700">Country</Text>
      <TouchableOpacity
        onPress={() => setShowCountryPicker(true)}
        className="bg-gray-100 px-4 py-3 rounded-lg mt-1"
      >
        <Text>{country || "Select your country"}</Text>
      </TouchableOpacity>
      <CountryPicker
        withFilter
        withFlag
        withCountryNameButton
        countryCode={countryCode}
        visible={showCountryPicker}
        onSelect={(country: any) => {
          setCountry(country.name);
          setCountryCode(country.cca2);
          setShowCountryPicker(false);
        }}
        onClose={() => setShowCountryPicker(false)}
      />

      {/* Email */}
      <Text className="mt-4 text-gray-700">Email Address</Text>
      <TextInput
        placeholder="xyz@gmail.com"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        className="bg-gray-100 px-4 py-3 rounded-lg mt-1"
      />

      {/* Password */}
      <Text className="mt-4 text-gray-700">Password</Text>
      <View className="flex-row items-center bg-gray-100 px-4 py-3 rounded-lg mt-1">
        <TextInput
          placeholder="********"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          className="flex-1"
        />
        <Pressable onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="gray" />
        </Pressable>
      </View>

      {/* Bouton inscription */}
      <TouchableOpacity className="bg-blue-500 py-4 rounded-lg mt-6" onPress={OnCreateAccount}>
        <Text className="text-white text-center font-semibold">Sign Up</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}