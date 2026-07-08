/* ============================================
   إعدادات عامة — WhatsApp والشركة
   ============================================ */
const WHATSAPP_NUMBER = "393934020090";
const STORE_NAME = "Khalil Fedeltà";

/* ============================================
   شاشة الترحيب — تختفي أوتوماتيك بعد ثانية ونص
   ============================================ */
setTimeout(() => {
  const splash = document.getElementById('splashScreen');
  if(splash) splash.classList.add('hide');
}, 1600);

/* منتجات احتياطية تظهر فقط لو مفيش اتصال بـ Firebase أو القاعدة فاضية */
const defaultProducts = [
  {id:"d1", name:"Lavapavimenti Professionale", cat:"macchine", price:320, oldPrice:null, desc:"Lava e asciuga pavimenti in un solo passaggio, uso professionale.", icon:"🧽", image:null, badge:"bestseller"},
  {id:"d2", name:"Aspirapolvere Industriale", cat:"macchine", price:250, oldPrice:null, desc:"Potenza elevata per grandi ambienti e cantieri.", icon:"🔌", image:null, badge:null},
  {id:"d3", name:"Scopa Professionale", cat:"attrezzi", price:15, oldPrice:null, desc:"Setole resistenti per interni ed esterni.", icon:"🧹", image:null, badge:null},
  {id:"d4", name:"Mocio con Secchio e Strizzatore", cat:"attrezzi", price:28, oldPrice:null, desc:"Sistema completo con panno in microfibra lavabile.", icon:"🪣", image:null, badge:"bestseller"},
  {id:"d5", name:"Detersivo Multiuso", cat:"liquidi", price:6, oldPrice:null, desc:"Sgrassatore professionale per ogni superficie.", icon:"🧴", image:null, badge:null},
  {id:"d6", name:"Lucido Vetri", cat:"liquidi", price:7, oldPrice:null, desc:"Pulizia senza aloni per vetri e specchi.", icon:"🪟", image:null, badge:"bestseller"},
];

const services = [
  {name:"Pulizia Casa", icon:"🏠", desc:"Pulizia completa per appartamenti e ville.", priceLabel:"A partire da €40"},
  {name:"Pulizia Uffici", icon:"🏢", desc:"Servizi professionali per uffici e negozi.", priceLabel:"A partire da €60"},
  {name:"Riparazione Macchine", icon:"🔧", desc:"Riparazione e manutenzione macchine per la pulizia.", priceLabel:"Preventivo Gratuito"},
  {name:"Consegna a Domicilio", icon:"🚚", desc:"Consegna rapida in tutta la zona di Milano.", priceLabel:"Gratuita sopra €50"},
];

let products = [];
let featured = [];
let cart = [];
let currentCat = "macchine";
let currentPage = 1;
const PAGE_SIZE = 6;

function sameId(a, b){ return String(a) === String(b); }

/* ============================================
   Toast (رسالة تأكيد صغيرة تحت)
   ============================================ */
function showToast(msg){
  let toast = document.getElementById('toastMsg');
  if(!toast){
    toast = document.createElement('div');
    toast.id = 'toastMsg';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ============================================
   CAROSELLO
   ============================================ */
const track = document.getElementById('carouselTrack');
const dotsWrap = document.getElementById('carouselDots');
const carouselEl = document.getElementById('carousel');
let slideIndex = 0;
let autoTimer = null;

function buildCarousel(){
  featured = products.filter(p => p.badge && !p.outOfStock).slice(0, 4);
  track.innerHTML = '';
  dotsWrap.innerHTML = '';
  slideIndex = 0;

  featured.forEach((p) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    const media = p.image ? `<img src="${p.image}" alt="${p.name}">` : p.icon;
    slide.innerHTML = `
      <div class="info">
        <span class="badge-tag ${p.badge}">${p.badge === 'offerta' ? 'Offerta' : 'Più Venduto'}</span>
        <h3>${p.name}</h3>
        <div class="price-row">
          <span class="price">€${p.price}</span>
          ${p.oldPrice ? `<span class="old-price">€${p.oldPrice}</span>` : ''}
        </div>
        <button data-id="${p.id}" class="carousel-add ripple-btn">Aggiungi al Carrello</button>
      </div>
      <div class="icon-big">${media}</div>
    `;
    track.appendChild(slide);
  });

  featured.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => { goToSlide(i); startAuto(); });
    dotsWrap.appendChild(dot);
  });

  track.style.transform = 'translateX(0)';
  startAuto();
}

