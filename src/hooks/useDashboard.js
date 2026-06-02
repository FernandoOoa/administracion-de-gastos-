import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, runTransaction } from 'firebase/firestore';

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

  const eliminarTransaccion = async (id) => {
    try {
      await runTransaction(db, async (transaction) => {
        const transRef = doc(db, 'transacciones', id);
        const transDoc = await transaction.get(transRef);
        
        if (!transDoc.exists()) {
          throw new Error("La transacción no existe.");
        }

        const data = transDoc.data();
        const { tipo, monto, apartado_id, apartado_destino_id } = data;

        // Revertir balances en los apartados
        if (tipo === 'Entrada') {
          const apRef = doc(db, 'apartados', apartado_id);
          const apDoc = await transaction.get(apRef);
          if (apDoc.exists()) {
            const nuevoSaldo = (apDoc.data().saldo_actual || 0) - monto;
            transaction.update(apRef, { saldo_actual: nuevoSaldo });
          }
        } else if (tipo === 'Salida') {
          const apRef = doc(db, 'apartados', apartado_id);
          const apDoc = await transaction.get(apRef);
          if (apDoc.exists()) {
            const nuevoSaldo = (apDoc.data().saldo_actual || 0) + monto;
            transaction.update(apRef, { saldo_actual: nuevoSaldo });
          }
        } else if (tipo === 'Transferencia') {
          const apRef = doc(db, 'apartados', apartado_id);
          const apDestRef = doc(db, 'apartados', apartado_destino_id);
          
          const apDoc = await transaction.get(apRef);
          const apDestDoc = await transaction.get(apDestRef);

          if (apDoc.exists()) {
            const nuevoSaldo = (apDoc.data().saldo_actual || 0) + monto;
            transaction.update(apRef, { saldo_actual: nuevoSaldo });
          }
          if (apDestDoc.exists()) {
            const nuevoSaldoDest = (apDestDoc.data().saldo_actual || 0) - monto;
            transaction.update(apDestRef, { saldo_actual: nuevoSaldoDest });
          }
        }

        // Eliminar el documento de la transacción
        transaction.delete(transRef);
      });
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar transacción: ", error);
      return { success: false, error };
    }
  };

  return { transacciones, loadingTransacciones, eliminarTransaccion };
};
