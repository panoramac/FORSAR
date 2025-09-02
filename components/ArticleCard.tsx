import { View, Text, Image } from 'react-native'
import React from 'react' 
import { Ionicons, MaterialIcons } from '@expo/vector-icons' 

const ArticleCard = ({category ,title,timeAgo,background}: any) => {
  return (
    <View className="flex-row  rounded-lg overflow-hidden border border-gray-200 w-full">
      {/* Image */}
      <View className="w-40 h-36 bg-gray-300">
        <Image
          source={background}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Contenu */}
      <View className="flex-1 p-3 justify-center">
        <Text className="text-xs text-gray-500 py-3">{category}</Text>
        <Text className="text-sm text-gray-800 font-semibold" numberOfLines={2}>
          {title}
        </Text>

        {/* Footer */}
        <View className="flex-row items-center mt-2">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text className="ml-1 text-xs text-gray-500">{timeAgo}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default ArticleCard