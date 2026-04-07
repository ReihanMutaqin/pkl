import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgP906nJxFZjL2El15At7ByadQkHbxR00",
  authDomain: "db-pkl.firebaseapp.com",
  projectId: "db-pkl",
  storageBucket: "db-pkl.firebasestorage.app",
  messagingSenderId: "708471818079",
  appId: "1:708471818079:web:1772b33e233dd8414918ea"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
