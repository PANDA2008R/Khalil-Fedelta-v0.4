/* ============================================
   إعدادات عامة — WhatsApp والشركة
   ============================================ */
const WHATSAPP_NUMBER = "393934020090"; // بدون + وبدون مسافات
const STORE_NAME = "Khalil Fedeltà";

/* ============================================
   بيانات المنتجات
   عايز تضيف منتج جديد؟ انسخ سطر وغيّر البيانات:
   {id: رقم_فريد, name:"الاسم", cat:"macchine|attrezzi|liquidi",
    price: السعر, desc:"الوصف", icon:"🛠️", badge:"offerta"|"bestseller"|null}
   ============================================ */
const products = [
  // --- Macchine di Pulizia ---
  {id:1, name:"Lavapavimenti Professionale", cat:"macchine", price:320, oldPrice:null, desc:"Lava e asciuga pavimenti in un solo passaggio, uso professionale.", icon:"🧽", badge:"bestseller"},
  {id:2, name:"Aspirapolvere Industriale", cat:"macchine", price:250, oldPrice:null, desc:"Potenza elevata per grandi ambienti e cantieri.", icon:"🔌", badge:null},
  {id:3, name:"Lucidatrice Pavimenti", cat:"macchine", price:280, oldPrice:320, desc:"Risultato lucido professionale su marmo e gres.", icon:"✨", badge:"offerta"},
  {id:4, name:"Idropulitrice Alta Pressione", cat:"macchine", price:190, oldPrice:null, desc:"Ideale per esterni, cortili e facciate.", icon:"💦", badge:null},
  {id:5, name:"Monospazzola Professionale", cat:"macchine", price:410, oldPrice:null, desc:"Per la manutenzione di grandi superfici commerciali.", icon:"⚙️", badge:null},

  // --- Attrezzi di Pulizia ---
  {id:6, name:"Scopa Professionale", cat:"attrezzi", price:15, oldPrice:null, desc:"Setole resistenti per interni ed esterni.", icon:"🧹", badge:null},
  {id:7, name:"Mocio con Secchio e Strizzatore", cat:"attrezzi", price:28, oldPrice:null, desc:"Sistema completo con panno in microfibra lavabile.", icon:"🪣", badge:"bestseller"},
  {id:8, name:"Paletta e Scopino", cat:"attrezzi", price:8, oldPrice:null, desc:"Set pratico per la pulizia quotidiana.", icon:"🧺", badge:null},
  {id:9, name:"Spazzolone per Esterni", cat:"attrezzi", price:19, oldPrice:24, desc:"Manico lungo, ideale per cortili e garage.", icon:"🧽", badge:"offerta"},
  {id:10, name:"Set Panni Microfibra (x10)", cat:"attrezzi", price:12, oldPrice:null, desc:"Panni professionali per vetri e superfici delicate.", icon:"🧻", badge:null},

  // --- Prodotti Liquidi ---
  {id:11, name:"Detersivo Multiuso", cat:"liquidi", price:6, oldPrice:null, desc:"Sgrassatore professionale per ogni superficie.", icon:"🧴", badge:null},
  {id:12, name:"Ammoniaca Concentrata", cat:"liquidi", price:5, oldPrice:null, desc:"Azione sgrassante rapida ed efficace.", icon:"🧪", badge:null},
  {id:13, name:"Lucido Vetri", cat:"liquidi", price:7, oldPrice:null, desc:"Pulizia senza aloni per vetri e specchi.", icon:"🪟", badge:"bestseller"},
  {id:14, name:"Sgrassatore Professionale", cat:"liquidi", price:9, oldPrice:12, desc:"Formula concentrata per cucine e officine.", icon:"🧴", badge:"offerta"},
  {id:15, name:"Detergente Pavimenti", cat:"liquidi", price:8, oldPrice:null, desc:"Profumazione lunga durata, azione antibatterica.", icon:"🧴", badge:null},
];

/* الخدمات المنزلية */
const services = [
  {name:"Pulizia Casa", icon:"🏠", desc:"Pulizia completa per appartamenti e ville.", priceLabel:"A partire da €40"},
  {name:"Pulizia Uffici", icon:"🏢", desc:"Servizi professionali per uffici e negozi.", priceLabel:"A partire da €60"},
  {name:"Riparazione Macchine", icon:"🔧", desc:"Riparazione e manutenzione macchine per la pulizia.", priceLabel:"Preventivo Gratuito"},
  {name:"Consegna a Domicilio", icon:"🚚", desc:"Consegna rapida in tutta la zona di Milano.", priceLabel:"Gratuita sopra €50"},
];

