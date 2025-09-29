// app/(tabs)/explore.tsx
import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';

// Placeholder for missing components
const Collapsible = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.placeholder}><Text>Collapsible Placeholder</Text>{children}</View>
);
const ExternalLink = ({ url, children }: { url: string; children: React.ReactNode }) => (
  <Text style={styles.placeholder}>ExternalLink Placeholder: {children}</Text>
);
const ParallaxScrollView = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.placeholder}>{children}</View>
);
const ThemedText = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.placeholder}>{children}</Text>
);

// Default exported screen
export default function ExploreScreen() {
  return (
    <ParallaxScrollView>
      <View style={styles.container}>
        <ThemedText>Explore Screen Placeholder</ThemedText>
        <Collapsible>
          <Text>Collapsible Content Placeholder</Text>
        </Collapsible>
        <ExternalLink url="https://example.com">Go to Example</ExternalLink>
      </View>
    </ParallaxScrollView>
  );
}

// Basic styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 5,
  },
});
