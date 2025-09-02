import { View, TextInput, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  placeholder: string;
  onSearch?: (searchText: string) => void;
  onPress?: () => void;
  editable?: boolean;
}

const SearchBar = ({
  placeholder,
  onSearch,
  onPress,
  editable = true,
}: SearchBarProps) => {
  const [searchText, setSearchText] = useState("");

  const handleTextChange = (text: string) => {
    setSearchText(text);
    onSearch?.(text);
  };

  const clearSearch = () => {
    setSearchText("");
    onSearch?.("");
  };

  return (
    <View className="flex-row items-center bg-gray-100 rounded-full px-5 py-3">
      <Ionicons name="search" size={20} color="#6b7280" />
      <TextInput
        onPressIn={onPress}
        placeholder={placeholder}
        value={searchText}
        onChangeText={handleTextChange}
        placeholderTextColor="#9ca3af"
        className="flex-1 ml-2 text-gray-900 text-base"
        returnKeyType="search"
        editable={editable}
      />
      {searchText.length > 0 && (
        <TouchableOpacity onPress={clearSearch} className="ml-2">
          <Ionicons name="close-circle" size={20} color="#9ca3af" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;