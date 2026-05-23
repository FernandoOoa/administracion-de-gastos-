import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export const useCustodia = () => {
  const [porEntregar, setPorEntregar] = useState([]);
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const transaccionesRef = collection(db, 'transacciones');
    
    // Consulta 1: Mis Custodias por entregar
    const qMisCustodias = query(
      transaccionesRef, 
      where('estado_custodia', '==', 'POR_ENTREGAR'),
      where('custodio_actual', '==', currentUser.uid)
    );

    const unsubMisCustodias = onSnapshot(qMisCustodias, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenamiento en cliente para evitar necesidad de índices compuestos
      data.sort((a, b) => b.fecha?.seconds - a.fecha?.seconds);
      setPorEntregar(data);
    });

    let unsubEsperando = () => {};

    // Consulta 2: Validación de tesorería (Solo para TESORERA o ADMIN)
    if (userRole === 'TESORERA' || userRole === 'ADMIN') {
      const qEsperando = query(
        transaccionesRef,
        where('estado_custodia', '==', 'ESPERANDO_CONFIRMACION')
      );
      
      unsubEsperando = onSnapshot(qEsperando, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => b.fecha?.seconds - a.fecha?.seconds);
        setEsperandoConfirmacion(data);
      });
    }

    setLoading(false);

    return () => {
      unsubMisCustodias();
      unsubEsperando();
    };
  }, [currentUser, userRole]);

  const entregarATesoreria = async (id) => {
    try {
      const docRef = doc(db, 'transacciones', id);
      await updateDoc(docRef, { estado_custodia: 'ESPERANDO_CONFIRMACION' });
      return true;
    } catch (error) {
      console.error("Error al entregar: ", error);
      return false;
    }
  };

  const confirmarRecepcion = async (id) => {
    try {
      const docRef = doc(db, 'transacciones', id);
      // Conservamos custodio_actual por seguridad y auditoría
      await updateDoc(docRef, { estado_custodia: 'EN_TESORERIA' });
      return true;
    } catch (error) {
      console.error("Error al confirmar: ", error);
      return false;
    }
  };

  return { porEntregar, esperandoConfirmacion, loading, entregarATesoreria, confirmarRecepcion };
};
