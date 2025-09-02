import { View, Text, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OnboardingSlideProps = {
  image: any;
  text: string;
  buttonLabel: string;
  onNext: () => void;
  onSkip?: () => void;
  totalSteps: number;
  currentStep: number;
  onSelectStep: (step: number) => void;
};

export default function OnboardingSlide({
  image,
  text,
  buttonLabel,
  onNext,
  onSkip,
  totalSteps,
  currentStep,
  onSelectStep,
}: OnboardingSlideProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Skip */}
      {onSkip && (
        <TouchableOpacity
          className="absolute top-12 right-6 z-10"
          onPress={onSkip}
        >
          <Text className="text-white text-base">Skip</Text>
        </TouchableOpacity>
      )}

      {/* Image */}
      <Image
        source={image}
        className="w-full h-1/2"
        resizeMode="cover"
      />

      {/* Contenu sous l'image avec bg-primary */}
      <View className="flex-1 bg-primary">
        {/* Texte */}
        <View className="flex-1 justify-center px-6">
          <Text className="text-white text-lg text-center">{text}</Text>
        </View>

        {/* Pagination cliquable */}
        <View className="flex-row justify-center mb-6">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onSelectStep(index)}
            >
              <View
                className={`h-2 rounded-full mx-1 ${
                  index === currentStep ? "bg-white w-6" : "bg-gray-400 w-2"
                }`}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton Next */}
        <TouchableOpacity
          onPress={onNext}
          className="bg-blue-500 mx-6 mb-20 rounded-full py-3"
        >
          <Text className="text-white text-center text-lg">{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
