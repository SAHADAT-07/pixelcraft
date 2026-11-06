// Pixel Craft - Admin Dashboard JavaScript

let currentCMSData = null;
let activeTabName = 'overview';
let isSplitViewActive = false;
let liveSyncDebounceTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  
  // Listen for storage changes across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'pixelcraft_cms_config' || e.key === 'pixelcraft_messages' || e.key === 'pixelcraft_orders') {
      refreshData();
    }
  });

  // Listen for local custom events
  window.addEventListener('orders-updated', () => {
    renderOrdersTable();
    updateOverviewStats();
  });

  window.addEventListener('messages-updated', () => {
    renderMessagesTable();
    updateOverviewStats();
  });

  // Listen for Firebase status changes
  window.addEventListener('firebase-status-changed', (e) => {
    updateFirebaseStatusUI(e.detail);
  });
});

// ==================== 1. AUTHENTICATION ====================
function initAuth() {
  const isAuth = checkAdminAuth();
  const loginContainer = document.getElementById('login-container');
  const dashboardContainer = document.getElementById('dashboard-container');

  if (isAuth) {
    loginContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    loadDashboard();
  } else {
    loginContainer.classList.remove('hidden');
    dashboardContainer.classList.add('hidden');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('login-username').value.trim();
  const passwordInput = document.getElementById('login-password').value;
  const errorBox = document.getElementById('login-error');

  if (loginAdmin(usernameInput, passwordInput)) {
    errorBox.classList.add('hidden');
    initAuth();
    showAdminToast('Signed in successfully! Welcome back.');
  } else {
    errorBox.classList.remove('hidden');
    document.getElementById('login-error-text').textContent = 'Invalid credentials. Default is admin / admin123';
  }
}

function handleLogout() {
  logoutAdmin();
  initAuth();
  showAdminToast('Logged out of Admin Panel.', true);
}

function fillDemoCreds() {
  const creds = getAdminCredentials();
  document.getElementById('login-username').value = creds.username;
  document.getElementById('login-password').value = creds.password;
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ==================== 2. TABS & NAVIGATION ====================
function switchTab(tabId) {
  activeTabName = tabId;
  
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  
  // Show target tab
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.remove('hidden');

  // Update tab button styles
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Close mobile sidebar if open
  const sidebar = document.getElementById('admin-sidebar');
  if (window.innerWidth < 1024 && !sidebar.classList.contains('hidden')) {
    sidebar.classList.add('hidden');
  }

  // Refresh tab-specific data
  if (tabId === 'overview') updateOverviewStats();
  if (tabId === 'orders') renderOrdersTable();
  if (tabId === 'inbox') renderMessagesTable();
  if (tabId === 'pricing') renderPricingPlansList();
  if (tabId === 'services') renderServicesList();
  if (tabId === 'about') renderAboutFeaturesList();
  if (tabId === 'general') updateLogoPreview();
  if (tabId === 'preview') refreshTabPreview();
  if (tabId === 'firebase') loadFirebaseSettings();
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('admin-sidebar');
  sidebar.classList.toggle('hidden');
}

// ==================== 3. SPLIT-SCREEN LIVE PREVIEW ====================
function toggleSplitView() {
  isSplitViewActive = !isSplitViewActive;
  const splitPane = document.getElementById('split-preview-pane');
  const btnLabel = document.getElementById('split-btn-label');
  const toggleBtn = document.getElementById('toggle-split-btn');

  if (isSplitViewActive) {
    splitPane.classList.remove('hidden');
    btnLabel.textContent = 'Full View';
    toggleBtn.classList.add('bg-blue-600', 'text-white', 'border-blue-500');
    toggleBtn.classList.remove('bg-slate-800/90', 'text-slate-200', 'border-slate-700');
    refreshSplitPreview();
  } else {
    splitPane.classList.add('hidden');
    btnLabel.textContent = 'Split Preview';
    toggleBtn.classList.remove('bg-blue-600', 'text-white', 'border-blue-500');
    toggleBtn.classList.add('bg-slate-800/90', 'text-slate-200', 'border-slate-700');
  }
}

function setSplitDevice(device) {
  const wrapper = document.getElementById('split-frame-wrapper');
  if (!wrapper) return;

  const btnDesktop = document.getElementById('split-dev-desktop');
  const btnTablet = document.getElementById('split-dev-tablet');
  const btnMobile = document.getElementById('split-dev-mobile');

  [btnDesktop, btnTablet, btnMobile].forEach(btn => btn && btn.classList.remove('active', 'text-white'));

  if (device === 'desktop') {
    wrapper.style.maxWidth = '100%';
    btnDesktop.classList.add('active', 'text-white');
  } else if (device === 'tablet') {
    wrapper.style.maxWidth = '768px';
    btnTablet.classList.add('active', 'text-white');
  } else if (device === 'mobile') {
    wrapper.style.maxWidth = '375px';
    btnMobile.classList.add('active', 'text-white');
  }
}

function refreshSplitPreview() {
  const iframe = document.getElementById('split-preview-iframe');
  if (iframe) {
    iframe.src = 'index.html?t=' + Date.now();
  }
}

function setTabPreviewDevice(device) {
  const wrapper = document.getElementById('tab-preview-frame-wrapper');
  if (!wrapper) return;

  const btnDesktop = document.getElementById('tab-dev-desktop');
  const btnTablet = document.getElementById('tab-dev-tablet');
  const btnMobile = document.getElementById('tab-dev-mobile');

  [btnDesktop, btnTablet, btnMobile].forEach(btn => btn && btn.classList.remove('active', 'text-white'));

  if (device === 'desktop') {
    wrapper.style.maxWidth = '100%';
    btnDesktop.classList.add('active', 'text-white');
  } else if (device === 'tablet') {
    wrapper.style.maxWidth = '768px';
    btnTablet.classList.add('active', 'text-white');
  } else if (device === 'mobile') {
    wrapper.style.maxWidth = '375px';
    btnMobile.classList.add('active', 'text-white');
  }
}

function refreshTabPreview() {
  const iframe = document.getElementById('tab-preview-iframe');
  if (iframe) {
    iframe.src = 'index.html?t=' + Date.now();
  }
}

// Live typing feedback debouncer
function handleLiveInputChange() {
  clearTimeout(liveSyncDebounceTimer);
  liveSyncDebounceTimer = setTimeout(() => {
    syncLivePreview();
  }, 250);
}

// Push live preview updates to iframes without full reload
function syncLivePreview() {
  // Collect latest draft values from inputs
  collectCurrentDraftData();
  
  // Post message to iframes for instant zero-latency UI update
  const payload = { type: 'cms-preview-update', data: currentCMSData };
  
  const splitIframe = document.getElementById('split-preview-iframe');
  if (splitIframe && splitIframe.contentWindow) {
    try {
      splitIframe.contentWindow.postMessage(payload, '*');
    } catch (e) {}
  }

  const tabIframe = document.getElementById('tab-preview-iframe');
  if (tabIframe && tabIframe.contentWindow) {
    try {
      tabIframe.contentWindow.postMessage(payload, '*');
    } catch (e) {}
  }
}

function collectCurrentDraftData() {
  if (!currentCMSData) currentCMSData = getCMSData();

  // General & Brand
  const siteName = document.getElementById('gen-site-name');
  if (siteName) currentCMSData.general.siteName = siteName.value.trim();
  const logoText = document.getElementById('gen-logo-text');
  if (logoText) currentCMSData.general.logoText = logoText.value.trim();
  const browserTitle = document.getElementById('gen-browser-title');
  if (browserTitle) currentCMSData.general.browserTitle = browserTitle.value.trim();
  const tagline = document.getElementById('gen-tagline');
  if (tagline) currentCMSData.general.tagline = tagline.value.trim();

  // Hero
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) currentCMSData.hero.title = heroTitle.value.trim();
  const heroSubtitle = document.getElementById('hero-subtitle');
  if (heroSubtitle) currentCMSData.hero.subtitle = heroSubtitle.value.trim();
  const heroPrimaryBtn = document.getElementById('hero-primary-btn');
  if (heroPrimaryBtn) currentCMSData.hero.primaryBtnText = heroPrimaryBtn.value.trim();
  const heroPrimaryLink = document.getElementById('hero-primary-link');
  if (heroPrimaryLink) currentCMSData.hero.primaryBtnLink = heroPrimaryLink.value.trim();
  const heroVideoBtn = document.getElementById('hero-video-btn');
  if (heroVideoBtn) currentCMSData.hero.videoBtnText = heroVideoBtn.value.trim();
  const heroVideoUrl = document.getElementById('hero-video-url');
  if (heroVideoUrl) currentCMSData.hero.videoUrl = heroVideoUrl.value.trim();

  // Ordering
  if (!currentCMSData.ordering) currentCMSData.ordering = {};
  const ordEnabled = document.getElementById('ord-enabled');
  if (ordEnabled) currentCMSData.ordering.enabled = ordEnabled.checked;
  const modeRadio = document.querySelector('input[name="ordering-mode"]:checked');
  if (modeRadio) currentCMSData.ordering.mode = modeRadio.value;
  const currency = document.getElementById('ord-currency');
  if (currency) currentCMSData.ordering.currency = currency.value.trim();
  const defCta = document.getElementById('ord-default-cta');
  if (defCta) currentCMSData.ordering.defaultCtaText = defCta.value.trim();
  const reqPhone = document.getElementById('ord-require-phone');
  if (reqPhone) currentCMSData.ordering.requirePhone = reqPhone.checked;
  const autoConf = document.getElementById('ord-auto-confirm');
  if (autoConf) currentCMSData.ordering.autoConfirm = autoConf.checked;
  const confTitle = document.getElementById('ord-confirm-title');
  if (confTitle) currentCMSData.ordering.confirmTitle = confTitle.value.trim();
  const confMsg = document.getElementById('ord-confirm-message');
  if (confMsg) currentCMSData.ordering.confirmMessage = confMsg.value.trim();
  const waNum = document.getElementById('ord-wa-number');
  if (waNum) currentCMSData.ordering.whatsappNumber = waNum.value.trim();
  const waMsg = document.getElementById('ord-wa-message');
  if (waMsg) currentCMSData.ordering.whatsappMessage = waMsg.value.trim();

  // Update top brand title
  const brandTitle = document.getElementById('header-brand-title');
  if (brandTitle) brandTitle.textContent = currentCMSData.general.siteName || 'Pixel Craft';
}

// ==================== 4. DATA POPULATION & REFRESH ====================
function refreshData() {
  currentCMSData = getCMSData();
  populateAllForms();
  updateOverviewStats();
  renderOrdersTable();
  renderMessagesTable();
}

function loadDashboard() {
  currentCMSData = getCMSData();
  populateAllForms();
  updateOverviewStats();
  renderOrdersTable();
  renderMessagesTable();
  renderPricingPlansList();
  renderServicesList();
  renderAboutFeaturesList();
  loadFirebaseSettings();
}

function populateAllForms() {
  if (!currentCMSData) return;

  // Header Brand & Stats
  const siteName = currentCMSData.general.siteName || 'Pixel Craft';
  const headerBrand = document.getElementById('header-brand-title');
  if (headerBrand) headerBrand.textContent = siteName;

  // 1. General & Branding
  const gen = currentCMSData.general || {};
  document.getElementById('gen-site-name').value = gen.siteName || '';
  document.getElementById('gen-logo-text').value = gen.logoText || '';
  document.getElementById('gen-browser-title').value = gen.browserTitle || '';
  document.getElementById('gen-tagline').value = gen.tagline || '';

  // Logo Settings
  const logoType = gen.logoType || 'text';
  const logoRadio = document.querySelector(`input[name="logo-type-radio"][value="${logoType}"]`);
  if (logoRadio) logoRadio.checked = true;

  document.getElementById('gen-logo-image-url').value = gen.logoImage || '';
  const heightVal = parseInt(gen.logoHeight, 10) || 36;
  document.getElementById('gen-logo-height').value = heightVal;
  document.getElementById('gen-logo-height-val').textContent = `${heightVal}px`;
  updateLogoPreview();

  // 2. Hero Section
  const h = currentCMSData.hero || {};
  document.getElementById('hero-title').value = h.title || '';
  document.getElementById('hero-subtitle').value = h.subtitle || '';
  document.getElementById('hero-primary-btn').value = h.primaryBtnText || '';
  document.getElementById('hero-primary-link').value = h.primaryBtnLink || '#contact';
  document.getElementById('hero-video-btn').value = h.videoBtnText || '';
  document.getElementById('hero-video-url').value = h.videoUrl || '';

  // 3. About Section
  const a = currentCMSData.about || {};
  document.getElementById('about-title').value = a.title || 'About Us';
  document.getElementById('about-image-url').value = a.imageUrl || '';
  updateAboutPreview(a.imageUrl);

  // 4. Ordering & Order Confirmation Settings
  const ord = currentCMSData.ordering || {};
  document.getElementById('ord-enabled').checked = ord.enabled !== false;
  
  const modeVal = ord.mode || 'modal';
  const modeRadio = document.querySelector(`input[name="ordering-mode"][value="${modeVal}"]`);
  if (modeRadio) modeRadio.checked = true;

  document.getElementById('ord-currency').value = ord.currency || '$';
  document.getElementById('ord-default-cta').value = ord.defaultCtaText || 'Order Now';
  document.getElementById('ord-require-phone').checked = ord.requirePhone !== false;
  document.getElementById('ord-auto-confirm').checked = ord.autoConfirm !== false;
  document.getElementById('ord-confirm-title').value = ord.confirmTitle || 'Order Confirmed! Thank You';
  document.getElementById('ord-confirm-message').value = ord.confirmMessage || 'Your order has been received successfully. Our team will contact you within 2-4 hours to finalize your project setup.';
  document.getElementById('ord-wa-number').value = ord.whatsappNumber || '';
  document.getElementById('ord-wa-message').value = ord.whatsappMessage || 'Hi Pixel Craft! I placed an order for the {plan} plan ({currency}{price}{period}). My Order ID is {orderId}.';

  // 5. Contact & Footer
  const c = currentCMSData.contact || {};
  document.getElementById('contact-phone').value = c.phone || '';
  document.getElementById('contact-email').value = c.email || '';
  document.getElementById('contact-address').value = c.address || '';

  const f = currentCMSData.footer || {};
  document.getElementById('footer-copyright').value = f.copyright || '';

  const s = f.socials || {};
  document.getElementById('social-instagram').value = s.instagram || '';
  document.getElementById('social-twitter').value = s.twitter || '';
  document.getElementById('social-facebook').value = s.facebook || '';
  document.getElementById('social-youtube').value = s.youtube || '';

  // 6. Admin Security
  const creds = getAdminCredentials();
  document.getElementById('sec-username').value = creds.username;
  document.getElementById('sec-password').value = creds.password;
}

// ==================== 5. LOGO CUSTOMIZATION LOGIC ====================
function setLogoType(type) {
  if (!currentCMSData) currentCMSData = getCMSData();
  currentCMSData.general.logoType = type;
  updateLogoPreview();
  handleLiveInputChange();
}

function handleLogoFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please upload a valid image file (PNG, SVG, JPG, WebP).');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    document.getElementById('gen-logo-image-url').value = dataUrl;
    if (!currentCMSData) currentCMSData = getCMSData();
    currentCMSData.general.logoImage = dataUrl;
    
    // Auto-switch to "both" or "image" if currently "text"
    if (currentCMSData.general.logoType === 'text') {
      currentCMSData.general.logoType = 'both';
      const bothRadio = document.querySelector('input[name="logo-type-radio"][value="both"]');
      if (bothRadio) bothRadio.checked = true;
    }

    updateLogoPreview();
    handleLiveInputChange();
    showAdminToast('Logo image uploaded successfully! Click "Save Brand & Logo" to commit.');
  };
  reader.readAsDataURL(file);
}

