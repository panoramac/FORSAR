import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/configs/FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

type NotificationType = "course" | "article";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  courseId?: string;
  articleId?: string;
}

const NotificationsScreen = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Charger depuis Firestore
  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const coursesQuery = query(collection(db, "courses"), orderBy("title"));
      const articlesQuery = query(collection(db, "articles"), orderBy("createdAt"));

      const [coursesSnapshot, articlesSnapshot] = await Promise.all([
        getDocs(coursesQuery),
        getDocs(articlesQuery),
      ]);

      let fetched: Notification[] = [];

      coursesSnapshot.forEach((doc) => {
        fetched.push({
          id: doc.id,
          type: "course",
          title: "Nouveau cours ajouté",
          message: `Le cours "${doc.data().title}" est disponible.`,
          time: "Maintenant",
          read: false,
          courseId: doc.id,
        });
      });

      articlesSnapshot.forEach((doc) => {
        fetched.push({
          id: doc.id,
          type: "article",
          title: "Nouvel article publié",
          message: `Article: "${doc.data().titre}" par ${doc.data().auteur}.`,
          time: "Maintenant",
          read: false,
          articleId: doc.id,
        });
      });

      // 🔹 Charger depuis AsyncStorage (état lu/supprimé)
      const savedData = await AsyncStorage.getItem("notifications");
      let savedNotifications: Notification[] = savedData ? JSON.parse(savedData) : [];

      // 🔹 Fusion Firestore + Local (garder état lu/supprimé)
      const merged = fetched.map((notif) => {
        const saved = savedNotifications.find((n) => n.id === notif.id);
        return saved ? { ...notif, read: saved.read } : notif;
      });

      setNotifications(merged);
    } catch (error) {
      console.error("Erreur de récupération:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 🔹 Persister les notifs dans AsyncStorage
  const saveNotifications = async (updated: Notification[]) => {
    setNotifications(updated);
    await AsyncStorage.setItem("notifications", JSON.stringify(updated));
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  const deleteAll = () => {
    saveNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      className={`p-4 border-b border-gray-100 flex-row items-start ${
        !item.read ? "bg-blue-50" : "bg-white"
      }`}
      onPress={() => {
        markAsRead(item.id);
        if (item.type === "course" && item.courseId) {
          router.push(`/courses/${item.courseId}`);
        } else if (item.type === "article" && item.articleId) {
          router.push(`/articles/${item.articleId}`);
        }
      }}
      activeOpacity={0.7}
    >
      <View className="mr-3 mt-1">
        <Ionicons
          name={item.type === "course" ? "book" : "newspaper"}
          size={24}
          color={item.type === "course" ? "#3B82F6" : "#10B981"}
        />
      </View>

      <View className="flex-1">
        <Text
          className={`font-semibold text-base ${
            !item.read ? "text-gray-900" : "text-gray-600"
          }`}
        >
          {item.title}
        </Text>
        <Text className="text-gray-600 text-sm mt-1">{item.message}</Text>
        <Text className="text-gray-400 text-xs mt-2">{item.time}</Text>
      </View>

      {!item.read && <View className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2" />}

      <TouchableOpacity onPress={() => deleteNotification(item.id)} className="p-2 ml-2">
        <Ionicons name="close" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 flex-1 text-center mr-6">
            Notifications
          </Text>

          {unreadCount > 0 && (
            <View className="bg-red-500 rounded-full px-2 py-1">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 🔹 Loading */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-2">Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="notifications-off" size={60} color="#E5E7EB" />
              <Text className="text-gray-500 text-lg mt-4">
                Aucune notification
              </Text>
              <Text className="text-gray-400 text-center mt-2 px-10">
                Vous serez notifié lorsqu’un nouveau cours ou article sera publié
              </Text>
            </View>
          }
          contentContainerStyle={notifications.length === 0 ? { flex: 1 } : {}}
        />
      )}

      {/* Actions rapides */}
      {!loading && notifications.length > 0 && (
        <View className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={markAllAsRead}
            >
              <Ionicons name="checkmark-done" size={20} color="#6B7280" />
              <Text className="text-gray-600 ml-2">Tout lire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center"
              onPress={deleteAll}
            >
              <Ionicons name="trash" size={20} color="#6B7280" />
              <Text className="text-gray-600 ml-2">Tout supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
