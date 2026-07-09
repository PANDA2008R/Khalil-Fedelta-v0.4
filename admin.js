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

/* ---------- التبديل بين تابات لوحة التحكم ---------- */
document.querySelectorAll('.admin-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

auth && auth.onAuthStateChanged(user => {
  if(user){
    loginScreen.style.display = 'none';
    adminPanel.style.display = 'block';
    listenToProducts();
    listenToServices();
    loadSiteInfo();
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


/* ---------- إدارة الأقسام (الكاتيجوريز) ---------- */
const defaultCategories = [
  {key:'macchine', label:'Macchine di Pulizia', icon:'🛠️', isDefault:true},
  {key:'attrezzi', label:'Attrezzi di Pulizia', icon:'🧹', isDefault:true},
  {key:'liquidi', label:'Prodotti Liquidi', icon:'🧴', isDefault:true},
];
let allCategories = [...defaultCategories];

const fCat = document.getElementById('fCat');
const catName = document.getElementById('catName');
const catIcon = document.getElementById('catIcon');
const addCatBtn = document.getElementById('addCatBtn');
const catList = document.getElementById('catList');

function slugify(text){
  return text.trim().toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '')
    .replace(/\s+/g, '-');
}

function renderCategorySelect(){
  const prevValue = fCat.value;
  fCat.innerHTML = allCategories.map(c => `<option value="${c.key}">${c.icon} ${c.label}</option>`).join('');
  fCat.value = prevValue || allCategories[0].key;
}

function renderCatList(){
  catList.innerHTML = allCategories.map(c => `
    <div class="cat-chip">
      <span>${c.icon} ${c.label}</span>
      ${c.isDefault ? '<span class="default-tag">(أساسي)</span>' : `<button class="delete-cat" data-key="${c.key}" title="حذف القسم">✕</button>`}
    </div>
  `).join('');
}

function loadCategories(){
  db.collection('categories').onSnapshot(snapshot => {
    const extra = snapshot.docs.map(doc => ({ id: doc.id, isDefault:false, ...doc.data() }));
    allCategories = [...defaultCategories, ...extra];
    renderCategorySelect();
    renderCatList();
  });
}

addCatBtn.addEventListener('click', async () => {
  const label = catName.value.trim();
  const icon = catIcon.value.trim() || '📦';
  if(!label){
    showStatus('اكتب اسم القسم الأول.', 'error');
    return;
  }
  const key = slugify(label);
  if(allCategories.some(c => c.key === key)){
    showStatus('القسم ده موجود بالفعل.', 'error');
    return;
  }
  try{
    await db.collection('categories').add({ key, label, icon });
    catName.value = '';
    catIcon.value = '';
    showStatus('تم إضافة القسم بنجاح ✓', 'success');
  }catch(err){
    console.error(err);
    showStatus('حصل خطأ أثناء إضافة القسم.', 'error');
  }
});

catList.addEventListener('click', async (e) => {
  const btn = e.target.closest('.delete-cat');
  if(!btn) return;
  const key = btn.dataset.key;
  const cat = allCategories.find(c => c.key === key);
  if(!cat || !cat.id) return;
  if(confirm('متأكد إنك عايز تحذف القسم ده؟ (المنتجات اللي فيه مش هتتحذف بس مش هتبان في تبويب)')){
    try{
      await db.collection('categories').doc(cat.id).delete();
    }catch(err){
      console.error(err);
      showStatus('حصل خطأ أثناء حذف القسم.', 'error');
    }
  }
});

/* ---------- إدارة الخدمات (Servizi) ---------- */
const defaultServices = [
  {name:'Pulizia Casa', icon:'🏠', desc:'Pulizia completa per appartamenti e ville.', priceLabel:'A partire da €40'},
  {name:'Pulizia Uffici', icon:'🏢', desc:'Servizi professionali per uffici e negozi.', priceLabel:'A partire da €60'},
  {name:'Riparazione Macchine', icon:'🔧', desc:'Riparazione e manutenzione macchine per la pulizia.', priceLabel:'Preventivo Gratuito'},
  {name:'Consegna a Domicilio', icon:'🚚', desc:'Consegna rapida in tutta la zona di Milano.', priceLabel:'Gratuita sopra €50'},
];

const servName = document.getElementById('servName');
const servIcon = document.getElementById('servIcon');
const servPriceLabel = document.getElementById('servPriceLabel');
const servDesc = document.getElementById('servDesc');
const servDisabled = document.getElementById('servDisabled');
const servEditId = document.getElementById('servEditId');
const saveServBtn = document.getElementById('saveServBtn');
const cancelServEditBtn = document.getElementById('cancelServEditBtn');
const servFormTitle = document.getElementById('servFormTitle');
const servList = document.getElementById('servList');

function resetServForm(){
  servEditId.value = '';
  servName.value = '';
  servIcon.value = '';
  servPriceLabel.value = '';
  servDesc.value = '';
  servDisabled.checked = false;
  servFormTitle.textContent = 'Aggiungi Nuovo Servizio';
  cancelServEditBtn.style.display = 'none';
}

cancelServEditBtn.addEventListener('click', resetServForm);

saveServBtn.addEventListener('click', async () => {
  const name = servName.value.trim();
  if(!name){
    showStatus('اكتب اسم الخدمة الأول.', 'error');
    return;
  }
  const data = {
    name,
    icon: servIcon.value.trim() || '🧽',
    priceLabel: servPriceLabel.value.trim() || 'Contattaci per il prezzo',
    desc: servDesc.value.trim(),
    disabled: servDisabled.checked,
  };
  saveServBtn.disabled = true;
  saveServBtn.textContent = 'جاري الحفظ...';
  try{
    if(servEditId.value){
      await db.collection('services').doc(servEditId.value).update(data);
      showStatus('تم تعديل الخدمة بنجاح ✓', 'success');
    } else {
      await db.collection('services').add(data);
      showStatus('تم إضافة الخدمة بنجاح ✓', 'success');
    }
    resetServForm();
  }catch(err){
    console.error(err);
    showStatus('حصل خطأ أثناء حفظ الخدمة.', 'error');
  }finally{
    saveServBtn.disabled = false;
    saveServBtn.textContent = 'Salva Servizio';
  }
});

async function seedDefaultServicesIfEmpty(snapshot){
  if(!snapshot.empty) return;
  try{
    const batchPromises = defaultServices.map(s => db.collection('services').add(s));
    await Promise.all(batchPromises);
  }catch(err){
    console.error('تعذر إنشاء الخدمات الافتراضية:', err);
  }
}

function listenToServices(){
  db.collection('services').onSnapshot(async snapshot => {
    if(snapshot.empty){
      await seedDefaultServicesIfEmpty(snapshot);
      return; // الـ onSnapshot هيتفعل تاني تلقائي بعد الإضافة
    }
    servList.innerHTML = '';
    snapshot.forEach(doc => {
      const s = { id: doc.id, ...doc.data() };
      const row = document.createElement('div');
      row.className = 'admin-row';
      row.innerHTML = `
        <div class="thumb">${s.icon || '🧽'}</div>
        <div class="info">
          <h4>${s.name}${s.disabled ? ' <span style="color:#f87171;">(معطّل)</span>' : ''}</h4>
          <span>${s.priceLabel || ''}</span>
        </div>
        <div class="row-actions">
          <button class="edit-serv-btn" data-id="${s.id}" title="تعديل">✎</button>
          <button class="delete-serv-btn" data-id="${s.id}" title="حذف">🗑</button>
        </div>
      `;
      servList.appendChild(row);
    });
  });
}

servList.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('.edit-serv-btn');
  const delBtn = e.target.closest('.delete-serv-btn');

  if(editBtn){
    const id = editBtn.dataset.id;
    const doc = await db.collection('services').doc(id).get();
    if(!doc.exists) return;
    const s = doc.data();
    servEditId.value = id;
    servName.value = s.name || '';
    servIcon.value = s.icon || '';
    servPriceLabel.value = s.priceLabel || '';
    servDesc.value = s.desc || '';
    servDisabled.checked = !!s.disabled;
    servFormTitle.textContent = 'تعديل الخدمة: ' + s.name;
    cancelServEditBtn.style.display = 'inline-block';
    window.scrollTo({top:0, behavior:'smooth'});
  }

  if(delBtn){
    const id = delBtn.dataset.id;
    if(confirm('متأكد إنك عايز تحذف الخدمة دي؟')){
      try{
        await db.collection('services').doc(id).delete();
        showStatus('تم حذف الخدمة.', 'success');
      }catch(err){
        console.error(err);
        showStatus('حصل خطأ أثناء حذف الخدمة.', 'error');
      }
    }
  }
});

/* ---------- فورم الإضافة/التعديل ---------- */
const editId = document.getElementById('editId');
const fName = document.getElementById('fName');
const fBadge = document.getElementById('fBadge');
const fPrice = document.getElementById('fPrice');
const fOldPrice = document.getElementById('fOldPrice');
const fQuantity = document.getElementById('fQuantity');
const fDesc = document.getElementById('fDesc');
const fIcon = document.getElementById('fIcon');
const fOutOfStock = document.getElementById('fOutOfStock');
const saveBtn = document.getElementById('saveBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');

/* ---------- الفاريانتس (زي الروايح أو الألوان) ---------- */
const variantInput = document.getElementById('variantInput');
const addVariantBtn = document.getElementById('addVariantBtn');
const variantList = document.getElementById('variantList');
let currentVariants = [];

function renderVariantList(){
  variantList.innerHTML = '';
  currentVariants.forEach((v, i) => {
    const chip = document.createElement('div');
    chip.className = 'variant-chip';
    chip.innerHTML = `<span>${v}</span><button type="button" data-idx="${i}">✕</button>`;
    variantList.appendChild(chip);
  });
}

addVariantBtn.addEventListener('click', () => {
  const v = variantInput.value.trim();
  if(!v) return;
  if(currentVariants.includes(v)){ variantInput.value=''; return; }
  currentVariants.push(v);
  variantInput.value = '';
  renderVariantList();
});

variantInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){ e.preventDefault(); addVariantBtn.click(); }
});

