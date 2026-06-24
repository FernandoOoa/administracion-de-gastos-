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

  const editarTransaccion = async (id, nuevosDatos) => {
    try {
      await runTransaction(db, async (transaction) => {
        const transRef = doc(db, 'transacciones', id);
        const transDoc = await transaction.get(transRef);
        
        if (!transDoc.exists()) {
          throw new Error("La transacción no existe.");
        }

        const oldData = transDoc.data();
        const { tipo: oldTipo, monto: oldMonto, apartado_id: oldApartadoId, apartado_destino_id: oldApartadoDestinoId } = oldData;
        const { concepto: newConcepto, monto: newMonto, fecha: newFecha, apartado_id: newApartadoId, apartado_destino_id: newApartadoDestinoId } = nuevosDatos;

        // 1. Identificar todos los IDs de apartados únicos que necesitamos leer
        const uniqueApartadoIds = new Set();
        if (oldApartadoId) uniqueApartadoIds.add(oldApartadoId);
        if (oldApartadoDestinoId) uniqueApartadoIds.add(oldApartadoDestinoId);
        if (newApartadoId) uniqueApartadoIds.add(newApartadoId);
        if (newApartadoDestinoId) uniqueApartadoIds.add(newApartadoDestinoId);

        // 2. Ejecutar todas las lecturas de apartados primero (Lecturas/Reads)
        const apartadosDocs = {};
        for (const apId of uniqueApartadoIds) {
          const apRef = doc(db, 'apartados', apId);
          const apDoc = await transaction.get(apRef);
          apartadosDocs[apId] = apDoc;
        }

        // 3. Inicializar balances en memoria
        const balances = {};
        for (const apId in apartadosDocs) {
          const docSnap = apartadosDocs[apId];
          balances[apId] = docSnap.exists() ? (Number(docSnap.data().saldo_actual) || 0) : 0;
        }

        // 4. Revertir el balance de la transacción anterior en memoria
        if (oldTipo === 'Entrada') {
          if (balances[oldApartadoId] !== undefined) {
            balances[oldApartadoId] -= oldMonto;
          }
        } else if (oldTipo === 'Salida') {
          if (balances[oldApartadoId] !== undefined) {
            balances[oldApartadoId] += oldMonto;
          }
        } else if (oldTipo === 'Transferencia') {
          if (balances[oldApartadoId] !== undefined) {
            balances[oldApartadoId] += oldMonto;
          }
          if (balances[oldApartadoDestinoId] !== undefined) {
            balances[oldApartadoDestinoId] -= oldMonto;
          }
        }

        // 5. Aplicar el nuevo balance de la transacción en memoria
        if (oldTipo === 'Entrada') {
          if (balances[newApartadoId] !== undefined) {
            balances[newApartadoId] += newMonto;
          }
        } else if (oldTipo === 'Salida') {
          if (balances[newApartadoId] !== undefined) {
            balances[newApartadoId] -= newMonto;
          }
        } else if (oldTipo === 'Transferencia') {
          if (balances[newApartadoId] !== undefined) {
            balances[newApartadoId] -= newMonto;
          }
          if (balances[newApartadoDestinoId] !== undefined) {
            balances[newApartadoDestinoId] += newMonto;
          }
        }

        // 6. Aplicar todos los cambios acumulados (Escrituras/Writes) en los apartados
        for (const apId in balances) {
          const apDoc = apartadosDocs[apId];
          if (apDoc && apDoc.exists()) {
            transaction.update(doc(db, 'apartados', apId), { saldo_actual: balances[apId] });
          }
        }

        // 7. Actualizar el documento de la transacción (Escritura/Write)
        const updateData = {
          concepto: newConcepto,
          monto: newMonto,
          fecha: newFecha,
          apartado_id: newApartadoId,
        };
        if (oldTipo === 'Transferencia') {
          updateData.apartado_destino_id = newApartadoDestinoId;
        }

        transaction.update(transRef, updateData);
      });
      return { success: true };
    } catch (error) {
      console.error("Error al editar transacción:", error);
      return { success: false, error };
    }
  };

  return { transacciones, loadingTransacciones, eliminarTransaccion, editarTransaccion };
};
