import { Stack} from "expo-router";
import './globals.css';

export default function RootLayout() {
  return <Stack >
    
  <Stack.Screen 
    name="index"
     options={{
      headerShown: false,
      animation: "none",
     }}

     
     />

      <Stack.Screen 
    name="auth"
     options={{
      headerShown: false,
      animation: "none",
     }}
     
     
     />

     
    <Stack.Screen 
    
     name="(tabs)"
     options={{
      headerShown: false,
      animation: "none",
     }}
    
    />
    <Stack.Screen 
    
     name="courses/[id]"
     options={{
      headerShown: false,
      animation: "none"
     }}
    
    />
    <Stack.Screen 
    
     name="courses/index"
     options={{
      headerShown: false,
      animation: "none"
     }}
    
    />
    <Stack.Screen 
    
     name="articles"
     options={{
      headerShown: false,
      animation: "none"
     }}
    
    />
    <Stack.Screen 
    
     name="articles/[id]"
     options={{
      headerShown: false,
      animation: "none"
     }}
    
    />
    <Stack.Screen 
    
     name="articles/index"
     options={{
      headerShown: false,
      animation: "none"
     }}
    
    />
    <Stack.Screen 
    
     name="courses/[id]/chapters/[id]"
     options={{
      headerShown: false,
      animation: "none"
     }}
    
    />
    <Stack.Screen 
    
     name="courses/[id]/quiz/[id]"
     options={{
      headerShown: false,
      animation: "none"
     }}
    
    />

    <Stack.Screen 
    
     name="courses/[id]/quiz/Result"
     options={{
      headerShown: false,
      animation: "none"
     }}
    
    />
    <Stack.Screen 
    
     name="notification"
     options={{
      headerShown: false,
      animation: "none"
     }}
    
    />

    <Stack.Screen 
    
     name="courses/continuelearning"
     options={{
      headerShown: false,
      animation: "none"
     }}
    
    />
    <Stack.Screen 
    name="tutor"
     options={{
      headerShown: false,
      animation: "none",
     }}
     
     
     />
     <Stack.Screen 
    name="tutor/index"
     options={{
      headerShown: false,
      animation: "none",
     }}
     
     
     />

    </Stack>;
}
