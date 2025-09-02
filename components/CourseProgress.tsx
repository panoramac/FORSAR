import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Progress from 'react-native-progress';

interface CourseProgressCardProps {
  title: string;
  category?: string;
  lessons: number;
  completedLessons: number;
  image: any;
  duration?: number;
  onSave?: (course: any) => void;
  isSaved?: boolean;
  course?: any;
}

export default function CourseProgressCard({
  title,
  category,
  lessons,
  completedLessons,
  image,
  duration,
  onSave,
  isSaved = false,
  course,
}: CourseProgressCardProps) {
  const progress = lessons > 0 ? completedLessons / lessons : 0;

  return (
    <View className="w-56 rounded-xl overflow-hidden border border-gray-300 bg-white">
      {/* Image + bouton sauvegarde */}
      <View className="relative">
        <Image
          source={image}
          className="w-full h-32 bg-gray-200"
          resizeMode="cover"
        />
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
        {/* Catégorie */}
        {category && (
          <Text className="text-xs text-gray-500 font-semibold">
            {category}
          </Text>
        )}

        {/* Titre */}
        <Text className="font-bold text-sm mt-1" numberOfLines={2}>
          {title}
        </Text>

        {/* Progression */}
        <View className="mt-3">
          <Progress.Bar
            progress={progress}
            width={null}
            height={6}
            borderRadius={5}
            color="#3B82F6"
            unfilledColor="#E5E7EB"
            borderWidth={0}
          />
          <View className="flex-row justify-between mt-1">
            <Text className="text-xs text-gray-500">
              {completedLessons}/{lessons} Lessons
            </Text>
            <Text className="text-xs text-gray-500">
              {Math.round(progress * 100)}%
            </Text>
          </View>
        </View>

        {/* Durée */}
        {duration && (
          <Text className="text-xs text-gray-500 mt-2">
            {duration}h
          </Text>
        )}
      </View>
    </View>
  );
}