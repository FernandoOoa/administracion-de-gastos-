import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userBloqueado, setUserBloqueado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserRole(userDoc.data().rol);
            setUserBloqueado(!!userDoc.data().bloqueado);
          } else {
            setUserRole('BASE'); // Rol por defecto si no existe documento
            setUserBloqueado(false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole('BASE');
          setUserBloqueado(false);
        }
      } else {
        setUserRole(null);
        setUserBloqueado(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = () => {
    return signOut(auth);
  };

  if (userBloqueado) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-red-500/20 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-red-400">Usuario Bloqueado</h2>
            <p className="text-sm text-slate-400">
              Tu cuenta ha sido suspendida. Si consideras que esto es un error, por favor contacta al administrador del sistema.
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl transition-all"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, userRole, userBloqueado, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
