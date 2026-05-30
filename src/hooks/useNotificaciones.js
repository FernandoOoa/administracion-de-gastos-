import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export const useNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole } = useAuth();
  
  const notificadosRef = useRef(new Set());
  const esCargaInicial = useRef(true);

  useEffect(() => {
    if (!currentUser) return;

    // Solicitar permiso de forma automatica al montar (si el navegador lo permite)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => console.log("Error al pedir permiso de notificacion:", err));
    }

    const notifRef = collection(db, 'notificaciones');
    const roleTarget = `ROLE_${userRole}`;
    
    const q = query(
      notifRef,
      where('id_usuario_destino', 'in', [currentUser.uid, roleTarget])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0));
      
      // Manejar notificaciones nativas del navegador en tiempo real
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        data.forEach(n => {
          if (!n.leida) {
            if (esCargaInicial.current) {
              // Registramos los existentes para evitar alertas de historiales viejos
              notificadosRef.current.add(n.id);
            } else if (!notificadosRef.current.has(n.id)) {
              // Notificar al navegador
              new Notification("AdminGastos", {
                body: n.mensaje,
                icon: '/pwa-192x192.png',
                vibrate: [200, 100, 200]
              });
              notificadosRef.current.add(n.id);
            }
          }
        });
      }

      esCargaInicial.current = false;
      setNotificaciones(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, userRole]);

  const marcarComoLeida = async (id) => {
    try {
      const docRef = doc(db, 'notificaciones', id);
      await updateDoc(docRef, { leida: true });
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  const enviarNotificacion = async (destino, mensaje, tipo = 'INFO') => {
    try {
      await addDoc(collection(db, 'notificaciones'), {
        id_usuario_destino: destino,
        mensaje,
        tipo,
        leida: false,
        fecha: new Date()
      });
    } catch (error) {
      console.error("Error al enviar notificación:", error);
    }
  };

  const limpiarLeidas = async () => {
    try {
      const batch = writeBatch(db);
      const leidas = notificaciones.filter(n => n.leida);
      if (leidas.length === 0) return;

      leidas.forEach(n => {
        const docRef = doc(db, 'notificaciones', n.id);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error) {
      console.error("Error al limpiar notificaciones leídas:", error);
    }
  };

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  return { notificaciones, loading, unreadCount, marcarComoLeida, enviarNotificacion, limpiarLeidas };
};
