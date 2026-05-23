const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.enviarNotificacionPush = onDocumentCreated("notificaciones/{notifId}", async (event) => {
  const data = event.data.data();
  if (!data) return;

  const { id_usuario_destino, mensaje } = data;

  try {
    let tokens = [];

    // Si el destino es un rol (ej. "ROLE_ADMIN", "ROLE_TESORERA")
    if (id_usuario_destino.startsWith("ROLE_")) {
      const rol = id_usuario_destino.replace("ROLE_", "");
      const usersSnapshot = await admin.firestore().collection("users").where("rol", "==", rol).get();
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.fcmToken) {
          tokens.push(userData.fcmToken);
        }
      });
    } 
    // Si el destino es un UID específico
    else {
      const userDoc = await admin.firestore().collection("users").doc(id_usuario_destino).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.fcmToken) {
          tokens.push(userData.fcmToken);
        }
      }
    }

    if (tokens.length === 0) {
      console.log("No hay tokens válidos para enviar notificaciones.");
      return;
    }

    const payload = {
      notification: {
        title: "Nueva actualización",
        body: mensaje,
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log("Notificaciones enviadas:", response.successCount);
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error("Error enviando al token", tokens[idx], resp.error);
        }
      });
    }

  } catch (error) {
    console.error("Error enviando notificación push:", error);
  }
});