function handleLogoUrlInput(url) {
  if (!currentCMSData) currentCMSData = getCMSData();
  currentCMSData.general.logoImage = url.trim();
  updateLogoPreview();
  handleLiveInputChange();
}

function handleLogoHeightChange(height) {
  document.getElementById('gen-logo-height-val').textContent = `${height}px`;
  if (!currentCMSData) currentCMSData = getCMSData();
  currentCMSData.general.logoHeight = parseInt(height, 10);
  updateLogoPreview();
  handleLiveInputChange();
}

function clearLogoImage() {
  document.getElementById('gen-logo-image-url').value = '';
  document.getElementById('gen-logo-file-input').value = '';
  if (!currentCMSData) currentCMSData = getCMSData();
  currentCMSData.general.logoImage = '';
  updateLogoPreview();
  handleLiveInputChange();
  showAdminToast('Logo image removed.');
}

function updateLogoPreview() {
  const gen = (currentCMSData && currentCMSData.general) ? currentCMSData.general : {};
  const logoType = gen.logoType || 'text';
  const logoImage = gen.logoImage || document.getElementById('gen-logo-image-url').value.trim();
  const logoText = gen.logoText || document.getElementById('gen-logo-text').value.trim() || 'Pixel Craft';
  const logoHeight = parseInt(gen.logoHeight, 10) || 36;

  const previewImg = document.getElementById('preview-logo-img');
  const previewText = document.getElementById('preview-logo-text');

  if (previewImg) {
    if ((logoType === 'image' || logoType === 'both') && logoImage) {
      previewImg.src = logoImage;
      previewImg.style.height = `${logoHeight}px`;
      previewImg.classList.remove('hidden');
    } else {
      previewImg.classList.add('hidden');
    }
  }

  if (previewText) {
    if (logoType === 'image' && logoImage) {
      previewText.classList.add('hidden');
    } else {
      previewText.textContent = logoText;
      previewText.classList.remove('hidden');
    }
  }
}

