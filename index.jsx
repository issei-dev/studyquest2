import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';

setLogLevel('debug');

export default function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [experience, setExperience] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // FirestoreとFirebase認証の初期化
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const firebaseConfig = JSON.parse(__firebase_config);
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);
        setDb(firestoreDb);
        setAuth(firebaseAuth);

        onAuthStateChanged(firebaseAuth, async (user) => {
          if (user) {
            setUserId(user.uid);
            console.log("User signed in with UID:", user.uid);
          } else {
            console.log("No user signed in. Signing in anonymously...");
            const anonUser = await signInAnonymously(firebaseAuth);
            setUserId(anonUser.user.uid);
            console.log("Signed in anonymously with UID:", anonUser.user.uid);
          }
          setIsLoading(false);
        });

        if (typeof __initial_auth_token !== 'undefined') {
          await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        } else {
          await signInAnonymously(firebaseAuth);
        }

      } catch (e) {
        console.error("Error initializing Firebase:", e);
      }
    };

    initializeFirebase();
  }, []);

  // 経験値の追加関数。これが使用される前に定義されている必要があります。
  const addExp = async () => {
    if (!db || !userId) {
      console.error("Firebase not initialized or user not authenticated.");
      return;
    }
    const newExp = experience + 10;
    try {
      const userDocRef = doc(db, 'artifacts', __app_id, 'users', userId, 'exp-data', 'current');
      await setDoc(userDocRef, { value: newExp });
      console.log("Experience updated successfully.");
    } catch (e) {
      console.error("Error adding experience:", e);
    }
  };

  // Firestoreから経験値データをリアルタイムで読み込む
  useEffect(() => {
    if (db && userId) {
      const docRef = doc(db, 'artifacts', __app_id, 'users', userId, 'exp-data', 'current');
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setExperience(data.value);
        } else {
          // ドキュメントが存在しない場合は0に設定
          setExperience(0);
          console.log("No experience data found. Initializing with 0.");
        }
      }, (error) => {
        console.error("Error getting real-time experience data:", error);
      });

      return () => unsubscribe(); // クリーンアップ関数
    }
  }, [db, userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-xl font-semibold animate-pulse">
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 font-sans">
      <div className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-transform transform hover:scale-105">
        <h1 className="text-3xl font-bold text-center mb-4 text-purple-600 dark:text-purple-400">
          経験値トラッカー
        </h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          ユーザーID: <span className="font-mono break-all">{userId}</span>
        </p>

        <div className="flex flex-col items-center gap-4 mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            現在の経験値:
          </p>
          <div className="text-6xl font-extrabold text-blue-500 dark:text-blue-400 transition-all duration-300">
            {experience}
          </div>
        </div>

        <button
          onClick={addExp}
          className="w-full py-3 px-6 rounded-xl bg-blue-500 text-white font-bold text-lg shadow-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
        >
          経験値を追加
        </button>
      </div>
    </div>
  );
}
