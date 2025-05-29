
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBYKmqmqKzT9MZhEvNk4JGqPAgs12ruvKs",
  authDomain: "studentsmo2025.firebaseapp.com",
  databaseURL: "https://studentsmo2025-default-rtdb.firebaseio.com",
  projectId: "studentsmo2025",
  storageBucket: "studentsmo2025.firebasestorage.app",
  messagingSenderId: "269657743492",
  appId: "1:269657743492:web:29d965fc991910cb5862d1"
};

// التأكد من عدم تكرار التطبيق
import { getApps, getApp } from 'firebase/app';

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const database = getDatabase(app);