// ==================== 6. ORDERING & ORDER CONFIRMATION SETTINGS ====================
function saveOrderingSettings() {
  collectCurrentDraftData();
  saveCMSData(currentCMSData);
  syncLivePreview();
  showAdminToast('Ordering & checkout settings saved successfully!');
}

// ==================== 7. CUSTOMER ORDERS MANAGEMENT ====================
function renderOrdersTable() {
  const container = document.getElementById('orders-table-container');
  if (!container) return;

  const orders = getOrders();
  const filterEl = document.getElementById('orders-filter-status');
  const currentFilter = filterEl ? filterEl.value : 'all';

  // Calculate order metrics
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter(o => o.status === 'Confirmed').length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0);

  // Update order stats badges
  const statTotal = document.getElementById('order-stat-total');
  if (statTotal) statTotal.textContent = totalOrders;
  const statConf = document.getElementById('order-stat-confirmed');
  if (statConf) statConf.textContent = confirmedOrders;
  const statPend = document.getElementById('order-stat-pending');
  if (statPend) statPend.textContent = pendingOrders;
  const statRev = document.getElementById('order-stat-revenue');
  if (statRev) statRev.textContent = `$${totalRevenue}`;

  const sidebarBadge = document.getElementById('orders-badge');
  if (sidebarBadge) sidebarBadge.textContent = pendingOrders > 0 ? pendingOrders : totalOrders;

  // Filter orders
  const filtered = (currentFilter === 'all') 
    ? orders 
    : orders.filter(o => (o.status || '').toLowerCase() === currentFilter.toLowerCase());

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center">
        <div class="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl">
          <i class="fa-solid fa-bag-shopping"></i>
        </div>
        <h4 class="font-bold text-slate-700 text-sm">No orders found</h4>
        <p class="text-xs text-slate-400 mt-1">When visitors order a plan on index.html, their order details appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-slate-500 font-semibold">
          <tr>
            <th class="py-3 px-4">Order ID</th>
            <th class="py-3 px-4">Customer</th>
            <th class="py-3 px-4">Plan &amp; Price</th>
            <th class="py-3 px-4">Payment</th>
            <th class="py-3 px-4">Date</th>
            <th class="py-3 px-4">Status</th>
            <th class="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${filtered.map(order => `
            <tr class="hover:bg-slate-50/80 transition cursor-pointer" onclick="viewOrderDetailsModal('${order.id}')">
              <td class="py-3.5 px-4 font-mono font-bold text-blue-600">${escapeHtml(order.id)}</td>
              <td class="py-3.5 px-4">
                <div class="font-bold text-slate-900">${escapeHtml(order.customerName)}</div>
                <div class="text-[11px] text-slate-500">${escapeHtml(order.customerEmail)}</div>
              </td>
              <td class="py-3.5 px-4 font-bold text-slate-900">
                <span>${escapeHtml(order.planName)} Plan</span>
                <span class="text-slate-400 font-normal">($${order.price}${escapeHtml(order.period || '/mo')})</span>
              </td>
              <td class="py-3.5 px-4 text-slate-600">${escapeHtml(order.paymentMethod || 'Credit Card')}</td>
              <td class="py-3.5 px-4 text-slate-400 whitespace-nowrap">${escapeHtml(order.date || '')}</td>
              <td class="py-3.5 px-4">
                ${getOrderStatusBadge(order.status)}
              </td>
              <td class="py-3.5 px-4 text-right whitespace-nowrap" onclick="event.stopPropagation()">
                <div class="inline-flex items-center gap-1">
                  <button onclick="viewOrderDetailsModal('${order.id}')" title="View Order" class="p-1.5 text-slate-400 hover:text-blue-600 transition">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                  ${order.status !== 'Confirmed' ? `
                    <button onclick="updateOrderStatusInAdmin('${order.id}', 'Confirmed')" title="Confirm Order" class="p-1.5 text-slate-400 hover:text-emerald-600 transition">
                      <i class="fa-solid fa-circle-check"></i>
                    </button>
                  ` : `
                    <button onclick="updateOrderStatusInAdmin('${order.id}', 'Completed')" title="Mark Completed" class="p-1.5 text-slate-400 hover:text-purple-600 transition">
                      <i class="fa-solid fa-flag-checkered"></i>
                    </button>
                  `}
                  <button onclick="handleDeleteOrder('${order.id}')" title="Delete Order" class="p-1.5 text-slate-400 hover:text-red-500 transition">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getOrderStatusBadge(status) {
  const s = (status || 'Pending').toLowerCase();
  if (s === 'confirmed') {
    return '<span class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Confirmed</span>';
  } else if (s === 'completed') {
    return '<span class="inline-flex items-center gap-1 bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]"><span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Completed</span>';
  } else if (s === 'cancelled') {
    return '<span class="inline-flex items-center gap-1 bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full text-[10px]"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Cancelled</span>';
  } else {
    return '<span class="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending</span>';
  }
}

