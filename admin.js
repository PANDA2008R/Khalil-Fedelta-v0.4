/* ============================================
   لوحة تحكم المنتجات — تسجيل الدخول + إضافة/تعديل/حذف
   ============================================ */

const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const statusMsg = document.getElementById('statusMsg');

function showStatus(text, type){
  statusMsg.textContent = text;
  statusMsg.className = 'status-msg show ' + type;
  setTimeout(() => statusMsg.classList.remove('show'), 3500);
}

/* ---------- تسجيل الدخول ---------- */
if(!auth){
  loginError.textContent = 'Firebase مش متظبط لسه. راجع firebase-config.js.';
}

loginBtn.addEventListener('click', () => {
  if(!auth){ loginError.textContent = 'Firebase مش متظبط لسه.'; return; }
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  loginError.textContent = '';
  auth.signInWithEmailAndPassword(email, password)
    .catch(err => {
      loginError.textContent = 'بيانات الدخول غلط. حاول تاني.';
      console.error(err);
    });
});

logoutBtn.addEventListener('click', () => auth.signOut());

auth && auth.onAuthStateChanged(user => {
  if(user){
    loginScreen.style.display = 'none';
    adminPanel.style.display = 'block';
    listenToProducts();
  } else {
    loginScreen.style.display = 'block';
    adminPanel.style.display = 'none';
  }
});

/* ---------- ضغط الصورة وتحويلها base64 (بدون Firebase Storage) ---------- */
const fImage = document.getElementById('fImage');
const imagePreview = document.getElementById('imagePreview');
let currentImageData = null; // base64 string أو null

fImage.addEventListener('change', () => {
  const file = fImage.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 700;
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      currentImageData = canvas.toDataURL('image/jpeg', 0.75);
      imagePreview.innerHTML = `<img src="${currentImageData}" alt="preview">`;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

/* ---------- فورم الإضافة/التعديل ---------- */
const editId = document.getElementById('editId');
const fName = document.getElementById('fName');
const fCat = document.getElementById('fCat');
const fBadge = document.getElementById('fBadge');
const fPrice = document.getElementById('fPrice');
const fOldPrice = document.getElementById('fOldPrice');
const fDesc = document.getElementById('fDesc');
const fIcon = document.getElementById('fIcon');
const saveBtn = document.getElementById('saveBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');

function resetForm(){
  editId.value = '';
  fName.value = '';
  fCat.value = 'macchine';
  fBadge.value = '';
  fPrice.value = '';
  fOldPrice.value = '';
  fDesc.value = '';
  fIcon.value = '';
  currentImageData = null;
  fImage.value = '';
  imagePreview.innerHTML = 'Nessuna immagine selezionata';
  formTitle.textContent = 'Aggiungi Nuovo Prodotto';
  cancelEditBtn.style.display = 'none';
}

cancelEditBtn.addEventListener('click', resetForm);

saveBtn.addEventListener('click', async () => {
  const name = fName.value.trim();
  const price = parseFloat(fPrice.value);

  if(!name || isNaN(price)){
    showStatus('من فضلك اكتب اسم المنتج والسعر على الأقل.', 'error');
    return;
  }

  const data = {
    name,
    cat: fCat.value,
    badge: fBadge.value || null,
    price,
    oldPrice: fOldPrice.value ? parseFloat(fOldPrice.value) : null,
    desc: fDesc.value.trim(),
    icon: fIcon.value.trim() || '🧴',
  };

  // لو المستخدم رفع صورة جديدة، حطها. لو بيعدل منتج ومحطش صورة جديدة، سيب القديمة زي ما هي
  if(currentImageData){
    data.image = currentImageData;
  } else if(!editId.value){
    data.image = null;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'جاري الحفظ...';

  try{
    if(editId.value){
      await db.collection('products').doc(editId.value).update(data);
      showStatus('تم تعديل المنتج بنجاح ✓', 'success');
    } else {
      await db.collection('products').add(data);
      showStatus('تم إضافة المنتج بنجاح ✓', 'success');
    }
    resetForm();
  }catch(err){
    console.error(err);
    showStatus('حصل خطأ أثناء الحفظ. حاول تاني.', 'error');
  }finally{
    saveBtn.disabled = false;
    saveBtn.textContent = 'Salva Prodotto';
  }
});

/* ---------- عرض قائمة المنتجات الحالية ---------- */
const adminList = document.getElementById('adminList');
const catLabels = {macchine:'Macchine', attrezzi:'Attrezzi', liquidi:'Liquidi'};

function listenToProducts(){
  db.collection('products').onSnapshot(snapshot => {
    adminList.innerHTML = '';
    if(snapshot.empty){
      adminList.innerHTML = '<p style="color:var(--muted);">لسه مفيش منتجات مضافة. استخدم الفورم فوق عشان تضيف أول منتج.</p>';
      return;
    }
    snapshot.forEach(doc => {
      const p = { id: doc.id, ...doc.data() };
      const row = document.createElement('div');
      row.className = 'admin-row';
      const thumb = p.image ? `<img src="${p.image}" alt="${p.name}">` : (p.icon || '🧴');
      row.innerHTML = `
        <div class="thumb">${thumb}</div>
        <div class="info">
          <h4>${p.name}</h4>
          <span>${catLabels[p.cat] || p.cat} · €${p.price}${p.oldPrice ? ` (كان €${p.oldPrice})` : ''}${p.badge ? ' · ' + (p.badge === 'offerta' ? 'عرض' : 'الأكثر مبيعًا') : ''}</span>
        </div>
        <div class="row-actions">
          <button class="edit-btn" data-id="${p.id}" title="تعديل">✎</button>
          <button class="delete-btn" data-id="${p.id}" title="حذف">🗑</button>
        </div>
      `;
      adminList.appendChild(row);
    });
  });
}

adminList.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('.edit-btn');
  const delBtn = e.target.closest('.delete-btn');

  if(editBtn){
    const id = editBtn.dataset.id;
    const doc = await db.collection('products').doc(id).get();
    if(!doc.exists) return;
    const p = doc.data();
    editId.value = id;
    fName.value = p.name || '';
    fCat.value = p.cat || 'macchine';
    fBadge.value = p.badge || '';
    fPrice.value = p.price ?? '';
    fOldPrice.value = p.oldPrice ?? '';
    fDesc.value = p.desc || '';
    fIcon.value = p.icon || '';
    currentImageData = null;
    imagePreview.innerHTML = p.image ? `<img src="${p.image}" alt="preview">` : 'Nessuna immagine selezionata';
    formTitle.textContent = 'تعديل المنتج: ' + p.name;
    cancelEditBtn.style.display = 'inline-block';
    window.scrollTo({top:0, behavior:'smooth'});
  }

  if(delBtn){
    const id = delBtn.dataset.id;
    if(confirm('متأكد إنك عايز تحذف المنتج ده؟')){
      try{
        await db.collection('products').doc(id).delete();
        showStatus('تم حذف المنتج.', 'success');
      }catch(err){
        console.error(err);
        showStatus('حصل خطأ أثناء الحذف.', 'error');
      }
    }
  }
});

/* ---------- تأثير Ripple (نفس اللي في الموقع) ---------- */
document.addEventListener('click', e => {
  const btn = e.target.closest('.ripple-btn');
  if(!btn) return;
  const rect = btn.getBoundingClientRect();
  const circle = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  circle.className = 'ripple';
  circle.style.width = circle.style.height = size + 'px';
  circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
  circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
});
