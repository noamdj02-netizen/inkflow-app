import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inkflow.app',
  appName: 'InkFlow',
  webDir: 'dist',
  // Configuration pour le développement avec live reload
  // Décommentez les lignes suivantes pour utiliser le serveur de dev Vite
  // server: {
  //   url: 'http://localhost:3000',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#050505',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#fafafa',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#050505',
    },
  },
};

export default config;
