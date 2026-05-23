import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export const useNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const notifRef = collection(db, 'notificaciones');
    const roleTarget = `ROLE_${userRole}`;
    
    const q = query(
      notifRef,
      where('id_usuario_destino', 'in', [currentUser.uid, roleTarget])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0));
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

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  return { notificaciones, loading, unreadCount, marcarComoLeida, enviarNotificacion };
};
