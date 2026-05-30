import { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export const useRegistro = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, userRole } = useAuth();

  const registrarTransaccion = async ({
    tipo,
    monto,
    concepto,
    apartadoId,
    apartadoDestinoId,
    fecha
  }) => {
    setLoading(true);
    setError(null);
    try {
      const parsedMonto = Number(monto);
      if (isNaN(parsedMonto) || parsedMonto <= 0) {
        throw new Error("El monto debe ser un número válido mayor a 0.");
      }

      let fechaTransaccion = new Date();
      if (fecha) {
        const [year, month, day] = fecha.split('-').map(Number);
        const ahora = new Date();
        fechaTransaccion = new Date(year, month - 1, day, ahora.getHours(), ahora.getMinutes(), ahora.getSeconds());
      }

      const transaccionData = {
        tipo,
        monto: parsedMonto,
        concepto,
        apartado_id: apartadoId,
        fecha: fechaTransaccion,
        id_usuario_registro: currentUser.uid,
      };
      
      if (tipo === 'Transferencia' && apartadoDestinoId) {
        transaccionData.apartado_destino_id = apartadoDestinoId;
      }

      if (userRole === 'TESORERA') {
        transaccionData.estado_custodia = 'EN_TESORERIA';
      } else {
        transaccionData.estado_custodia = 'POR_ENTREGAR';
        transaccionData.custodio_actual = currentUser.uid;
      }

      await runTransaction(db, async (transaction) => {
        const apartadoRef = doc(db, 'apartados', apartadoId);
        const apartadoDoc = await transaction.get(apartadoRef);
        
        if (!apartadoDoc.exists()) {
          throw new Error("El apartado seleccionado no existe.");
        }

        let apartadoDestinoDoc = null;
        let apartadoDestinoRef = null;
        if (tipo === 'Transferencia') {
          if (!apartadoDestinoId) throw new Error("Debe seleccionar un apartado destino.");
          apartadoDestinoRef = doc(db, 'apartados', apartadoDestinoId);
          apartadoDestinoDoc = await transaction.get(apartadoDestinoRef);
          if (!apartadoDestinoDoc.exists()) {
            throw new Error("El apartado destino no existe.");
          }
        }

        const nuevoSaldo = apartadoDoc.data().saldo_actual || 0;

        if (tipo === 'Entrada') {
          transaction.update(apartadoRef, { saldo_actual: nuevoSaldo + parsedMonto });
        } else if (tipo === 'Salida') {
          transaction.update(apartadoRef, { saldo_actual: nuevoSaldo - parsedMonto });
        } else if (tipo === 'Transferencia') {
          const saldoDestino = apartadoDestinoDoc.data().saldo_actual || 0;
          transaction.update(apartadoRef, { saldo_actual: nuevoSaldo - parsedMonto });
          transaction.update(apartadoDestinoRef, { saldo_actual: saldoDestino + parsedMonto });
        }

        const newTransaccionRef = doc(collection(db, 'transacciones'));
        transaction.set(newTransaccionRef, transaccionData);

        // Notificaciones automáticas si el usuario es BASE
        if (userRole === 'BASE') {
          const notifTesoRef = doc(collection(db, 'notificaciones'));
          transaction.set(notifTesoRef, {
            id_usuario_destino: 'ROLE_TESORERA',
            mensaje: `El usuario ${currentUser.displayName || 'Gestor'} ha registrado una ${tipo} por $${parsedMonto}.`,
            tipo: 'INFO',
            leida: false,
            fecha: new Date()
          });

          const notifAdminRef = doc(collection(db, 'notificaciones'));
          transaction.set(notifAdminRef, {
            id_usuario_destino: 'ROLE_ADMIN',
            mensaje: `El usuario ${currentUser.displayName || 'Gestor'} ha registrado una ${tipo} por $${parsedMonto}.`,
            tipo: 'INFO',
            leida: false,
            fecha: new Date()
          });
        }
      });

      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error("Error al registrar transacción:", err);
      setError(err.message || "Hubo un error al registrar la operación.");
      setLoading(false);
      return { success: false, error: err };
    }
  };

  return { registrarTransaccion, loading, error };
};
