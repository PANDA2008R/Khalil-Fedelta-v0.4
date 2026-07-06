/* ============================================================
   إعدادات Firebase — لازم تملأ البيانات دي من مشروعك انت
   إزاي تجيبها: هوريك خطوة خطوة في الشات
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyBH-BKsW6TFxEsh8GRv1HMm3pBB0hz4Feg",
  authDomain: "khalil-fedelta.firebaseapp.com",
  projectId: "khalil-fedelta",
  storageBucket: "khalil-fedelta.firebasestorage.app",
  messagingSenderId: "1047601203577",
  appId: "1:1047601203577:web:668e6bee4cd5b3914987a8"
};

let db, auth;
try{
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;
}catch(err){
  console.warn('Firebase مش متظبط لسه (طبيعي لو لسه محطتش بيانات مشروعك):', err);
}
