import '../../global.css';
import React from 'react';
import {SafeAreaView, StatusBar, Text, View} from 'react-native';
import {Providers} from './providers';

function HomeScreen(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 items-center justify-center">
        <Text className="text-3xl font-bold text-gray-900">MedTracker</Text>
        <Text className="mt-2 text-base text-gray-500">
          Blood Pressure Monitor
        </Text>
      </View>
    </SafeAreaView>
  );
}

function App(): React.JSX.Element {
  return (
    <Providers>
      <HomeScreen />
    </Providers>
  );
}

export default App;
