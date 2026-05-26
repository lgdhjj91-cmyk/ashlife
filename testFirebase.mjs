import { initializeApp } from "firebase/app";
import { getDatabase, ref, runTransaction, set, get } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import fs from "fs";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log("Initializing app...");
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

async function testFirebase() {
  console.log("Testing generateOrderId...");
  try {
    const now = new Date();
    const dateStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');
    
    console.log(`Running transaction on settings/orderCounter/${dateStr}`);
    
    // Set a timeout for the transaction
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Transaction timed out")), 10000));
    
    const transactionPromise = runTransaction(ref(database, `settings/orderCounter/${dateStr}`), (current) => {
      return (current || 0) + 1;
    });

    const result = await Promise.race([transactionPromise, timeoutPromise]);
    console.log("Transaction result:", result.snapshot.val());
  } catch (error) {
    console.error("Error in transaction:", error);
  }

  console.log("Testing Storage upload...");
  try {
    const dummyBuffer = Buffer.from("test");
    // Since Firebase storage web SDK expects Blob/Uint8Array in node, we can pass Uint8Array
    const fileRef = storageRef(storage, `payment-screenshots/test.txt`);
    
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Upload timed out")), 10000));
    
    const uploadPromise = uploadBytes(fileRef, new Uint8Array(dummyBuffer));
    await Promise.race([uploadPromise, timeoutPromise]);
    
    const url = await getDownloadURL(fileRef);
    console.log("Upload successful, URL:", url);
  } catch (error) {
    console.error("Error in upload:", error);
  }
  
  process.exit(0);
}

testFirebase();