/* Prodotti in evidenza per il carosello (offerte / più venduti) */
const featured = products.filter(p => p.badge).slice(0, 4);

let cart = [];
let currentCat = "macchine";
let currentPage = 1;
const PAGE_SIZE = 6;

/* ============================================
   CAROSELLO — cambia ogni 2 secondi
   ============================================ */
const track = document.getElementById('carouselTrack');
const dotsWrap = document.getElementById('carouselDots');
let slideIndex = 0;

featured.forEach((p, i) => {
  const slide = document.createElement('div');
  slide.className = 'slide';
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
    <div class="icon-big">${p.icon}</div>
  `;
  track.appendChild(slide);

  const dot = document.createElement('div');
  dot.className = 'dot' + (i === 0 ? ' active' : '');
  dot.addEventListener('click', () => goToSlide(i));
  dotsWrap.appendChild(dot);
});

function goToSlide(i){
  slideIndex = i;
  track.style.transform = `translateX(-${i * 100}%)`;
  document.querySelectorAll('.dot').forEach((d, idx) => d.classList.toggle('active', idx === i));
}

if(featured.length > 1){
  setInterval(() => {
    slideIndex = (slideIndex + 1) % featured.length;
    goToSlide(slideIndex);
  }, 4000);
}

track.addEventListener('click', e => {
  const btn = e.target.closest('.carousel-add');
  if(!btn) return;
  addToCart(parseInt(btn.dataset.id));
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
  card.innerHTML = `
    <div class="prod-img">
      ${p.badge ? `<span class="mini-badge ${p.badge}">${p.badge === 'offerta' ? 'Offerta' : 'Top'}</span>` : ''}
      ${p.icon}
    </div>
    <div class="prod-body">
      <h3>${p.name}</h3>
      <p class="desc">${p.desc}</p>
      <div class="prod-row">
        <span class="prod-price">€${p.price}${p.oldPrice ? ` <span style="color:var(--muted);text-decoration:line-through;font-size:.8rem;">€${p.oldPrice}</span>` : ''}</span>
        <button class="add-btn ripple-btn" data-id="${p.id}">Aggiungi</button>
      </div>
    </div>
  `;
  return card;
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCat = btn.dataset.cat;
    currentPage = 1;
    renderGrid();
  });
});

grid.addEventListener('click', e => {
  const btn = e.target.closest('.add-btn');
  if(!btn) return;
  addToCart(parseInt(btn.dataset.id));
  btn.classList.add('added');
  btn.textContent = 'Aggiunto ✓';
  setTimeout(() => { btn.classList.remove('added'); btn.textContent = 'Aggiungi'; }, 1200);
});

renderGrid();

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
    p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
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
  if(!btn) return;
  addToCart(parseInt(btn.dataset.id));
  btn.classList.add('added');
  btn.textContent = 'Aggiunto ✓';
  setTimeout(() => { btn.classList.remove('added'); btn.textContent = 'Aggiungi'; }, 1200);
});

/* ============================================
   CARRELLO
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
  const product = products.find(p => p.id === id);
  if(!product) return;
  const existing = cart.find(item => item.id === id);
  if(existing){ existing.qty += 1; } else { cart.push({...product, qty:1}); }
  updateCartUI();
  openCart();
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
          <div class="name">${item.icon} ${item.name}</div>
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
  const id = parseInt(e.target.dataset.id);
  if(!id) return;
  if(e.target.classList.contains('remove-btn')){
    cart = cart.filter(item => item.id !== id);
  } else if(e.target.classList.contains('qty-plus')){
    const item = cart.find(i => i.id === id);
    if(item) item.qty += 1;
  } else if(e.target.classList.contains('qty-minus')){
    const item = cart.find(i => i.id === id);
    if(item){
      item.qty -= 1;
      if(item.qty <= 0) cart = cart.filter(i => i.id !== id);
    }
  }
  updateCartUI();
});

/* ============================================
   CONFERMA ORDINE → WHATSAPP (come una ricevuta)
   ============================================ */
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

/* Link generico del pulsante WhatsApp flottante */
document.getElementById('whatsappFab').href =
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Ciao ' + STORE_NAME + '! Vorrei maggiori informazioni.')}`;

/* ============================================
   تأثير Ripple عام — يشتغل على أي زرار عليه class="ripple-btn"
   حتى لو اتضاف بعد كده ديناميكيًا
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
