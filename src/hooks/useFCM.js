import { useEffect } from 'react';
import { messaging, db } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export const useFCM = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser || !messaging) return;

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Obtener token VAPID
          const token = await getToken(messaging, {
            vapidKey: 'BJQKtmdt9WmGU18u5kTiol2HUbNWRIZRcm7uoErGXTYPWl24dRDDjqUufCRDc9gInF9fsj7vTXhnd5cOk7l9s-s'
          });
          
          if (token) {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
              fcmToken: token
            });
            console.log("Token FCM guardado exitosamente.");
          }
        } else {
          console.log("Permiso de notificación denegado");
        }
      } catch (error) {
        console.error("Error al pedir permisos o token FCM", error);
      }
    };

    requestPermission();

    const unsubscribe = onMessage(messaging, (payload) => {
      // Opcional: mostrar un Toast nativo si la app está abierta, 
      // aunque ya tenemos la campana de notificaciones.
      console.log('Mensaje recibido en primer plano: ', payload);
    });

    return () => unsubscribe();
  }, [currentUser]);
};