function goToSlide(i){
  if(featured.length === 0) return;
  slideIndex = (i + featured.length) % featured.length;
  track.style.transform = `translateX(-${slideIndex * 100}%)`;
  document.querySelectorAll('.dot').forEach((d, idx) => d.classList.toggle('active', idx === slideIndex));
}

function startAuto(){
  if(featured.length <= 1) return;
  stopAuto();
  autoTimer = setInterval(() => goToSlide(slideIndex + 1), 4000);
}
function stopAuto(){
  if(autoTimer){ clearInterval(autoTimer); autoTimer = null; }
}

carouselEl.addEventListener('mouseenter', stopAuto);
carouselEl.addEventListener('mouseleave', startAuto);

let isDragging = false;
let dragStartX = 0;
let dragDeltaX = 0;

function dragStart(clientX){
  if(featured.length === 0) return;
  isDragging = true;
  dragStartX = clientX;
  dragDeltaX = 0;
  stopAuto();
  track.style.transition = 'none';
}
function dragMove(clientX){
  if(!isDragging) return;
  dragDeltaX = clientX - dragStartX;
  const percent = (dragDeltaX / carouselEl.offsetWidth) * 100;
  track.style.transform = `translateX(calc(-${slideIndex * 100}% + ${percent}%))`;
}
function dragEnd(){
  if(!isDragging) return;
  isDragging = false;
  track.style.transition = '';
  const threshold = carouselEl.offsetWidth * 0.15;
  if(dragDeltaX > threshold) goToSlide(slideIndex - 1);
  else if(dragDeltaX < -threshold) goToSlide(slideIndex + 1);
  else goToSlide(slideIndex);
  startAuto();
}

track.addEventListener('mousedown', e => { dragStart(e.clientX); e.preventDefault(); });
window.addEventListener('mousemove', e => dragMove(e.clientX));
window.addEventListener('mouseup', dragEnd);
track.addEventListener('touchstart', e => dragStart(e.touches[0].clientX), {passive:true});
track.addEventListener('touchmove', e => dragMove(e.touches[0].clientX), {passive:true});
track.addEventListener('touchend', dragEnd);

track.addEventListener('click', e => {
  const btn = e.target.closest('.carousel-add');
  if(btn){ addToCart(btn.dataset.id); return; }
  const iconBig = e.target.closest('.icon-big');
  if(iconBig){
    const slide = iconBig.closest('.slide');
    const addBtn = slide && slide.querySelector('.carousel-add');
    if(addBtn) openDetailModal(addBtn.dataset.id);
  }
});

/* ============================================
   TABS + PAGINAZIONE + GRIGLIA PRODOTTI
   ============================================ */
const grid = document.getElementById('productGrid');
const pagination = document.getElementById('pagination');

function renderGrid(){
  const filtered = products.filter(p => p.cat === currentCat);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if(currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  grid.innerHTML = '';
  if(pageItems.length === 0){
    grid.innerHTML = '<div class="no-results">Nessun prodotto in questa categoria.</div>';
  } else {
    pageItems.forEach(p => grid.appendChild(buildProductCard(p)));
  }

  pagination.innerHTML = '';
  if(totalPages > 1){
    for(let i = 1; i <= totalPages; i++){
      const btn = document.createElement('button');
      btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
      btn.textContent = i;
      btn.addEventListener('click', () => { currentPage = i; renderGrid(); window.scrollTo({top: document.getElementById('categorie').offsetTop - 80, behavior:'smooth'}); });
      pagination.appendChild(btn);
    }
  }
}

function buildProductCard(p){
  const card = document.createElement('div');
  card.className = 'prod-card';
  const imgs = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []);
  const media = imgs.length ? `<img src="${imgs[0]}" alt="${p.name}">` : (p.icon || '🧴');
  const outClass = p.outOfStock ? ' out-of-stock' : '';
  const lowStock = (!p.outOfStock && p.quantity !== null && p.quantity !== undefined && p.quantity > 0 && p.quantity <= 5);
  card.innerHTML = `
    <div class="prod-img${outClass}" data-id="${p.id}">
      ${p.badge && !p.outOfStock ? `<span class="mini-badge ${p.badge}">${p.badge === 'offerta' ? 'Offerta' : 'Top'}</span>` : ''}
      ${media}
    </div>
    <div class="prod-body">
      <h3>${p.name}</h3>
      <p class="desc">${p.desc || ''}</p>
      ${lowStock ? `<p class="low-stock">⚡ Rimangono solo ${p.quantity}!</p>` : ''}
      <div class="prod-row">
        <span class="prod-price">€${p.price}${p.oldPrice ? ` <span style="color:var(--muted);text-decoration:line-through;font-size:.8rem;">€${p.oldPrice}</span>` : ''}</span>
        <button class="add-btn ripple-btn${p.outOfStock ? ' disabled' : ''}" data-id="${p.id}" ${p.outOfStock ? 'disabled' : ''}>${p.outOfStock ? 'Esaurito' : 'Aggiungi'}</button>
      </div>
    </div>
  `;
  return card;
}

