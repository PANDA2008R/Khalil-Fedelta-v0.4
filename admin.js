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

/* ---------- رفع وضغط أكتر من صورة (لحد 4) بدون Firebase Storage ---------- */
const fImages = document.getElementById('fImages');
const galleryPreview = document.getElementById('galleryPreview');
let currentImages = []; // مصفوفة base64 (لحد 4 صور)

function renderGalleryPreview(){
  galleryPreview.innerHTML = '';
  if(currentImages.length === 0){
    galleryPreview.innerHTML = '<div class="gallery-empty">Nessuna immagine selezionata</div>';
    return;
  }
  currentImages.forEach((imgData, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumb';
    thumb.innerHTML = `<img src="${imgData}" alt="foto ${idx+1}"><button type="button" class="remove-thumb" data-idx="${idx}">&times;</button>`;
    galleryPreview.appendChild(thumb);
  });
}

galleryPreview.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-thumb');
  if(!btn) return;
  const idx = parseInt(btn.dataset.idx);
  currentImages.splice(idx, 1);
  renderGalleryPreview();
});

function compressImage(file){
  return new Promise((resolve) => {
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
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

fImages.addEventListener('change', async () => {
  const files = Array.from(fImages.files).slice(0, 4 - currentImages.length);
  if(currentImages.length + files.length > 4){
    showStatus('أقصى عدد صور مسموح 4 لكل منتج.', 'error');
  }
  for(const file of files){
    const compressed = await compressImage(file);
    currentImages.push(compressed);
  }
  renderGalleryPreview();
  fImages.value = '';
});

renderGalleryPreview();


/* ---------- فورم الإضافة/التعديل ---------- */
const editId = document.getElementById('editId');
const fName = document.getElementById('fName');
const fCat = document.getElementById('fCat');
const fBadge = document.getElementById('fBadge');
const fPrice = document.getElementById('fPrice');
const fOldPrice = document.getElementById('fOldPrice');
const fDesc = document.getElementById('fDesc');
const fIcon = document.getElementById('fIcon');
const fOutOfStock = document.getElementById('fOutOfStock');
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
  fOutOfStock.checked = false;
  currentImages = [];
  fImages.value = '';
  renderGalleryPreview();
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
    outOfStock: fOutOfStock.checked,
  };

  // لو المستخدم اختار صور جديدة، حطها. لو بيعدل منتج ومحطش صور جديدة، سيب القديمة زي ما هي
  if(currentImages.length > 0){
    data.images = currentImages;
    data.image = currentImages[0]; // للتوافق مع الكود القديم
  } else if(!editId.value){
    data.images = [];
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
      const firstImg = (p.images && p.images[0]) || p.image;
      const thumb = firstImg ? `<img src="${firstImg}" alt="${p.name}">` : (p.icon || '🧴');
      const imgCount = p.images ? p.images.length : (p.image ? 1 : 0);
      row.innerHTML = `
        <div class="thumb">${thumb}</div>
        <div class="info">
          <h4>${p.name}${p.outOfStock ? ' <span style="color:#f87171;">(Esaurito)</span>' : ''}</h4>
          <span>${catLabels[p.cat] || p.cat} · €${p.price}${p.oldPrice ? ` (كان €${p.oldPrice})` : ''}${p.badge ? ' · ' + (p.badge === 'offerta' ? 'عرض' : 'الأكثر مبيعًا') : ''}${imgCount > 1 ? ` · ${imgCount} صور` : ''}</span>
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
    fOutOfStock.checked = !!p.outOfStock;
    currentImages = p.images ? [...p.images] : (p.image ? [p.image] : []);
    renderGalleryPreview();
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
