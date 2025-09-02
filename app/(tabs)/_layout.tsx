import { View, Image } from 'react-native'
import React from 'react'
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from 'expo-router'

const TabIcon = ({ focused, icon }: any) => {
  return (
    <View className="flex items-center justify-center h-full">
      <Image
        source={icon}
        tintColor={focused ? '#0D6EFD' : '#9CA3AF'}
        className="w-6 h-6"
        resizeMode="contain"
      />
    </View>
  )
}

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          height: 60,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          borderTopColor: "#E5E7EB",
          marginBottom: 28,
        },
        tabBarActiveTintColor: "#0D6EFD",
        tabBarInactiveTintColor: "#9CA3AF",
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Saved */}
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Search */}
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;