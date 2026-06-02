import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNotificaciones } from './useNotificaciones';

export const useCustodia = () => {
  const [porEntregar, setPorEntregar] = useState([]);
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState([]);
  const [misPeticiones, setMisPeticiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole } = useAuth();
  const { enviarNotificacion } = useNotificaciones();

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
      data.sort((a, b) => b.fecha?.seconds - a.fecha?.seconds);
      setPorEntregar(data);
    });

    let unsubEsperando = () => {};
    let unsubMisPeticiones = () => {};

    // Consulta 2: Validación de tesorería
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
    } else {
      // Consulta 3: Mis peticiones en espera (Para BASE y GESTOR)
      const qMisPeticiones = query(
        transaccionesRef,
        where('estado_custodia', '==', 'ESPERANDO_CONFIRMACION'),
        where('id_usuario_registro', '==', currentUser.uid)
      );

      unsubMisPeticiones = onSnapshot(qMisPeticiones, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => b.fecha?.seconds - a.fecha?.seconds);
        setMisPeticiones(data);
      });
    }

    setLoading(false);

    return () => {
      unsubMisCustodias();
      unsubEsperando();
      unsubMisPeticiones();
    };
  }, [currentUser, userRole]);

  const entregarATesoreria = async (id) => {
    try {
      const docRef = doc(db, 'transacciones', id);
      const transDoc = await getDoc(docRef);
      const data = transDoc.data();

      await updateDoc(docRef, { estado_custodia: 'ESPERANDO_CONFIRMACION' });

      await enviarNotificacion(
        'ROLE_TESORERA',
        `El usuario ${currentUser.displayName || 'Gestor'} quiere entregarte $${data.monto || 0}.`,
        'ACCION'
      );

      return true;
    } catch (error) {
      console.error("Error al entregar: ", error);
      return false;
    }
  };

  const confirmarRecepcion = async (id) => {
    try {
      const docRef = doc(db, 'transacciones', id);
      const transDoc = await getDoc(docRef);
      const data = transDoc.data();

      await updateDoc(docRef, { 
        estado_custodia: 'EN_TESORERIA',
        fecha_recepcion_tesoreria: new Date()
      });

      if (data.id_usuario_registro) {
        await enviarNotificacion(
          data.id_usuario_registro,
          `La Tesorería ha confirmado de recibido tu entrega de $${data.monto || 0}.`,
          'INFO'
        );
      }

      return true;
    } catch (error) {
      console.error("Error al confirmar: ", error);
      return false;
    }
  };

  return { porEntregar, esperandoConfirmacion, misPeticiones, loading, entregarATesoreria, confirmarRecepcion };
};
