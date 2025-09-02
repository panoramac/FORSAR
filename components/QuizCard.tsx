import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

type QuizCardProps = {
  index: number;
  options: string[];
  selectedOption: number | null;
  correctAnswer: number;
  explanation: string;
  onSelect: (index: number) => void;
};

const QuizCard = ({ index, options, selectedOption, correctAnswer, explanation, onSelect }: QuizCardProps) => {
  return (
    <View className="w-full px-4">
      <Text className="text-lg font-semibold mb-4 text-center">
        Question {index + 1}
      </Text>

      {options.map((option, i) => {
        const isSelected = selectedOption === i;
        const isCorrect = correctAnswer === i;

        return (
          <TouchableOpacity
            key={i}
            className={`w-full py-3 px-4 my-2 rounded-lg border
              ${isSelected ? (isCorrect ? "bg-green-500 border-green-500" : "bg-red-500 border-red-500") : "bg-white border-gray-300"}`}
            onPress={() => onSelect(i)}
            disabled={selectedOption !== null}
          >
            <Text className={`${isSelected ? "text-white" : "text-gray-800"}`}>
              {String.fromCharCode(65 + i)}. {option}
            </Text>
          </TouchableOpacity>
        );
      })}

      {selectedOption !== null && (
        <View className="mt-4 p-3 bg-gray-100 rounded-lg">
          <Text className="text-sm text-gray-700 font-medium">
            {selectedOption === correctAnswer
              ? "✅ Bonne réponse !"
              : "❌ Mauvaise réponse"}
          </Text>
          <Text className="mt-2 text-gray-600">{explanation}</Text>
        </View>
      )}
    </View>
  );
};

export default QuizCard;
