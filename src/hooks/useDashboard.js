import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export const useDashboard = () => {
  const [transacciones, setTransacciones] = useState([]);
  const [loadingTransacciones, setLoadingTransacciones] = useState(true);

  useEffect(() => {
    const transaccionesRef = collection(db, 'transacciones');
    const q = query(transaccionesRef, orderBy('fecha', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransacciones(data);
      setLoadingTransacciones(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setLoadingTransacciones(false);
    });

    return () => unsubscribe();
  }, []);

  return { transacciones, loadingTransacciones };
};