function updateOrderStatusInAdmin(orderId, newStatus) {
  if (updateOrderStatus(orderId, newStatus)) {
    renderOrdersTable();
    updateOverviewStats();
    showAdminToast(`Order #${orderId} marked as ${newStatus}!`);
  }
}

function viewOrderDetailsModal(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('modal-order-hidden-id').value = order.id;
  document.getElementById('modal-order-id').textContent = '#' + order.id;
  
  const statusEl = document.getElementById('modal-order-status');
  statusEl.textContent = order.status || 'Pending';
  statusEl.className = `inline-block font-bold px-2.5 py-0.5 rounded-full text-xs ${
    order.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
    order.status === 'Completed' ? 'bg-purple-100 text-purple-800' :
    order.status === 'Cancelled' ? 'bg-slate-100 text-slate-600' :
    'bg-amber-100 text-amber-800'
  }`;

  document.getElementById('modal-order-name').textContent = order.customerName || 'Anonymous';
  document.getElementById('modal-order-plan-price').textContent = `${order.planName} Plan ($${order.price}${order.period || '/mo'})`;
  document.getElementById('modal-order-email').textContent = order.customerEmail || 'None';
  document.getElementById('modal-order-phone').textContent = order.customerPhone || 'Not provided';
  document.getElementById('modal-order-company').textContent = order.customerCompany || 'Not provided';
  document.getElementById('modal-order-payment').textContent = order.paymentMethod || 'Credit Card / Stripe';
  document.getElementById('modal-order-notes').textContent = order.notes || 'No extra notes provided.';
  document.getElementById('modal-order-date').textContent = order.date || 'Recent';

  // Reply by email button
  const replyBtn = document.getElementById('modal-order-reply-btn');
  replyBtn.onclick = () => {
    window.location.href = `mailto:${encodeURIComponent(order.customerEmail)}?subject=${encodeURIComponent(`Order #${order.id} Confirmation — Pixel Craft`)}`;
  };

  document.getElementById('order-detail-modal').classList.remove('hidden');
  document.getElementById('order-detail-modal').classList.add('flex');
}

function closeOrderDetailModal() {
  document.getElementById('order-detail-modal').classList.add('hidden');
  document.getElementById('order-detail-modal').classList.remove('flex');
}

function setOrderStatusFromModal(newStatus) {
  const id = document.getElementById('modal-order-hidden-id').value;
  if (!id) return;
  updateOrderStatusInAdmin(id, newStatus);
  viewOrderDetailsModal(id);
}

function handleDeleteOrder(orderId) {
  if (!confirm(`Are you sure you want to delete order #${orderId}?`)) return;
  if (deleteOrder(orderId)) {
    renderOrdersTable();
    updateOverviewStats();
    showAdminToast(`Order #${orderId} removed.`);
  }
}

function clearAllOrdersModal() {
  const orders = getOrders();
  if (orders.length === 0) return;
  if (!confirm('Are you sure you want to clear all customer orders? This cannot be undone.')) return;
  clearAllOrders();
  renderOrdersTable();
  updateOverviewStats();
  showAdminToast('All customer orders cleared.');
}

// ==================== 8. OVERVIEW STATS & RECENT LISTS ====================
function updateOverviewStats() {
  const plans = (currentCMSData && currentCMSData.pricing) ? currentCMSData.pricing.length : 3;
  const srvs = (currentCMSData && currentCMSData.services) ? currentCMSData.services.length : 3;
  const msgs = getMessages();
  const unreadMsgs = msgs.filter(m => !m.read).length;
  
  const orders = getOrders();
  const totalRev = orders.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

  // Counter stats
  const statPlans = document.getElementById('stat-plans-count');
  if (statPlans) statPlans.textContent = plans;
  const statSrvs = document.getElementById('stat-services-count');
  if (statSrvs) statSrvs.textContent = srvs;
  const statMsgs = document.getElementById('stat-messages-count');
  if (statMsgs) statMsgs.textContent = msgs.length;
  const statOrders = document.getElementById('stat-orders-count');
  if (statOrders) statOrders.textContent = orders.length;
  const statRev = document.getElementById('stat-revenue-total');
  if (statRev) statRev.textContent = `$${totalRev}`;

  const unreadBadge = document.getElementById('unread-badge');
  if (unreadBadge) unreadBadge.textContent = unreadMsgs;

  const ordersBadge = document.getElementById('orders-badge');
  if (ordersBadge) ordersBadge.textContent = pendingOrders > 0 ? pendingOrders : orders.length;

  // Recent Orders preview
  const recentOrdersEl = document.getElementById('overview-recent-orders');
  if (recentOrdersEl) {
    if (orders.length === 0) {
      recentOrdersEl.innerHTML = '<div class="p-6 text-center text-xs text-slate-400">No customer orders placed yet.</div>';
    } else {
      const top3 = orders.slice(0, 3);
      recentOrdersEl.innerHTML = top3.map(o => `
        <div class="p-4 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer" onclick="viewOrderDetailsModal('${o.id}')">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
              ${escapeHtml(o.customerName.charAt(0).toUpperCase())}
            </div>
            <div>
              <div class="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>${escapeHtml(o.customerName)}</span>
                <span class="text-blue-600 font-mono text-[11px]">#${escapeHtml(o.id)}</span>
                ${getOrderStatusBadge(o.status)}
              </div>
              <div class="text-[11px] text-slate-500">${escapeHtml(o.planName)} Plan ($${o.price}${escapeHtml(o.period || '/mo')})</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-400 font-medium">${escapeHtml(o.date || '')}</div>
        </div>
      `).join('');
    }
  }

  // Recent Inquiries preview
  const recentMessagesEl = document.getElementById('overview-recent-messages');
  if (recentMessagesEl) {
    if (msgs.length === 0) {
      recentMessagesEl.innerHTML = '<div class="p-6 text-center text-xs text-slate-400">No contact messages received yet.</div>';
    } else {
      const top3 = msgs.slice(0, 3);
      recentMessagesEl.innerHTML = top3.map(m => `
        <div class="p-4 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer" onclick="viewMessageDetails('${m.id}')">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full ${m.read ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'} flex items-center justify-center text-xs font-bold">
              ${m.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>${escapeHtml(m.name)}</span>
                ${!m.read ? '<span class="bg-blue-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">NEW</span>' : ''}
              </div>
              <div class="text-[11px] text-slate-500 truncate max-w-xs">${escapeHtml(m.message)}</div>
            </div>
          </div>
          <div class="text-[11px] text-slate-400 font-medium">${m.date}</div>
        </div>
      `).join('');
    }
  }
}

