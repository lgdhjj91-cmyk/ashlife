import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDTaRRmVZj7kk0h3eoTzkC2US8Vv8o7uyI",
  authDomain: "ashlife-6da65.firebaseapp.com",
  databaseURL: "https://ashlife-6da65-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ashlife-6da65",
  storageBucket: "ashlife-6da65.firebasestorage.app",
  messagingSenderId: "73233283040",
  appId: "1:73233283040:web:5ac99df489467d04c55d85",
  measurementId: "G-VWG95BHSEE"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
