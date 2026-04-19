import { db, auth, doc, onSnapshot, updateDoc, collection, addDoc, deleteDoc, query, orderBy, onAuthStateChanged, signOut } from './admin.js';

// مرجع الوثيقة في Firebase
const configRef = doc(db, "settings", "siteConfig");
const teamCollection = collection(db, "teamMembers");

// 1. حماية اللوحة: التحقق الصارم من تسجيل الدخول وإظهار المحتوى
onAuthStateChanged(auth, (user) => {
    const adminBody = document.getElementById('adminBody');
    if (user) {
        console.log("تم التحقق من الإدمن: الدخول مسموح");
        if (adminBody) {
            adminBody.style.setProperty('display', 'flex', 'important'); 
        }
    } else {
        console.warn("لا يوجد تسجيل دخول: جاري التحويل...");
        window.location.replace('admin-login.html');
    }
});

// 2. التحميل التلقائي والمزامنة
onSnapshot(configRef, (snap) => {
    if (snap.exists()) {
        const data = snap.data();
        
        const fields = {
            'discordLink': data.discordLink,
            'logoUrl': data.logoUrl,
            'adminApp': data.adminApp || 'open',
            'transferApp': data.transferApp || 'open',
            'rulesGeneral': data.rulesGeneral,
            'rulesGreenZone': data.rulesGreenZone,
            'rulesHeist': data.rulesHeist,
            'rulesShootout': data.rulesShootout
        };

        for (const [id, value] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        }
    }
});

// 3. وظائف أزرار الحفظ (ربط الأحداث برمجياً)

const setupClick = (id, callback) => {
    const btn = document.getElementById(id);
    if (btn) btn.onclick = callback;
};

// حفظ الروابط
setupClick('saveGeneral', async () => {
    try {
        await updateDoc(configRef, {
            discordLink: document.getElementById('discordLink').value,
            logoUrl: document.getElementById('logoUrl').value
        });
        alert("تم حفظ الروابط والصور بنجاح ✅");
    } catch (e) { alert("خطأ في الحفظ! تأكد من صلاحيات Firebase"); }
});

// تحديث حالة التقديمات
setupClick('saveStatus', async () => {
    try {
        await updateDoc(configRef, {
            adminApp: document.getElementById('adminApp').value,
            transferApp: document.getElementById('transferApp').value
        });
        alert("تم تحديث حالة التقديمات (مفتوح/مغلق) بنجاح ✅");
    } catch (e) { alert("حدث خطأ أثناء التحديث"); }
});

// حفظ القوانين
setupClick('saveRules', async () => {
    try {
        await updateDoc(configRef, {
            rulesGeneral: document.getElementById('rulesGeneral').value,
            rulesGreenZone: document.getElementById('rulesGreenZone').value,
            rulesHeist: document.getElementById('rulesHeist').value,
            rulesShootout: document.getElementById('rulesShootout').value
        });
        alert("تم تحديث كافة القوانين ونشرها في الموقع الآن ✅");
    } catch (e) { alert("فشل تحديث القوانين"); }
});

// 4. تسجيل الخروج
setupClick('logoutBtn', () => {
    signOut(auth).then(() => {
        window.location.replace('admin-login.html');
    });
});

// --- وظيفة إضافة عضو جديد للطاقم ---
setupClick('addMemberBtn', async () => {
    const name = document.getElementById('newMemberName').value;
    const rank = document.getElementById('newMemberRank').value;
    const photo = document.getElementById('newMemberPhoto').value;
    const category = document.getElementById('newMemberCategory').value;

    if(name && rank && photo) {
        try {
            await addDoc(teamCollection, {
                name, rank, photo, category,
                createdAt: Date.now()
            });
            alert("تم إضافة العضو إلى الطاقم بنجاح! ✅");
            document.getElementById('newMemberName').value = '';
            document.getElementById('newMemberRank').value = '';
            document.getElementById('newMemberPhoto').value = '';
        } catch (e) { alert("حدث خطأ أثناء الإضافة."); }
    } else {
        alert("يرجى إكمال جميع بيانات العضو.");
    }
});

// --- عرض قائمة الأعضاء وإدارة الحذف ---
onSnapshot(query(teamCollection, orderBy("createdAt", "desc")), (snap) => {
    const container = document.getElementById('membersListContainer');
    if(!container) return;
    
    container.innerHTML = ''; 
    
    snap.forEach((memberDoc) => {
        const member = memberDoc.data();
        const div = document.createElement('div');
        div.className = "member-item"; // تأكد من استخدام كلاس للتنسيق
        div.style = "background: #222; padding: 15px; border-radius: 10px; border: 1px solid #333; display: flex; align-items: center; gap: 15px; margin-bottom: 10px;";
        
        div.innerHTML = `
            <img src="${member.photo}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #ff0000;">
            <div style="flex: 1;">
                <div style="font-weight: bold; font-size: 0.9rem;">${member.name}</div>
                <div style="font-size: 0.8rem; color: #888;">${member.rank} (${member.category})</div>
            </div>
            <button class="delete-member-btn" data-id="${memberDoc.id}" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 1.2rem;">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        container.appendChild(div);
    });

    // ربط أزرار الحذف برمجياً بعد رندر العناصر
    document.querySelectorAll('.delete-member-btn').forEach(btn => {
        btn.onclick = () => deleteMemberAction(btn.getAttribute('data-id'));
    });
});

// دالة الحذف (تم تغيير الاسم لتجنب التعارض)
async function deleteMemberAction(id) {
    if(confirm("هل أنت متأكد من رغبتك في إزالة هذا العضو من الطاقم؟")) {
        try {
            await deleteDoc(doc(db, "teamMembers", id));
            alert("تم حذف العضو بنجاح.");
        } catch (e) { alert("حدث خطأ أثناء محاولة الحذف."); }
    }
}