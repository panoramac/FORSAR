import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

export default function CourseCard({
  title,
  lessons,
  duration,
  image,
  onSave,
  isSaved = false,
  course,
}: any) {
  return (
    <View className="w-48 rounded-xl overflow-hidden border border-gray-300 bg-white">
      {/* Image + bouton sauvegarde */}
      <View className="relative">
        <Image source={image} className="w-full h-30 bg-secondary" resizeMode="cover" />
        <TouchableOpacity
          onPress={() => onSave && onSave(course)}
          className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isSaved ? "#3B82F6" : "#6B7280"}
          />
        </TouchableOpacity>
      </View>

      {/* Infos */}
      <View className="p-3">
        <Text className="font-bold text-base" numberOfLines={2}>
          {title}
        </Text>
        <View className="flex-row justify-between mt-2">
          <Text className="text-xs text-gray-600">{lessons} Lessons</Text>
          <Text className="text-xs text-gray-600">{duration}h</Text>
        </View>
      </View>
    </View>
  );
}