// ==================== 9. PRICING & PRODUCTS MANAGER ====================
function renderPricingPlansList() {
  const container = document.getElementById('pricing-plans-container');
  if (!container || !currentCMSData || !currentCMSData.pricing) return;

  container.innerHTML = currentCMSData.pricing.map((plan, index) => `
    <div class="bg-white rounded-2xl border ${plan.popular ? 'border-2 border-blue-500 shadow-md' : 'border-slate-200 shadow-sm'} p-6 flex flex-col justify-between relative transition hover:shadow-lg">
      
      <!-- Top Ribbon -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Tier #${index + 1}</span>
          ${plan.popular ? '<span class="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Featured</span>' : ''}
        </div>
        ${currentCMSData.pricing.length > 1 ? `
          <button onclick="deletePricingPlan('${plan.id}')" title="Delete Plan" class="text-slate-400 hover:text-red-500 transition text-xs p-1">
            <i class="fa-solid fa-trash"></i>
          </button>
        ` : ''}
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Plan Name</label>
            <input 
              type="text" 
              value="${escapeHtml(plan.name)}" 
              oninput="updatePlanField('${plan.id}', 'name', this.value)" 
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Price</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-bold">$</span>
              <input 
                type="number" 
                value="${plan.price}" 
                oninput="updatePlanField('${plan.id}', 'price', parseFloat(this.value) || 0)" 
                class="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-extrabold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Billing Period</label>
            <input 
              type="text" 
              value="${escapeHtml(plan.period || '/mo')}" 
              placeholder="/mo" 
              oninput="updatePlanField('${plan.id}', 'period', this.value)" 
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" 
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Button Text</label>
            <input 
              type="text" 
              value="${escapeHtml(plan.ctaText || 'Order Now')}" 
              oninput="updatePlanField('${plan.id}', 'ctaText', this.value)" 
              class="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" 
            />
          </div>
        </div>

        <!-- Highlight Badge Switch -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-700">Highlight as "Popular"</span>
            <p class="text-[10px] text-slate-400">Adds prominent border and badge on public site</p>
          </div>
          <input 
            type="checkbox" 
            ${plan.popular ? 'checked' : ''} 
            onchange="togglePlanPopular('${plan.id}', this.checked)" 
            class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
          />
        </div>

        <!-- Features list -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-[11px] font-bold text-slate-600 uppercase">Included Features</label>
            <button type="button" onclick="addFeatureToPlan('${plan.id}')" class="text-xs text-blue-600 hover:text-blue-800 font-semibold">
              <i class="fa-solid fa-plus text-[10px]"></i> Add Feature
            </button>
          </div>
          <div class="space-y-2">
            ${(plan.features || []).map((feat, fIdx) => `
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-check text-blue-600 text-xs flex-shrink-0"></i>
                <input 
                  type="text" 
                  value="${escapeHtml(feat)}" 
                  oninput="updatePlanFeatureText('${plan.id}', ${fIdx}, this.value)" 
                  class="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                />
                <button type="button" onclick="removeFeatureFromPlan('${plan.id}', ${fIdx})" class="text-slate-400 hover:text-red-500 p-1">
                  <i class="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-slate-100 mt-5">
        <button onclick="savePricingSettings()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-xl transition shadow-sm active:scale-95">
          <i class="fa-solid fa-check mr-1"></i> Save Changes to Tier
        </button>
      </div>

    </div>
  `).join('');
}

function updatePlanField(planId, field, value) {
  const plan = currentCMSData.pricing.find(p => p.id === planId);
  if (!plan) return;
  plan[field] = value;
  saveCMSData(currentCMSData);
  syncLivePreview();
}

function togglePlanPopular(planId, isPopular) {
  currentCMSData.pricing.forEach(p => {
    if (p.id === planId) {
      p.popular = isPopular;
      p.badge = isPopular ? 'Popular' : '';
    }
  });
  saveCMSData(currentCMSData);
  renderPricingPlansList();
  syncLivePreview();
  showAdminToast('Pricing tier highlight updated!');
}

function addFeatureToPlan(planId) {
  const plan = currentCMSData.pricing.find(p => p.id === planId);
  if (!plan) return;
  if (!plan.features) plan.features = [];
  plan.features.push('New Feature');
  saveCMSData(currentCMSData);
  renderPricingPlansList();
  syncLivePreview();
}

function updatePlanFeatureText(planId, index, newText) {
  const plan = currentCMSData.pricing.find(p => p.id === planId);
  if (!plan || !plan.features) return;
  plan.features[index] = newText;
  saveCMSData(currentCMSData);
  syncLivePreview();
}

function removeFeatureFromPlan(planId, index) {
  const plan = currentCMSData.pricing.find(p => p.id === planId);
  if (!plan || !plan.features) return;
  plan.features.splice(index, 1);
  saveCMSData(currentCMSData);
  renderPricingPlansList();
  syncLivePreview();
}

function addNewPricingPlan() {
  const newId = 'plan-' + Date.now();
  currentCMSData.pricing.push({
    id: newId,
    name: 'Custom Tier',
    price: 99,
    period: '/mo',
    popular: false,
    badge: '',
    ctaText: 'Order Now',
    features: ['Custom Feature 1', 'Modern Tech Stack', '24/7 Support']
  });
  saveCMSData(currentCMSData);
  renderPricingPlansList();
  updateOverviewStats();
  syncLivePreview();
  showAdminToast('New pricing tier added!');
}

function deletePricingPlan(planId) {
  if (currentCMSData.pricing.length <= 1) {
    alert('At least one pricing plan is required.');
    return;
  }
  if (!confirm('Are you sure you want to remove this pricing plan?')) return;
  currentCMSData.pricing = currentCMSData.pricing.filter(p => p.id !== planId);
  saveCMSData(currentCMSData);
  renderPricingPlansList();
  updateOverviewStats();
  syncLivePreview();
  showAdminToast('Pricing plan deleted.');
}

function savePricingSettings() {
  saveCMSData(currentCMSData);
  syncLivePreview();
  showAdminToast('All pricing changes saved successfully!');
}

// ==================== 10. SERVICES (WHAT WE DO) ====================
function renderServicesList() {
  const container = document.getElementById('services-list-container');
  if (!container || !currentCMSData || !currentCMSData.services) return;

  container.innerHTML = currentCMSData.services.map(srv => `
    <div class="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition">
      <div>
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl border border-blue-100">
            <i class="${escapeHtml(srv.icon)}"></i>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="openEditServiceModal('${srv.id}')" title="Edit Service" class="p-1.5 text-slate-400 hover:text-blue-600 transition">
              <i class="fa-solid fa-pen-to-square text-xs"></i>
            </button>
            <button onclick="deleteService('${srv.id}')" title="Delete Service" class="p-1.5 text-slate-400 hover:text-red-500 transition">
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </div>

        <h3 class="font-bold text-slate-900 text-base mb-2">${escapeHtml(srv.title)}</h3>
        <p class="text-xs text-slate-500 leading-relaxed">${escapeHtml(srv.description)}</p>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Icon: <code class="bg-slate-100 px-1 py-0.5 rounded text-slate-700">${escapeHtml(srv.icon)}</code></span>
        <button onclick="openEditServiceModal('${srv.id}')" class="text-blue-600 font-semibold hover:underline">Edit</button>
      </div>
    </div>
  `).join('');
}

function openEditServiceModal(serviceId) {
  const srv = currentCMSData.services.find(s => s.id === serviceId);
  if (!srv) return;

  document.getElementById('service-modal-id').value = srv.id;
  document.getElementById('service-modal-name').value = srv.title;
  document.getElementById('service-modal-icon').value = srv.icon;
  document.getElementById('service-modal-desc').value = srv.description;
  document.getElementById('service-modal-title').textContent = 'Edit Service';
  updateServiceModalIconPreview(srv.icon);

  document.getElementById('service-modal').classList.remove('hidden');
  document.getElementById('service-modal').classList.add('flex');
}

function addNewServiceModal() {
  document.getElementById('service-modal-id').value = '';
  document.getElementById('service-modal-name').value = '';
  document.getElementById('service-modal-icon').value = 'fa-solid fa-rocket';
  document.getElementById('service-modal-desc').value = '';
  document.getElementById('service-modal-title').textContent = 'Add New Service';
  updateServiceModalIconPreview('fa-solid fa-rocket');

  document.getElementById('service-modal').classList.remove('hidden');
  document.getElementById('service-modal').classList.add('flex');
}

function closeServiceModal() {
  document.getElementById('service-modal').classList.add('hidden');
  document.getElementById('service-modal').classList.remove('flex');
}

function updateServiceModalIconPreview(iconClass) {
  const preview = document.getElementById('service-modal-icon-preview');
  if (preview) {
    preview.innerHTML = `<i class="${escapeHtml(iconClass || 'fa-solid fa-star')}"></i>`;
  }
}

function setServiceModalIcon(iconClass) {
  document.getElementById('service-modal-icon').value = iconClass;
  updateServiceModalIconPreview(iconClass);
}

function saveServiceModal() {
  const id = document.getElementById('service-modal-id').value;
  const title = document.getElementById('service-modal-name').value.trim();
  const icon = document.getElementById('service-modal-icon').value.trim() || 'fa-solid fa-cube';
  const desc = document.getElementById('service-modal-desc').value.trim();

  if (!title) {
    alert('Please enter a service title.');
    return;
  }

  if (id) {
    const srv = currentCMSData.services.find(s => s.id === id);
    if (srv) {
      srv.title = title;
      srv.icon = icon;
      srv.description = desc;
    }
  } else {
    currentCMSData.services.push({
      id: 'srv-' + Date.now(),
      title,
      icon,
      description: desc
    });
  }

  saveCMSData(currentCMSData);
  closeServiceModal();
  renderServicesList();
  updateOverviewStats();
  syncLivePreview();
  showAdminToast('Service saved successfully!');
}

function deleteService(serviceId) {
  if (currentCMSData.services.length <= 1) {
    alert('You need at least one service card.');
    return;
  }
  if (!confirm('Are you sure you want to delete this service?')) return;
  currentCMSData.services = currentCMSData.services.filter(s => s.id !== serviceId);
  saveCMSData(currentCMSData);
  renderServicesList();
  updateOverviewStats();
  syncLivePreview();
  showAdminToast('Service deleted.');
}

// ==================== 11. ABOUT US MANAGER ====================
function updateAboutPreview(url) {
  const img = document.getElementById('about-image-preview');
  if (img) img.src = url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80';
}

function renderAboutFeaturesList() {
  const container = document.getElementById('about-features-container');
  if (!container || !currentCMSData || !currentCMSData.about) return;

  container.innerHTML = (currentCMSData.about.features || []).map((feat, idx) => `
    <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs flex-shrink-0">
        <i class="fa-solid fa-check"></i>
      </div>
      <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input 
          type="text" 
          value="${escapeHtml(feat.title)}" 
          placeholder="Feature title" 
          oninput="updateAboutFeatureField(${idx}, 'title', this.value)" 
          class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
        />
        <input 
          type="text" 
          value="${escapeHtml(feat.description || '')}" 
          placeholder="Subtitle / details" 
          oninput="updateAboutFeatureField(${idx}, 'description', this.value)" 
          class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
        />
      </div>
      <button type="button" onclick="deleteAboutFeature(${idx})" class="text-slate-400 hover:text-red-500 p-1">
        <i class="fa-solid fa-trash text-xs"></i>
      </button>
    </div>
  `).join('');
}

function updateAboutFeatureField(index, field, value) {
  if (!currentCMSData.about.features) return;
  currentCMSData.about.features[index][field] = value;
  saveCMSData(currentCMSData);
  syncLivePreview();
}

function addAboutFeature() {
  if (!currentCMSData.about.features) currentCMSData.about.features = [];
  currentCMSData.about.features.push({
    id: 'feat-' + Date.now(),
    title: 'New Benefit',
    description: 'Detailed highlight description'
  });
  saveCMSData(currentCMSData);
  renderAboutFeaturesList();
  syncLivePreview();
}

function deleteAboutFeature(index) {
  if (!currentCMSData.about.features) return;
  currentCMSData.about.features.splice(index, 1);
  saveCMSData(currentCMSData);
  renderAboutFeaturesList();
  syncLivePreview();
}

function saveAboutSettings() {
  currentCMSData.about.title = document.getElementById('about-title').value.trim();
  currentCMSData.about.imageUrl = document.getElementById('about-image-url').value.trim();
  saveCMSData(currentCMSData);
  syncLivePreview();
  showAdminToast('About Us section updated successfully!');
}

// ==================== 12. GENERAL, HERO & CONTACT SAVING ====================
function saveGeneralSettings() {
  collectCurrentDraftData();
  saveCMSData(currentCMSData);
  populateAllForms();
  syncLivePreview();
  showAdminToast('Brand & logo settings saved successfully!');
}

function saveHeroSettings() {
  collectCurrentDraftData();
  saveCMSData(currentCMSData);
  syncLivePreview();
  showAdminToast('Hero section updated successfully!');
}

function saveContactSettings() {
  collectCurrentDraftData();
  currentCMSData.contact.phone = document.getElementById('contact-phone').value.trim();
  currentCMSData.contact.email = document.getElementById('contact-email').value.trim();
  currentCMSData.contact.address = document.getElementById('contact-address').value.trim();
  currentCMSData.footer.copyright = document.getElementById('footer-copyright').value.trim();

  if (!currentCMSData.footer.socials) currentCMSData.footer.socials = {};
  currentCMSData.footer.socials.instagram = document.getElementById('social-instagram').value.trim();
  currentCMSData.footer.socials.twitter = document.getElementById('social-twitter').value.trim();
  currentCMSData.footer.socials.facebook = document.getElementById('social-facebook').value.trim();
  currentCMSData.footer.socials.youtube = document.getElementById('social-youtube').value.trim();

  saveCMSData(currentCMSData);
  syncLivePreview();
  showAdminToast('Contact info & footer updated successfully!');
}

function saveCurrentTab() {
  if (activeTabName === 'general') saveGeneralSettings();
  else if (activeTabName === 'hero') saveHeroSettings();
  else if (activeTabName === 'about') saveAboutSettings();
  else if (activeTabName === 'pricing') savePricingSettings();
  else if (activeTabName === 'ordering') saveOrderingSettings();
  else if (activeTabName === 'contact') saveContactSettings();
  else {
    collectCurrentDraftData();
    saveCMSData(currentCMSData);
    syncLivePreview();
    showAdminToast('All website settings saved!');
  }
}

// ==================== 13. INQUIRIES / MESSAGES INBOX ====================
function renderMessagesTable() {
  const container = document.getElementById('messages-table-container');
  if (!container) return;

  const msgs = getMessages();
  if (msgs.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center">
        <div class="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl">
          <i class="fa-solid fa-inbox"></i>
        </div>
        <h4 class="font-bold text-slate-700 text-sm">Inbox is empty</h4>
        <p class="text-xs text-slate-400 mt-1">When visitors submit the form on index.html, their messages will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-slate-500 font-semibold">
          <tr>
            <th class="py-3 px-4">Status</th>
            <th class="py-3 px-4">Sender</th>
            <th class="py-3 px-4">Email</th>
            <th class="py-3 px-4">Message Preview</th>
            <th class="py-3 px-4">Date</th>
            <th class="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${msgs.map(m => `
            <tr class="hover:bg-slate-50/80 transition cursor-pointer" onclick="viewMessageDetails('${m.id}')">
              <td class="py-3 px-4">
                ${m.read 
                  ? '<span class="inline-flex items-center gap-1 text-slate-400 font-medium"><i class="fa-solid fa-check text-[10px]"></i> Read</span>' 
                  : '<span class="inline-flex items-center gap-1 bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full text-[10px]"><span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span> New</span>'}
              </td>
              <td class="py-3 px-4 font-bold text-slate-900">${escapeHtml(m.name)}</td>
              <td class="py-3 px-4 text-slate-600">${escapeHtml(m.email)}</td>
              <td class="py-3 px-4 text-slate-500 max-w-xs truncate">${escapeHtml(m.message)}</td>
              <td class="py-3 px-4 text-slate-400 whitespace-nowrap">${m.date}</td>
              <td class="py-3 px-4 text-right whitespace-nowrap" onclick="event.stopPropagation()">
                <button onclick="viewMessageDetails('${m.id}')" title="View" class="p-1.5 text-slate-400 hover:text-blue-600 transition">
                  <i class="fa-solid fa-eye"></i>
                </button>
                <button onclick="handleDeleteMessage('${m.id}')" title="Delete" class="p-1.5 text-slate-400 hover:text-red-500 transition">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function viewMessageDetails(id) {
  const msgs = getMessages();
  const m = msgs.find(item => item.id === id);
  if (!m) return;

  markMessageRead(id);
  updateOverviewStats();

  document.getElementById('modal-msg-from').textContent = m.name;
  document.getElementById('modal-msg-email').textContent = m.email;
  document.getElementById('modal-msg-date').textContent = m.date;
  document.getElementById('modal-msg-body').textContent = m.message;
  
  const replyBtn = document.getElementById('modal-msg-reply');
  replyBtn.onclick = () => {
    window.location.href = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent('Regarding your inquiry on Pixel Craft')}`;
  };

  document.getElementById('msg-detail-modal').classList.remove('hidden');
  document.getElementById('msg-detail-modal').classList.add('flex');
}

function closeMsgModal() {
  document.getElementById('msg-detail-modal').classList.add('hidden');
  document.getElementById('msg-detail-modal').classList.remove('flex');
  renderMessagesTable();
}

function handleDeleteMessage(id) {
  if (!confirm('Are you sure you want to delete this inquiry?')) return;
  deleteMessage(id);
  renderMessagesTable();
  updateOverviewStats();
  showAdminToast('Message removed.');
}

function clearAllMessagesModal() {
  const msgs = getMessages();
  if (msgs.length === 0) return;
  if (!confirm('Are you sure you want to clear all inquiries?')) return;
  clearAllMessages();
  renderMessagesTable();
  updateOverviewStats();
  showAdminToast('All inquiries cleared.');
}

// ==================== 14. BACKUP & EXPORT/IMPORT ====================
function exportConfigFile() {
  const data = getCMSData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pixelcraft-config-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showAdminToast('Configuration backup downloaded!');
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.general && parsed.pricing && parsed.hero) {
        saveCMSData(parsed);
        refreshData();
        syncLivePreview();
        showAdminToast('Backup restored successfully!');
      } else {
        alert('Invalid configuration format.');
      }
    } catch (err) {
      alert('Failed to parse JSON file.');
    }
  };
  reader.readAsText(file);
}

function confirmResetDefaults() {
  if (confirm('Are you sure you want to revert all changes to default factory settings? This cannot be undone.')) {
    resetCMSData();
    refreshData();
    syncLivePreview();
    showAdminToast('Restored default factory content!');
  }
}

// ==================== 15. ADMIN SECURITY ====================
function saveAdminCredentialsForm() {
  const user = document.getElementById('sec-username').value.trim();
  const pass = document.getElementById('sec-password').value;

  if (!user || !pass) {
    alert('Username and password cannot be empty.');
    return;
  }

  if (updateAdminCredentials(user, pass)) {
    showAdminToast('Admin credentials updated! Remember your new password.');
  } else {
    alert('Failed to update credentials.');
  }
}

// ==================== 16. TOAST HELPER ====================
function showAdminToast(message, isSuccess = true) {
  const toast = document.getElementById('admin-toast');
  const toastMsg = document.getElementById('admin-toast-msg');
  const icon = document.getElementById('admin-toast-icon');

  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  if (icon) {
    icon.className = isSuccess 
      ? 'fa-solid fa-circle-check text-green-400 text-lg' 
      : 'fa-solid fa-triangle-exclamation text-amber-400 text-lg';
  }

  toast.classList.remove('translate-y-28', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-28', 'opacity-0', 'pointer-events-none');
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==================== 17. FIREBASE CLOUD MANAGEMENT ====================
function parseAndFillAdminFirebaseSnippet() {
  const pasteArea = document.getElementById('admin-fb-snippet-paste');
  if (!pasteArea) return;
  const raw = pasteArea.value.trim();
  if (!raw) {
    alert('Please paste your Firebase configuration code into the box first.');
    return;
  }

  const extract = (key) => {
    const regex = new RegExp(`${key}\\s*:\\s*["'\`]([^"'\`]+)["'\`]`, 'i');
    const match = raw.match(regex);
    return match ? match[1] : '';
  };

  const apiKey = extract('apiKey');
  const projectId = extract('projectId');
  const authDomain = extract('authDomain');
  const storageBucket = extract('storageBucket');
  const messagingSenderId = extract('messagingSenderId');
  const appId = extract('appId');
  const measurementId = extract('measurementId');

  if (apiKey) document.getElementById('fb-api-key').value = apiKey;
  if (projectId) document.getElementById('fb-project-id').value = projectId;
  if (authDomain) document.getElementById('fb-auth-domain').value = authDomain;
  if (storageBucket) document.getElementById('fb-storage-bucket').value = storageBucket;
  if (messagingSenderId) document.getElementById('fb-messaging-sender-id').value = messagingSenderId;
  if (appId) document.getElementById('fb-app-id').value = appId;
  if (measurementId) document.getElementById('fb-measurement-id').value = measurementId;

  const enabledEl = document.getElementById('fb-enabled');
  if (enabledEl) enabledEl.checked = true;

  showAdminToast(`Auto-extracted credentials for "${projectId || 'project'}"! Click "Save" to apply.`);
}

function loadFirebaseSettings() {
  if (typeof getFirebaseConfig !== 'function') return;
  const cfg = getFirebaseConfig();

  const enabledEl = document.getElementById('fb-enabled');
  if (enabledEl) enabledEl.checked = !!cfg.enabled;

  const apiKeyEl = document.getElementById('fb-api-key');
  if (apiKeyEl) apiKeyEl.value = cfg.apiKey || '';

  const projIdEl = document.getElementById('fb-project-id');
  if (projIdEl) projIdEl.value = cfg.projectId || '';

  const authDomEl = document.getElementById('fb-auth-domain');
  if (authDomEl) authDomEl.value = cfg.authDomain || '';

  const bucketEl = document.getElementById('fb-storage-bucket');
  if (bucketEl) bucketEl.value = cfg.storageBucket || '';

  const senderEl = document.getElementById('fb-messaging-sender-id');
  if (senderEl) senderEl.value = cfg.messagingSenderId || '';

  const appIdEl = document.getElementById('fb-app-id');
  if (appIdEl) appIdEl.value = cfg.appId || '';

  const measIdEl = document.getElementById('fb-measurement-id');
  if (measIdEl) measIdEl.value = cfg.measurementId || '';

  updateFirebaseStatusUI({
    connected: typeof isFirebaseInitialized === 'function' ? isFirebaseInitialized() : false,
    projectId: cfg.projectId
  });
}

function saveFirebaseSettingsForm() {
  const enabledEl = document.getElementById('fb-enabled');
  const apiKeyEl = document.getElementById('fb-api-key');
  const projectIdEl = document.getElementById('fb-project-id');
  const authDomainEl = document.getElementById('fb-auth-domain');
  const storageBucketEl = document.getElementById('fb-storage-bucket');
  const messagingSenderIdEl = document.getElementById('fb-messaging-sender-id');
  const appIdEl = document.getElementById('fb-app-id');
  const measurementIdEl = document.getElementById('fb-measurement-id');

  const enabled = enabledEl ? enabledEl.checked : false;
  const apiKey = apiKeyEl ? apiKeyEl.value.trim() : '';
  const projectId = projectIdEl ? projectIdEl.value.trim() : '';
  const authDomain = authDomainEl ? authDomainEl.value.trim() : '';
  const storageBucket = storageBucketEl ? storageBucketEl.value.trim() : '';
  const messagingSenderId = messagingSenderIdEl ? messagingSenderIdEl.value.trim() : '';
  const appId = appIdEl ? appIdEl.value.trim() : '';
  const measurementId = measurementIdEl ? measurementIdEl.value.trim() : '';

  const cfg = {
    enabled,
    apiKey,
    projectId,
    authDomain,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId
  };

  saveFirebaseConfig(cfg);

  if (enabled) {
    if (!apiKey || !projectId) {
      alert('Please provide at least the Firebase API Key and Project ID to connect cloud storage.');
      return;
    }
    const success = initFirebaseApp();
    if (success) {
      showAdminToast('Firebase credentials saved & cloud connected!');
    } else {
      showAdminToast('Credentials saved! Running in local cache mode until connection succeeds.', false);
    }
  } else {
    showAdminToast('Firebase Cloud disabled. Running in Local Storage mode.');
  }

  loadFirebaseSettings();
}

async function handleTestFirebaseConnection() {
  const apiKeyEl = document.getElementById('fb-api-key');
  const projectIdEl = document.getElementById('fb-project-id');
  const authDomainEl = document.getElementById('fb-auth-domain');
  const storageBucketEl = document.getElementById('fb-storage-bucket');
  const messagingSenderIdEl = document.getElementById('fb-messaging-sender-id');
  const appIdEl = document.getElementById('fb-app-id');
  const measurementIdEl = document.getElementById('fb-measurement-id');

  const apiKey = apiKeyEl ? apiKeyEl.value.trim() : '';
  const projectId = projectIdEl ? projectIdEl.value.trim() : '';
  const authDomain = authDomainEl ? authDomainEl.value.trim() : '';
  const storageBucket = storageBucketEl ? storageBucketEl.value.trim() : '';
  const messagingSenderId = messagingSenderIdEl ? messagingSenderIdEl.value.trim() : '';
  const appId = appIdEl ? appIdEl.value.trim() : '';
  const measurementId = measurementIdEl ? measurementIdEl.value.trim() : '';

  if (!apiKey || !projectId) {
    alert('Please enter at least the API Key and Project ID first.');
    return;
  }

  showAdminToast('Testing Firebase Cloud connection...');
  const res = await testFirebaseConnection({
    apiKey,
    projectId,
    authDomain,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId
  });

  if (res.success) {
    alert(`✅ Firebase Connection Successful!\n\n${res.message}\n\nYour Firestore database is ready to store CMS configs, orders, and inquiries in real-time.`);
    showAdminToast('Firebase connection test passed!');
    updateFirebaseStatusUI({ connected: true, projectId });
  } else {
    alert(`❌ Firebase Connection Failed:\n\n${res.message}\n\nPlease verify:\n1. Project ID is correct.\n2. Cloud Firestore Database is created in Firebase Console.\n3. Firestore security rules allow read/write (e.g. Test Mode for development).`);
    showAdminToast('Connection test failed.', false);
  }
}

async function handleMigrateLocalToFirebase() {
  const btn = document.getElementById('btn-migrate-firebase');
  const originalHtml = btn ? btn.innerHTML : '';

  if (typeof isFirebaseInitialized === 'function' && !isFirebaseInitialized()) {
    alert('Please enable Firebase and test your connection before uploading data.');
    return;
  }

  if (!confirm('This will copy all your local website texts, customer orders, and inquiries to Firebase Cloud Firestore. Continue?')) {
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Uploading...';
  }

  try {
    const res = await migrateAllLocalDataToFirebase();
    showAdminToast(`Data uploaded to Firebase! (${res.orders} orders, ${res.messages} inquiries)`);
    alert(`✅ Cloud Migration Complete!\n\n• CMS Configuration: Uploaded\n• Customer Orders: ${res.orders} uploaded\n• Contact Inquiries: ${res.messages} uploaded\n\nYour website is now synchronized with Firebase Cloud Firestore!`);
  } catch (err) {
    alert(`Failed to migrate data to Firebase: ${err.message}`);
    showAdminToast('Migration error', false);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

function updateFirebaseStatusUI(statusDetail = null) {
  const isConn = (statusDetail && statusDetail.connected) || (typeof isFirebaseInitialized === 'function' && isFirebaseInitialized());
  const cfg = (typeof getFirebaseConfig === 'function') ? getFirebaseConfig() : {};
  const projId = (statusDetail && statusDetail.projectId) || cfg.projectId || 'None';

  // Header cloud status button
  const headerCloudBtn = document.getElementById('header-cloud-btn');
  const headerCloudDot = document.getElementById('header-cloud-dot');
  const headerCloudIcon = document.getElementById('header-cloud-icon');
  const headerCloudText = document.getElementById('header-cloud-text');

  if (headerCloudBtn && headerCloudDot && headerCloudIcon && headerCloudText) {
    if (isConn) {
      headerCloudDot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
      headerCloudIcon.className = 'fa-solid fa-cloud text-emerald-400 text-xs';
      headerCloudText.textContent = 'Cloud Active';
      headerCloudBtn.className = 'hidden sm:inline-flex items-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-700/60 transition';
    } else {
      headerCloudDot.className = 'w-2 h-2 rounded-full bg-amber-400';
      headerCloudIcon.className = 'fa-solid fa-cloud text-amber-400 text-xs';
      headerCloudText.textContent = cfg.enabled ? 'Connecting...' : 'Local Storage';
      headerCloudBtn.className = 'hidden sm:inline-flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition';
    }
  }

  // Sidebar cloud badge
  const sidebarIcon = document.getElementById('sidebar-cloud-icon');
  const sidebarBadge = document.getElementById('sidebar-cloud-badge');
  if (sidebarIcon && sidebarBadge) {
    if (isConn) {
      sidebarIcon.className = 'fa-solid fa-cloud w-5 text-center text-emerald-400';
      sidebarBadge.className = 'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50';
      sidebarBadge.textContent = 'Cloud';
    } else {
      sidebarIcon.className = 'fa-solid fa-cloud w-5 text-center text-amber-400';
      sidebarBadge.className = 'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400';
      sidebarBadge.textContent = 'Local';
    }
  }

  // Tab Firebase status card
  const fbBox = document.getElementById('fb-status-icon-box');
  const fbTitle = document.getElementById('fb-status-title');
  const fbPill = document.getElementById('fb-status-pill');
  const fbDesc = document.getElementById('fb-status-desc');
  const fbProj = document.getElementById('fb-status-project');

  if (fbBox && fbTitle && fbPill && fbDesc && fbProj) {
    fbProj.textContent = projId;
    if (isConn) {
      fbBox.className = 'w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl border border-emerald-200 shadow-inner';
      fbTitle.textContent = 'Connected to Firebase Cloud Firestore';
      fbPill.className = 'bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1';
      fbPill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Cloud Active';
      fbDesc.textContent = `All CMS updates, customer orders, and contact inquiries are synchronizing live with project "${projId}".`;
    } else {
      fbBox.className = 'w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl border border-amber-200';
      fbTitle.textContent = 'Local Storage Mode';
      fbPill.className = 'bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase';
      fbPill.textContent = 'Offline / Local';
      fbDesc.textContent = cfg.enabled 
        ? 'Firebase is enabled but not connected. Check your credentials or internet connection.' 
        : 'Firebase cloud credentials not yet configured. All data is securely persisted in browser LocalStorage.';
    }
  }
}
