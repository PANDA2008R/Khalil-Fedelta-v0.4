/* ============================================================
   إعدادات Firebase — لازم تملأ البيانات دي من مشروعك انت
   إزاي تجيبها: هوريك خطوة خطوة في الشات
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyDr8usXh2cOOnmj8KxIk0UegeC_gLSTGPc",
  authDomain: "khalil-fedelta-c80a5.firebaseapp.com",
  projectId: "khalil-fedelta-c80a5",
  storageBucket: "khalil-fedelta-c80a5.firebasestorage.app",
  messagingSenderId: "844428068167",
  appId: "1:844428068167:web:d05822dacf04fd67e47862"
};

let db, auth;
try{
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;
}catch(err){
  console.warn('Firebase مش متظبط لسه (طبيعي لو لسه محطتش بيانات مشروعك):', err);
}
