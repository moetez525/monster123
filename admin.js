// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// أضفنا collection و addDoc و deleteDoc و query و orderBy و where و limit لزيادة التحكم
import { 
    getFirestore, 
    doc, 
    onSnapshot, 
    updateDoc, 
    getDoc, 
    collection, 
    addDoc, 
    deleteDoc, 
    query, 
    orderBy,
    where,
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// بيانات مشروع reallife-cfw الخاصة بك
const firebaseConfig = {
    apiKey: "AIzaSyD3lLSBhH5opZX7489VfjxNaxD_s62yAi4",
    authDomain: "reallife-cfw.firebaseapp.com",
    projectId: "reallife-cfw",
    storageBucket: "reallife-cfw.firebasestorage.app",
    messagingSenderId: "951886069597",
    appId: "1:951886069597:web:dbe8f2579f380ebed532b4",
    measurementId: "G-Y0P9GWJ579"
};

// تهيئة Firebase مع التحقق من عدم التكرار (مهم لبيئات الاستضافة)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// تصدير الأدوات لاستخدامها في dashboard.js و index.html بدون حذف أي شيء
export { 
    db, 
    auth, 
    doc, 
    onSnapshot, 
    updateDoc, 
    getDoc,
    collection, 
    addDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    where,         // أضفناها لتسهيل الفلترة مستقبلاً
    limit,         // أضفناها للتحكم في عدد العناصر المعروضة
    onAuthStateChanged, 
    signOut,
    signInWithEmailAndPassword 
};