/* ============================================
   الأقسام (الكاتيجوريز) — ثابتة + أي قسم يضيفه الأدمن
   ============================================ */
const defaultCategories = [
  {key:'macchine', label:'Macchine di Pulizia', icon:'🛠️'},
  {key:'attrezzi', label:'Attrezzi di Pulizia', icon:'🧹'},
  {key:'liquidi', label:'Prodotti Liquidi', icon:'🧴'},
];
let allCategories = [...defaultCategories];
const tabsEl = document.getElementById('tabs');

function buildTabs(){
  tabsEl.innerHTML = '';
  allCategories.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (c.key === currentCat ? ' active' : '');
    btn.dataset.cat = c.key;
    btn.textContent = `${c.icon} ${c.label}`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = c.key;
      currentPage = 1;
      renderGrid();
    });
    tabsEl.appendChild(btn);
  });
}

function loadCategories(){
  if(typeof db === 'undefined' || !db){
    buildTabs();
    return;
  }
  db.collection('categories').onSnapshot(
    snapshot => {
      const extra = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      allCategories = [...defaultCategories, ...extra];
      buildTabs();
    },
    () => buildTabs()
  );
}
loadCategories();

grid.addEventListener('click', e => {
  const btn = e.target.closest('.add-btn');
  if(btn){ if(!btn.disabled) addToCart(btn.dataset.id); return; }
  const card = e.target.closest('.prod-card');
  if(card){
    const id = card.querySelector('.prod-img').dataset.id;
    openDetailModal(id);
  }
});

/* ============================================
   تحميل المنتجات من Firebase
   ============================================ */
function applyProducts(list){
  products = list;
  buildCarousel();
  renderGrid();
}

function loadProducts(){
  if(typeof db === 'undefined' || !db){
    console.warn('Firebase مش شغال — بيتعرض منتجات تجريبية بس.');
    applyProducts(defaultProducts);
    return;
  }
  db.collection('products').onSnapshot(
    snapshot => {
      if(snapshot.empty){
        applyProducts(defaultProducts);
      } else {
        const list = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        applyProducts(list);
      }
    },
    err => {
      console.error('خطأ في تحميل المنتجات من Firebase:', err);
      applyProducts(defaultProducts);
    }
  );
}
loadProducts();

/* ============================================
   SERVIZI
   ============================================ */
const servGrid = document.getElementById('servGrid');
services.forEach(s => {
  const card = document.createElement('div');
  card.className = 'serv-card';
  card.innerHTML = `
    <span class="icon">${s.icon}</span>
    <h3>${s.name}</h3>
    <p>${s.desc}</p>
    <span class="price-tag">${s.priceLabel}</span>
    <button class="prenota-btn ripple-btn" data-service="${s.name}">Prenota su WhatsApp</button>
  `;
  servGrid.appendChild(card);
});

servGrid.addEventListener('click', e => {
  const btn = e.target.closest('.prenota-btn');
  if(!btn) return;
  const service = btn.dataset.service;
  const message = `Ciao ${STORE_NAME}! 👋\nVorrei prenotare il seguente servizio:\n\n*${service}*\n\nPotete darmi maggiori informazioni e disponibilità? Grazie!`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
});

/* ============================================
   RICERCA
   ============================================ */
const searchToggle = document.getElementById('searchToggle');
const searchPanel = document.getElementById('searchPanel');
const searchInput = document.getElementById('searchInput');
const searchClose = document.getElementById('searchClose');
const searchResults = document.getElementById('searchResults');

searchToggle.addEventListener('click', () => {
  searchPanel.classList.add('open');
  searchInput.focus();
});
searchClose.addEventListener('click', () => searchPanel.classList.remove('open'));

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if(!q){ searchResults.innerHTML = ''; return; }
  const matches = products.filter(p =>
    p.name.toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q)
  );
  searchResults.innerHTML = '';
  if(matches.length === 0){
    searchResults.innerHTML = '<div class="no-results">Nessun risultato trovato.</div>';
    return;
  }
  matches.forEach(p => searchResults.appendChild(buildProductCard(p)));
});

