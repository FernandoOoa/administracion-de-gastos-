import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, runTransaction, query, where, getDocs, writeBatch } from 'firebase/firestore';

export const useApartados = () => {
  const [apartados, setApartados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apartadosRef = collection(db, 'apartados');
    
    const unsubscribe = onSnapshot(apartadosRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApartados(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching apartados: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addApartado = async (nombre, meta_financiera) => {
    try {
      await addDoc(collection(db, 'apartados'), {
        nombre,
        meta_financiera: Number(meta_financiera) || 0,
        saldo_actual: 0,
        createdAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error("Error al crear apartado: ", error);
      return { success: false, error };
    }
  };

  const updateApartado = async (id, data) => {
    try {
      const apartadoRef = doc(db, 'apartados', id);
      await updateDoc(apartadoRef, data);
      return { success: true };
    } catch (error) {
      console.error("Error al actualizar apartado: ", error);
      return { success: false, error };
    }
  };

  const deleteApartado = async (id) => {
    try {
      const batch = writeBatch(db);
      
      // 1. Eliminar el apartado
      const apartadoRef = doc(db, 'apartados', id);
      batch.delete(apartadoRef);

      // 2. Buscar y eliminar transacciones relacionadas
      const transaccionesRef = collection(db, 'transacciones');
      
      // Transacciones de origen
      const qOrigen = query(transaccionesRef, where('apartado_id', '==', id));
      const snapshotOrigen = await getDocs(qOrigen);
      snapshotOrigen.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Transacciones de destino (para transferencias)
      const qDestino = query(transaccionesRef, where('apartado_destino_id', '==', id));
      const snapshotDestino = await getDocs(qDestino);
      snapshotDestino.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // 3. Ejecutar el lote
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error("Error al borrar apartado en cascada: ", error);
      return { success: false, error };
    }
  };

  const combinarApartados = async (origenId, destinoId) => {
    try {
      await runTransaction(db, async (transaction) => {
        const origenRef = doc(db, 'apartados', origenId);
        const destinoRef = doc(db, 'apartados', destinoId);
        
        const origenDoc = await transaction.get(origenRef);
        const destinoDoc = await transaction.get(destinoRef);

        if (!origenDoc.exists() || !destinoDoc.exists()) {
          throw new Error("Uno de los apartados no existe.");
        }

        const saldoOrigen = origenDoc.data().saldo_actual || 0;
        const saldoDestino = destinoDoc.data().saldo_actual || 0;

        transaction.update(destinoRef, { saldo_actual: saldoDestino + saldoOrigen });
        transaction.delete(origenRef);
      });
      return { success: true };
    } catch (error) {
      console.error("Error al combinar apartados: ", error);
      return { success: false, error };
    }
  };

  return { apartados, loading, addApartado, updateApartado, deleteApartado, combinarApartados };
};
