// styles/globalStyles.js
import { StyleSheet } from 'react-native';

const GlobalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f0ef',
  },
  // Typography
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },

  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#444',
  },

  logo: {
    width: 120,
    height: 120,
  },
});

export default GlobalStyles;
