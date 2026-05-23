import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();

  useEffect(() => {
    if (userRole !== 'ADMIN') {
      setLoading(false);
      return;
    }

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole]);

  const cambiarRol = async (uid, nuevoRol) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { rol: nuevoRol });
      return { success: true };
    } catch (error) {
      console.error("Error al cambiar rol:", error);
      return { success: false, error };
    }
  };

  return { usuarios, loading, cambiarRol };
};
