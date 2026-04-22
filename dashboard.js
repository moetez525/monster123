import { db, auth, doc, onSnapshot, updateDoc, collection, addDoc, deleteDoc, query, orderBy, onAuthStateChanged, signOut } from './admin.js';

// --- نظام الإشعارات (Toast) ---
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    .toast-container {
        position: fixed;
        bottom: 30px;
        right: 30px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 9999;
        pointer-events: none;
    }
    .toast-notification {
        background: rgba(15, 22, 41, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(58, 82, 115, 0.4);
        border-right: 4px solid #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 14px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        transform: translateX(120%);
        opacity: 0;
        transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.5s ease;
        font-family: 'Tajawal', sans-serif;
        font-weight: 600;
        min-width: 280px;
    }
    .toast-notification.show {
        transform: translateX(0);
        opacity: 1;
    }
    .toast-notification i {
        font-size: 1.5rem;
    }
    .toast-success { border-right-color: #10b981; }
    .toast-success i { color: #10b981; }
    
    .toast-error { border-right-color: #ef4444; }
    .toast-error i { color: #ef4444; }
    
    .toast-warning { border-right-color: #f59e0b; }
    .toast-warning i { color: #f59e0b; }
`;
document.head.appendChild(toastStyle);

const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';

// Fixed: Immediately append or ensure it appends if body is ready
if (document.body) {
    document.body.appendChild(toastContainer);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(toastContainer);
    });
}

window.showToast = function(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    let icon = 'fa-check-circle';
    if(type === 'error') icon = 'fa-times-circle';
    if(type === 'warning') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    
    // Safety check: always ensure container is in DOM before appending toast
    if(!document.body.contains(toastContainer)) {
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        setTimeout(() => toast.classList.add('show'), 10);
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

// مرجع الوثيقة في Firebase
const configRef = doc(db, "settings", "siteConfig");
const teamCollection = collection(db, "teamMembers");

// 1. حماية اللوحة
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

// 3. وظائف أزرار الحفظ
const setupClick = (id, callback) => {
    const btn = document.getElementById(id);
    if (btn) btn.onclick = callback;
};

setupClick('saveGeneral', async () => {
    try {
        await updateDoc(configRef, {
            discordLink: document.getElementById('discordLink').value,
            logoUrl: document.getElementById('logoUrl').value
        });
        showToast("تم حفظ الروابط والصور بنجاح", "success");
    } catch (e) { showToast("خطأ في الحفظ!", "error"); }
});

setupClick('saveStatus', async () => {
    try {
        await updateDoc(configRef, {
            adminApp: document.getElementById('adminApp').value,
            transferApp: document.getElementById('transferApp').value
        });
        showToast("تم تحديث حالة التقديمات بنجاح", "success");
    } catch (e) { showToast("حدث خطأ أثناء التحديث", "error"); }
});

setupClick('saveRules', async () => {
    try {
        await updateDoc(configRef, {
            rulesGeneral: document.getElementById('rulesGeneral').value,
            rulesGreenZone: document.getElementById('rulesGreenZone').value,
            rulesHeist: document.getElementById('rulesHeist').value,
            rulesShootout: document.getElementById('rulesShootout').value
        });
        showToast("تم تحديث كافة القوانين بنجاح", "success");
    } catch (e) { showToast("فشل تحديث القوانين", "error"); }
});

setupClick('logoutBtn', () => {
    signOut(auth).then(() => {
        window.location.replace('admin-login.html');
    });
});

// --- إضافة عضو جديد ---
setupClick('addMemberBtn', async () => {
    const nameEl = document.getElementById('newMemberName');
    const rankEl = document.getElementById('newMemberRank');
    const photoEl = document.getElementById('newMemberPhoto');
    const categoryEl = document.getElementById('newMemberCategory');

    if(nameEl.value && rankEl.value && photoEl.value) {
        try {
            await addDoc(teamCollection, {
                name: nameEl.value,
                rank: rankEl.value,
                photo: photoEl.value,
                category: categoryEl.value,
                createdAt: Date.now()
            });
            showToast("تم إضافة العضو بنجاح!", "success");
            nameEl.value = '';
            rankEl.value = '';
            photoEl.value = '';
        } catch (e) { showToast("حدث خطأ أثناء الإضافة.", "error"); }
    } else {
        showToast("يرجى إكمال جميع بيانات العضو.", "warning");
    }
});

// --- عرض قائمة الأعضاء ---
onSnapshot(query(teamCollection, orderBy("createdAt", "desc")), (snap) => {
    const container = document.getElementById('membersListContainer');
    if(!container) return;
    
    container.innerHTML = ''; 
    
    snap.forEach((memberDoc) => {
        const member = memberDoc.data();
        const div = document.createElement('div');
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

    document.querySelectorAll('.delete-member-btn').forEach(btn => {
        btn.onclick = () => deleteMemberAction(btn.getAttribute('data-id'));
    });
});

async function deleteMemberAction(id) {
    if(confirm("هل أنت متأكد من رغبتك في إزالة هذا العضو من الطاقم؟")) {
        try {
            // Correct Firebase v9+ deletion syntax
            await deleteDoc(doc(db, "teamMembers", id));
            showToast("تم حذف العضو بنجاح.", "success");
        } catch (e) { 
            console.error(e);
            showToast("حدث خطأ أثناء محاولة الحذف.", "error"); 
        }
    }
}