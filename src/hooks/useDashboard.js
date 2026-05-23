import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export const useDashboard = () => {
  const [ultimasTransacciones, setUltimasTransacciones] = useState([]);
  const [loadingTransacciones, setLoadingTransacciones] = useState(true);

  useEffect(() => {
    const transaccionesRef = collection(db, 'transacciones');
    const q = query(transaccionesRef, orderBy('fecha', 'desc'), limit(5));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUltimasTransacciones(data);
      setLoadingTransacciones(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setLoadingTransacciones(false);
    });

    return () => unsubscribe();
  }, []);

  return { ultimasTransacciones, loadingTransacciones };
};