searchResults.addEventListener('click', e => {
  const btn = e.target.closest('.add-btn');
  if(btn){ if(!btn.disabled) addToCart(btn.dataset.id); return; }
  const card = e.target.closest('.prod-card');
  if(card){
    const id = card.querySelector('.prod-img').dataset.id;
    openDetailModal(id);
  }
});

/* ============================================
   CARRELLO — مبيفتحش لوحده، بس بيوري رسالة تأكيد
   ============================================ */
const cartBtn = document.getElementById('cartBtn');
const cartPanel = document.getElementById('cartPanel');
const overlay = document.getElementById('overlay');
const closeCart = document.getElementById('closeCart');
const cartItemsEl = document.getElementById('cartItems');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartTotalEl = document.getElementById('cartTotal');
const cartCountEl = document.getElementById('cartCount');
const checkoutBtn = document.getElementById('checkoutBtn');

function addToCart(id){
  const product = products.find(p => sameId(p.id, id));
  if(!product || product.outOfStock) return;
  const existing = cart.find(item => sameId(item.id, id));
  if(existing){ existing.qty += 1; } else { cart.push({...product, qty:1}); }
  updateCartUI();
  showToast(`${product.name} — Aggiunto al carrello ✓`);
}

function openCart(){ cartPanel.classList.add('open'); overlay.classList.add('open'); }
function shutCart(){ cartPanel.classList.remove('open'); overlay.classList.remove('open'); }
cartBtn.addEventListener('click', openCart);
closeCart.addEventListener('click', shutCart);
overlay.addEventListener('click', shutCart);

function updateCartUI(){
  const totalQty = cart.reduce((s,i) => s + i.qty, 0);
  cartCountEl.textContent = totalQty;

  if(cart.length === 0){
    cartItemsEl.innerHTML = '<div class="cart-empty">Il carrello è vuoto.</div>';
  } else {
    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div>
          <div class="name">${item.icon || '🧴'} ${item.name}</div>
          <div class="sub">€${item.price} x ${item.qty} = €${item.price * item.qty}</div>
          <div class="qty-ctrl">
            <button class="qty-minus" data-id="${item.id}">−</button>
            <span>${item.qty}</span>
            <button class="qty-plus" data-id="${item.id}">+</button>
          </div>
        </div>
        <button data-id="${item.id}" class="remove-btn">Rimuovi</button>
      </div>
    `).join('');
  }

  const total = cart.reduce((s,i) => s + i.qty * i.price, 0);
  cartSubtotalEl.textContent = '€' + total;
  cartTotalEl.textContent = '€' + total;
}

cartItemsEl.addEventListener('click', e => {
  const id = e.target.dataset.id;
  if(!id) return;
  if(e.target.classList.contains('remove-btn')){
    cart = cart.filter(item => !sameId(item.id, id));
  } else if(e.target.classList.contains('qty-plus')){
    const item = cart.find(i => sameId(i.id, id));
    if(item) item.qty += 1;
  } else if(e.target.classList.contains('qty-minus')){
    const item = cart.find(i => sameId(i.id, id));
    if(item){
      item.qty -= 1;
      if(item.qty <= 0) cart = cart.filter(i => !sameId(i.id, id));
    }
  }
  updateCartUI();
});

checkoutBtn.addEventListener('click', () => {
  if(cart.length === 0){
    alert('Il carrello è vuoto. Aggiungi almeno un prodotto prima di confermare.');
    return;
  }
  let message = `Ciao ${STORE_NAME}! 👋\nVorrei confermare il seguente ordine:\n\n`;
  cart.forEach(item => {
    message += `• ${item.name} — Qtà: ${item.qty} x €${item.price} = €${item.qty * item.price}\n`;
  });
  const total = cart.reduce((s,i) => s + i.qty * i.price, 0);
  message += `\n*Totale: €${total}*\n\nAttendo conferma disponibilità. Grazie!`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
});

document.getElementById('whatsappFab').href =
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Ciao ' + STORE_NAME + '! Vorrei maggiori informazioni.')}`;

/* ============================================
   قائمة الموبايل (الهامبرغر ☰) — بتتحط تحت الهيدر أيًا كان مكانك
   ============================================ */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileNav = document.getElementById('mobileNav');
const headerEl = document.querySelector('header');

function positionMobileNav(){
  mobileNav.style.top = headerEl.offsetHeight + 'px';
}
positionMobileNav();
window.addEventListener('resize', positionMobileNav);

hamburgerBtn.addEventListener('click', () => {
  positionMobileNav();
  hamburgerBtn.classList.toggle('open');
  mobileNav.classList.toggle('open');
});

mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburgerBtn.classList.remove('open');
    mobileNav.classList.remove('open');
  });
});

