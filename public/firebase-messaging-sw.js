importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAC_q7Gdf1AVxe_NSDOxmnyP7kfm299iOQ",
  authDomain: "administracion-monaguillos.firebaseapp.com",
  projectId: "administracion-monaguillos",
  storageBucket: "administracion-monaguillos.firebasestorage.app",
  messagingSenderId: "448377070764",
  appId: "1:448377070764:web:68437f111fd8e833fc6b09"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje en segundo plano recibido ', payload);
  const notificationTitle = payload.notification?.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes un nuevo mensaje en AdminGastos',
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
