import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

export default function TutorLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          height: 70, // Augmenté pour plus d'espace
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          borderTopColor: "#E5E7EB",
          marginBottom: 28,
          marginTop: 0, // Augmenté pour plus d'espace en haut
          paddingTop: 10, // Ajouté pour l'espace interne en haut
        },
        tabBarActiveTintColor: "#0D6EFD",
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: false,
      }}
    >

      {/* Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 70,
              height: 70, // Augmenté pour correspondre à la hauteur de tabBar
              paddingTop: 8, // Ajouté pour déplacer le contenu vers le bas
            }}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size || 26}
                color={color}
              />
              <Text style={{
                fontSize: 11,
                marginTop: 6, // Légèrement augmenté
                color: color,
                fontWeight: focused ? '600' : '400'
              }}>
                Accueil
              </Text>
            </View>
          ),
        }}
      />

      {/* Courses */}
      <Tabs.Screen
        name="courses"
        options={{
          title: "Cours",
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 70,
              height: 70,
              paddingTop: 8,
            }}>
              <Ionicons
                name={focused ? "book" : "book-outline"}
                size={size || 26}
                color={color}
              />
              <Text style={{
                fontSize: 11,
                marginTop: 6,
                color: color,
                fontWeight: focused ? '600' : '400'
              }}>
                Cours
              </Text>
            </View>
          ),
        }}
      />

      {/* Articles */}
      <Tabs.Screen
        name="articles"
        options={{
          title: "Articles",
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 70,
              height: 70,
              paddingTop: 8,
            }}>
              <Ionicons
                name={focused ? "document-text" : "document-text-outline"}
                size={size || 26}
                color={color}
              />
              <Text style={{
                fontSize: 11,
                marginTop: 6,
                color: color,
                fontWeight: focused ? '600' : '400'
              }}>
                Articles
              </Text>
            </View>
          ),
        }}
      />

      {/* Quizzes */}
      <Tabs.Screen
        name="quizzes"
        options={{
          title: "Quiz",
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 70,
              height: 70,
              paddingTop: 8,
            }}>
              <Ionicons
                name={focused ? "help-circle" : "help-circle-outline"}
                size={size || 26}
                color={color}
              />
              <Text style={{
                fontSize: 11,
                marginTop: 6,
                color: color,
                fontWeight: focused ? '600' : '400'
              }}>
                Quiz
              </Text>
            </View>
          ),
        }}
      />

    </Tabs>
  );
}