/* ============================================
   نافذة تفاصيل المنتج
   ============================================ */
const detailOverlay = document.getElementById('detailOverlay');
const detailModal = document.getElementById('detailModal');
const detailClose = document.getElementById('detailClose');
const detailImg = document.getElementById('detailImg');
const detailPrev = document.getElementById('detailPrev');
const detailNext = document.getElementById('detailNext');
const detailDots = document.getElementById('detailDots');
const detailBadge = document.getElementById('detailBadge');
const detailName = document.getElementById('detailName');
const detailDesc = document.getElementById('detailDesc');
const detailPrice = document.getElementById('detailPrice');
const detailAddBtn = document.getElementById('detailAddBtn');

let detailProduct = null;
let detailImgIndex = 0;

function openDetailModal(id){
  const product = products.find(p => sameId(p.id, id));
  if(!product) return;
  detailProduct = product;
  detailImgIndex = 0;
  renderDetailImage();

  detailName.textContent = product.name;
  detailDesc.textContent = product.desc || '';
  const existingLowStock = document.getElementById('detailLowStock');
  if(existingLowStock) existingLowStock.remove();
  const lowStockNow = (!product.outOfStock && product.quantity !== null && product.quantity !== undefined && product.quantity > 0 && product.quantity <= 5);
  if(lowStockNow){
    detailDesc.insertAdjacentHTML('afterend', `<p class="low-stock" id="detailLowStock">⚡ Rimangono solo ${product.quantity}!</p>`);
  }
  detailPrice.innerHTML = `€${product.price}` + (product.oldPrice ? ` <span style="color:var(--muted);text-decoration:line-through;font-size:1rem;">€${product.oldPrice}</span>` : '');

  if(product.badge && !product.outOfStock){
    detailBadge.style.display = 'inline-block';
    detailBadge.className = 'mini-badge ' + product.badge;
    detailBadge.textContent = product.badge === 'offerta' ? 'Offerta' : 'Più Venduto';
  } else {
    detailBadge.style.display = 'none';
  }

  if(product.outOfStock){
    detailAddBtn.textContent = 'Esaurito';
    detailAddBtn.disabled = true;
    detailAddBtn.classList.add('disabled');
  } else {
    detailAddBtn.textContent = 'Aggiungi al Carrello';
    detailAddBtn.disabled = false;
    detailAddBtn.classList.remove('disabled');
  }

  detailOverlay.classList.add('open');
  detailModal.classList.add('open');
}

function renderDetailImage(){
  const imgs = (detailProduct.images && detailProduct.images.length) ? detailProduct.images : (detailProduct.image ? [detailProduct.image] : []);
  detailImg.innerHTML = imgs.length ? `<img src="${imgs[detailImgIndex]}" alt="${detailProduct.name}">` : (detailProduct.icon || '🧴');

  detailDots.innerHTML = '';
  detailPrev.style.display = imgs.length > 1 ? 'flex' : 'none';
  detailNext.style.display = imgs.length > 1 ? 'flex' : 'none';
  if(imgs.length > 1){
    imgs.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === detailImgIndex ? ' active' : '');
      dot.addEventListener('click', () => { detailImgIndex = i; renderDetailImage(); });
      detailDots.appendChild(dot);
    });
  }
}

function closeDetailModal(){
  detailOverlay.classList.remove('open');
  detailModal.classList.remove('open');
}

detailClose.addEventListener('click', closeDetailModal);
detailOverlay.addEventListener('click', closeDetailModal);

detailPrev.addEventListener('click', () => {
  const imgs = (detailProduct.images && detailProduct.images.length) ? detailProduct.images : [detailProduct.image];
  detailImgIndex = (detailImgIndex - 1 + imgs.length) % imgs.length;
  renderDetailImage();
});
detailNext.addEventListener('click', () => {
  const imgs = (detailProduct.images && detailProduct.images.length) ? detailProduct.images : [detailProduct.image];
  detailImgIndex = (detailImgIndex + 1) % imgs.length;
  renderDetailImage();
});

detailAddBtn.addEventListener('click', () => {
  if(!detailProduct || detailProduct.outOfStock) return;
  addToCart(detailProduct.id);
});

/* ============================================
   تأثير Ripple عام
   ============================================ */
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
