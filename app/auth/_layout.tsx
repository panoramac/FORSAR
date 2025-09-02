import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack >
      <Stack.Screen 
      name="login"
      options={{
      headerShown: false,
      animation: "none",
     }}
     />
      <Stack.Screen 
      name="register"
      options={{
      headerShown: false,
      animation: "none",
     }} />
    </Stack>
  );
}