variantList.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  currentVariants.splice(parseInt(btn.dataset.idx), 1);
  renderVariantList();
});

function resetForm(){
  editId.value = '';
  fName.value = '';
  fCat.value = allCategories[0].key;
  fBadge.value = '';
  fPrice.value = '';
  fOldPrice.value = '';
  fQuantity.value = '';
  fDesc.value = '';
  fIcon.value = '';
  fOutOfStock.checked = false;
  currentImages = [];
  currentVariants = [];
  renderVariantList();
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
    quantity: fQuantity.value !== '' ? parseInt(fQuantity.value) : null,
    desc: fDesc.value.trim(),
    icon: fIcon.value.trim() || '🧴',
    outOfStock: fOutOfStock.checked,
    variants: [...currentVariants],
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

/* ---------- عرض قائمة المنتجات الحالية + البحث ---------- */
const adminList = document.getElementById('adminList');
const adminSearch = document.getElementById('adminSearch');
let cachedProducts = [];

function catLabel(key){
  const c = allCategories.find(c => c.key === key);
  return c ? c.label : key;
}

function renderAdminList(){
  const q = adminSearch.value.trim().toLowerCase();
  const list = q ? cachedProducts.filter(p => p.name.toLowerCase().includes(q)) : cachedProducts;

  adminList.innerHTML = '';
  if(cachedProducts.length === 0){
    adminList.innerHTML = '<p style="color:var(--muted);">لسه مفيش منتجات مضافة. استخدم الفورم فوق عشان تضيف أول منتج.</p>';
    return;
  }
  if(list.length === 0){
    adminList.innerHTML = '<p style="color:var(--muted);">مفيش منتج بالاسم ده.</p>';
    return;
  }
  list.forEach(p => {
    const row = document.createElement('div');
    row.className = 'admin-row';
    const firstImg = (p.images && p.images[0]) || p.image;
    const thumb = firstImg ? `<img src="${firstImg}" alt="${p.name}">` : (p.icon || '🧴');
    const imgCount = p.images ? p.images.length : (p.image ? 1 : 0);
    row.innerHTML = `
      <div class="thumb">${thumb}</div>
      <div class="info">
        <h4>${p.name}${p.outOfStock ? ' <span style="color:#f87171;">(Esaurito)</span>' : ''}</h4>
        <span>${catLabel(p.cat)} · €${p.price}${p.oldPrice ? ` (كان €${p.oldPrice})` : ''}${p.badge ? ' · ' + (p.badge === 'offerta' ? 'عرض' : 'الأكثر مبيعًا') : ''}${imgCount > 1 ? ` · ${imgCount} صور` : ''}${(p.quantity !== null && p.quantity !== undefined) ? ` · الكمية: ${p.quantity}` : ''}</span>
      </div>
      <div class="row-actions">
        <button class="edit-btn" data-id="${p.id}" title="تعديل">✎</button>
        <button class="delete-btn" data-id="${p.id}" title="حذف">🗑</button>
      </div>
    `;
    adminList.appendChild(row);
  });
}

adminSearch.addEventListener('input', renderAdminList);

function listenToProducts(){
  loadCategories();
  db.collection('products').onSnapshot(snapshot => {
    cachedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderAdminList();
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
    fCat.value = p.cat || allCategories[0].key;
    fBadge.value = p.badge || '';
    fPrice.value = p.price ?? '';
    fOldPrice.value = p.oldPrice ?? '';
    fQuantity.value = (p.quantity !== null && p.quantity !== undefined) ? p.quantity : '';
    fDesc.value = p.desc || '';
    fIcon.value = p.icon || '';
    fOutOfStock.checked = !!p.outOfStock;
    currentVariants = p.variants ? [...p.variants] : [];
    renderVariantList();
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

/* ---------- إدارة معلومات "Chi Siamo" والتواصل ---------- */
const infoAbout = document.getElementById('infoAbout');
const infoAddress = document.getElementById('infoAddress');
const infoWhatsapp = document.getElementById('infoWhatsapp');
const infoFacebook = document.getElementById('infoFacebook');
const infoInstagram = document.getElementById('infoInstagram');
const saveInfoBtn = document.getElementById('saveInfoBtn');

async function loadSiteInfo(){
  try{
    const doc = await db.collection('siteInfo').doc('main').get();
    if(doc.exists){
      const d = doc.data();
      infoAbout.value = d.about || '';
      infoAddress.value = d.address || '';
      infoWhatsapp.value = d.whatsapp || '';
      infoFacebook.value = d.facebook || '';
      infoInstagram.value = d.instagram || '';
    }
  }catch(err){
    console.error('تعذر تحميل معلومات الموقع:', err);
  }
}

saveInfoBtn.addEventListener('click', async () => {
  const data = {
    about: infoAbout.value.trim(),
    address: infoAddress.value.trim(),
    whatsapp: infoWhatsapp.value.trim(),
    facebook: infoFacebook.value.trim(),
    instagram: infoInstagram.value.trim(),
  };
  saveInfoBtn.disabled = true;
  saveInfoBtn.textContent = 'جاري الحفظ...';
  try{
    await db.collection('siteInfo').doc('main').set(data, {merge:true});
    showStatus('تم حفظ المعلومات بنجاح ✓', 'success');
  }catch(err){
    console.error(err);
    showStatus('حصل خطأ أثناء الحفظ.', 'error');
  }finally{
    saveInfoBtn.disabled = false;
    saveInfoBtn.textContent = 'Salva Informazioni';
  }
});
