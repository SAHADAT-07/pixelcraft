// Pixel Craft JavaScript & Dynamic CMS Integration

let currentCmsConfig = null;
let selectedOrderPlan = null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial CMS Render
  applyCMSData();

  // Firebase Analytics Page View
  if (typeof logFirebaseEvent === 'function') {
    logFirebaseEvent('page_view', {
      page_title: document.title,
      page_location: window.location.href
    });
  }

  // Listen for storage changes across tabs or custom event
  window.addEventListener('storage', (e) => {
    if (e.key === 'pixelcraft_cms_config') {
      applyCMSData();
    }
  });

  window.addEventListener('cms-updated', (e) => {
    applyCMSData(e.detail);
  });

  // Listen for postMessage from parent (e.g. Admin Live Preview iframe)
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'cms-preview-update') {
      applyCMSData(e.data.data);
    }
  });

  // 2. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = document.getElementById('menu-icon');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.contains('hidden');
      if (isHidden) {
        mobileMenu.classList.remove('hidden');
        menuIcon.classList.remove('fa-bars');
        menuIcon.classList.add('fa-xmark');
      } else {
        mobileMenu.classList.add('hidden');
        menuIcon.classList.remove('fa-xmark');
        menuIcon.classList.add('fa-bars');
      }
    });

    // Close mobile menu on clicking any link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        menuIcon.classList.remove('fa-xmark');
        menuIcon.classList.add('fa-bars');
      });
    });
  }

  // 3. Video Modal Logic
  const openVideoBtn = document.getElementById('open-video-btn');
  const closeVideoBtn = document.getElementById('close-video-btn');
  const videoModal = document.getElementById('video-modal');
  const videoFrame = document.getElementById('video-frame');

  if (openVideoBtn && videoModal && videoFrame) {
    openVideoBtn.addEventListener('click', () => {
      const vidUrl = (currentCmsConfig && currentCmsConfig.hero && currentCmsConfig.hero.videoUrl) 
        ? currentCmsConfig.hero.videoUrl 
        : 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';
      videoFrame.src = vidUrl;
      videoModal.classList.remove('hidden');
      videoModal.classList.add('flex');
    });

    const closeModal = () => {
      videoModal.classList.add('hidden');
      videoModal.classList.remove('flex');
      videoFrame.src = '';
    };

    if (closeVideoBtn) {
      closeVideoBtn.addEventListener('click', closeModal);
    }

    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !videoModal.classList.contains('hidden')) {
        closeModal();
      }
    });
  }

  // 4. Header Scrolled Styling & Active Link Spy
  const header = document.getElementById('main-header');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    // Header shadow on scroll
    if (window.scrollY > 20) {
      header.classList.add('shadow-lg', 'bg-[#0b132b]/95', 'backdrop-blur-md');
    } else {
      header.classList.remove('shadow-lg', 'bg-[#0b132b]/95', 'backdrop-blur-md');
    }

    // Active Section Spy
    let current = '';
    const scrollPosition = window.pageYOffset + 120;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // Close Order Modal on Escape or outside click
  const orderModal = document.getElementById('order-modal');
  if (orderModal) {
    orderModal.addEventListener('click', (e) => {
      if (e.target === orderModal) {
        closeOrderModal();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !orderModal.classList.contains('hidden')) {
        closeOrderModal();
      }
    });
  }
});

// ==================== DYNAMIC CMS RENDERING ====================
function applyCMSData(customData = null) {
  if (customData) {
    currentCmsConfig = customData;
  } else if (typeof getCMSData === 'function') {
    currentCmsConfig = getCMSData();
  }
  if (!currentCmsConfig) return;

  // 1. General & Brand Identity (with Logo Change Support)
  if (currentCmsConfig.general) {
    const gen = currentCmsConfig.general;
    if (gen.browserTitle) {
      document.title = gen.browserTitle;
    }

    const brandTitleEl = document.getElementById('cms-browser-title');
    if (brandTitleEl && gen.browserTitle) {
      brandTitleEl.textContent = gen.browserTitle;
    }

    const logoType = gen.logoType || 'text'; // 'text' | 'image' | 'both'
    const logoImgUrl = gen.logoImage || '';
    const logoHeight = parseInt(gen.logoHeight, 10) || 36;
    const logoText = gen.logoText || gen.siteName || 'Pixel Craft';

    // Helper to render responsive brand logo elements
    const renderLogoTo = (imgId, textId, maxH) => {
      const imgEl = document.getElementById(imgId);
      const textEl = document.getElementById(textId);
      const actualHeight = Math.min(logoHeight, maxH || logoHeight);

      if (imgEl) {
        if ((logoType === 'image' || logoType === 'both') && logoImgUrl) {
          imgEl.src = logoImgUrl;
          imgEl.style.height = `${actualHeight}px`;
          imgEl.classList.remove('hidden');
        } else {
          imgEl.classList.add('hidden');
        }
      }

      if (textEl) {
        if (logoType === 'image' && logoImgUrl) {
          textEl.classList.add('hidden');
        } else {
          textEl.textContent = logoText;
          textEl.classList.remove('hidden');
        }
      }
    };

    renderLogoTo('cms-nav-logo-img', 'cms-nav-logo-text', 44);
    renderLogoTo('cms-footer-logo-img', 'cms-footer-logo-text', 36);
  }

  // 2. Hero Section
  if (currentCmsConfig.hero) {
    const heroTitle = document.getElementById('cms-hero-title');
    if (heroTitle && currentCmsConfig.hero.title) {
      heroTitle.textContent = currentCmsConfig.hero.title;
    }
    const heroSubtitle = document.getElementById('cms-hero-subtitle');
    if (heroSubtitle && currentCmsConfig.hero.subtitle) {
      heroSubtitle.textContent = currentCmsConfig.hero.subtitle;
    }
    const heroCta = document.getElementById('cms-hero-cta');
    if (heroCta) {
      if (currentCmsConfig.hero.primaryBtnText) heroCta.textContent = currentCmsConfig.hero.primaryBtnText;
      if (currentCmsConfig.hero.primaryBtnLink) heroCta.href = currentCmsConfig.hero.primaryBtnLink;
    }
    const videoBtnText = document.getElementById('cms-hero-video-text');
    if (videoBtnText && currentCmsConfig.hero.videoBtnText) {
      videoBtnText.textContent = currentCmsConfig.hero.videoBtnText;
    }
  }

  // 3. Services Section
  const servicesContainer = document.getElementById('cms-services-container');
  if (servicesContainer && Array.isArray(currentCmsConfig.services)) {
    servicesContainer.innerHTML = currentCmsConfig.services.map(srv => `
      <div class="service-card group bg-white border border-slate-100 rounded-2xl p-8 sm:p-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
        <div class="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50/50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition duration-300">
          <i class="${escapeHtml(srv.icon)} text-2xl"></i>
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-3">
          ${escapeHtml(srv.title)}
        </h3>
        <p class="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
          ${escapeHtml(srv.description)}
        </p>
      </div>
    `).join('');
  }

  // 4. About Us Section
  if (currentCmsConfig.about) {
    const aboutTitle = document.getElementById('cms-about-title');
    if (aboutTitle && currentCmsConfig.about.title) {
      aboutTitle.textContent = currentCmsConfig.about.title;
    }
    const aboutImg = document.getElementById('cms-about-image');
    if (aboutImg && currentCmsConfig.about.imageUrl) {
      aboutImg.src = currentCmsConfig.about.imageUrl;
    }
    const featuresContainer = document.getElementById('cms-about-features');
    if (featuresContainer && Array.isArray(currentCmsConfig.about.features)) {
      featuresContainer.innerHTML = currentCmsConfig.about.features.map(feat => `
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 mt-1">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs shadow-sm">
              <i class="fa-solid fa-check"></i>
            </span>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">${escapeHtml(feat.title)}</h3>
            ${feat.description ? `<p class="text-sm text-slate-500 mt-0.5">${escapeHtml(feat.description)}</p>` : ''}
          </div>
        </div>
      `).join('');
    }
  }

  // 5. Pricing Plans & Ordering Flow Integration
  const pricingContainer = document.getElementById('cms-pricing-container');
  if (pricingContainer && Array.isArray(currentCmsConfig.pricing)) {
    const orderingCfg = currentCmsConfig.ordering || { currency: '$', defaultCtaText: 'Order Now' };
    const currency = orderingCfg.currency || '$';
    const globalCta = orderingCfg.defaultCtaText || 'Order Now';

    pricingContainer.innerHTML = currentCmsConfig.pricing.map(plan => {
      const isPopular = plan.popular === true;
      const badgeText = plan.badge || 'Popular';
      const period = plan.period || '/mo';
      const cta = plan.ctaText || globalCta;

      return `
        <div class="pricing-card relative bg-white rounded-2xl ${isPopular ? 'border-2 border-blue-500/80 shadow-md hover:shadow-2xl' : 'border border-slate-200 shadow-sm hover:shadow-xl'} p-8 flex flex-col justify-between transition-all duration-300">
          
          ${isPopular ? `
            <div class="absolute -top-3.5 right-6">
              <span class="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                ${escapeHtml(badgeText)}
              </span>
            </div>
          ` : ''}

          <div>
            <h3 class="text-lg font-bold text-slate-900 mb-3">${escapeHtml(plan.name)}</h3>
            <div class="text-4xl font-extrabold text-slate-900 mb-6">
              ${escapeHtml(currency)}${plan.price}<span class="text-base font-semibold text-slate-500">${escapeHtml(period)}</span>
            </div>
            <hr class="border-slate-100 mb-6" />
            
            <ul class="space-y-4 text-left text-sm text-slate-600 mb-8">
              ${(plan.features || []).map(f => `
                <li class="flex items-center gap-3">
                  <i class="fa-solid fa-check text-blue-600 text-xs"></i>
                  <span>${escapeHtml(f)}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div>
            <button onclick="handlePlanOrder('${plan.id}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition active:scale-95 duration-150 flex items-center justify-center gap-2">
              <i class="fa-solid fa-cart-shopping text-xs"></i>
              <span>${escapeHtml(cta)}</span>
            </button>
          </div>

        </div>
      `;
    }).join('');
  }

  // 6. Contact Details
  if (currentCmsConfig.contact) {
    const phoneEl = document.getElementById('cms-contact-phone');
    if (phoneEl && currentCmsConfig.contact.phone) {
      phoneEl.textContent = currentCmsConfig.contact.phone;
      phoneEl.href = `tel:${currentCmsConfig.contact.phone.replace(/[^0-9+]/g, '')}`;
    }
    const emailEl = document.getElementById('cms-contact-email');
    if (emailEl && currentCmsConfig.contact.email) {
      emailEl.textContent = currentCmsConfig.contact.email;
      emailEl.href = `mailto:${currentCmsConfig.contact.email}`;
    }
    const addressEl = document.getElementById('cms-contact-address');
    if (addressEl && currentCmsConfig.contact.address) {
      addressEl.innerHTML = escapeHtml(currentCmsConfig.contact.address).replace(/\n/g, '<br />');
    }
  }

  // 7. Footer
  if (currentCmsConfig.footer) {
    const copyrightEl = document.getElementById('cms-footer-copyright');
    if (copyrightEl && currentCmsConfig.footer.copyright) {
      copyrightEl.textContent = currentCmsConfig.footer.copyright;
    }
    const socials = currentCmsConfig.footer.socials || {};
    const setSocial = (id, url) => {
      const el = document.getElementById(id);
      if (el && url) el.href = url;
    };
    setSocial('cms-social-instagram', socials.instagram);
    setSocial('cms-social-twitter', socials.twitter);
    setSocial('cms-social-facebook', socials.facebook);
    setSocial('cms-social-youtube', socials.youtube);
  }
}

// ==================== PUBLIC SITE ORDERING SYSTEM ====================
function handlePlanOrder(planId) {
  const cfg = currentCmsConfig || (typeof getCMSData === 'function' ? getCMSData() : null);
  if (!cfg) return;

  const ordering = cfg.ordering || { enabled: true, mode: 'modal', currency: '$' };
  const currency = ordering.currency || '$';

  // Check if online ordering is enabled in Admin settings
  if (ordering.enabled === false) {
    showToast('Online ordering is currently paused. Please send an inquiry below.', false);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
    return;
  }

  // Find plan object
  const plan = (cfg.pricing || []).find(p => p.id === planId) || {
    id: planId,
    name: 'Custom Plan',
    price: 99,
    period: '/mo',
    features: ['Modern Tech Stack', '24/7 Support']
  };

  selectedOrderPlan = plan;

  // Firebase Analytics event for plan selection
  if (typeof logFirebaseEvent === 'function') {
    logFirebaseEvent('select_item', {
      item_id: plan.id,
      item_name: plan.name,
      price: plan.price
    });
  }

  // Ordering Mode 1: WhatsApp Instant Order
  if (ordering.mode === 'whatsapp') {
    if (typeof logFirebaseEvent === 'function') {
      logFirebaseEvent('generate_lead', {
        method: 'whatsapp',
        item_id: plan.id,
        item_name: plan.name
      });
    }
    const cleanNum = (ordering.whatsappNumber || '').replace(/[^0-9]/g, '');
    let msgTemplate = ordering.whatsappMessage || 'Hi Pixel Craft! I placed an order for the {plan} plan ({currency}{price}{period}). My Order ID is {orderId}.';
    const fakeId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    
    const formattedMsg = msgTemplate
      .replace(/{plan}/g, plan.name)
      .replace(/{price}/g, plan.price)
      .replace(/{period}/g, plan.period || '/mo')
      .replace(/{currency}/g, currency)
      .replace(/{orderId}/g, fakeId);

    const waUrl = cleanNum 
      ? `https://wa.me/${cleanNum}?text=${encodeURIComponent(formattedMsg)}` 
      : `https://wa.me/?text=${encodeURIComponent(formattedMsg)}`;

    showToast(`Redirecting to WhatsApp to order ${plan.name} Plan...`);
    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 600);
    return;
  }

  // Ordering Mode 2: Contact Form Scroll & Prefill
  if (ordering.mode === 'contact') {
    showToast(`Selected ${plan.name} Plan (${currency}${plan.price}${plan.period || '/mo'})!`);
    const messageInput = document.getElementById('user-message');
    if (messageInput) {
      messageInput.value = `Hi Pixel Craft, I would like to order the ${plan.name} Plan (${currency}${plan.price}${plan.period || '/mo'}). Please get in touch to confirm details.`;
    }
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
      const nameInput = document.getElementById('user-name');
      if (nameInput) setTimeout(() => nameInput.focus(), 600);
    }
    return;
  }

  // Ordering Mode 3 (Default): Interactive Order Checkout & Confirmation Modal
  openOrderModal(plan);
}

function openOrderModal(plan) {
  const modal = document.getElementById('order-modal');
  if (!modal) return;

  const cfg = currentCmsConfig || (typeof getCMSData === 'function' ? getCMSData() : {});
  const ordering = cfg.ordering || {};
  const currency = ordering.currency || '$';

  // Fill plan details
  document.getElementById('order-input-plan-id').value = plan.id;
  document.getElementById('order-input-plan-name').value = plan.name;
  document.getElementById('order-input-plan-price').value = plan.price;
  document.getElementById('order-input-plan-period').value = plan.period || '/mo';

  document.getElementById('order-modal-plan-name').textContent = `${plan.name} Plan`;
  document.getElementById('order-modal-plan-price').innerHTML = `${escapeHtml(currency)}${plan.price}<span class="text-xs font-semibold text-slate-500">${escapeHtml(plan.period || '/mo')}</span>`;

  // Features snippet
  const featuresContainer = document.getElementById('order-modal-plan-features');
  if (featuresContainer) {
    featuresContainer.innerHTML = (plan.features || []).slice(0, 3).map(f => `
      <span class="inline-flex items-center gap-1"><i class="fa-solid fa-check text-blue-600 text-[10px]"></i> ${escapeHtml(f)}</span>
    `).join('');
  }

  // Check phone requirement setting
  const phoneReqEl = document.getElementById('order-phone-req');
  const phoneInput = document.getElementById('order-customer-phone');
  if (phoneReqEl && phoneInput) {
    if (ordering.requirePhone === false) {
      phoneReqEl.textContent = '(Optional)';
      phoneReqEl.className = 'text-slate-400 font-normal';
      phoneInput.required = false;
    } else {
      phoneReqEl.textContent = '*';
      phoneReqEl.className = 'text-red-500';
      phoneInput.required = true;
    }
  }

  // Reset views
  document.getElementById('order-form-view').classList.remove('hidden');
  document.getElementById('order-success-view').classList.add('hidden');
  document.getElementById('order-form').reset();

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeOrderModal() {
  const modal = document.getElementById('order-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function handleOrderSubmit(event) {
  event.preventDefault();

  const cfg = currentCmsConfig || (typeof getCMSData === 'function' ? getCMSData() : {});
  const ordering = cfg.ordering || {};
  const currency = ordering.currency || '$';

  const planId = document.getElementById('order-input-plan-id').value;
  const planName = document.getElementById('order-input-plan-name').value;
  const planPrice = parseFloat(document.getElementById('order-input-plan-price').value) || 0;
  const planPeriod = document.getElementById('order-input-plan-period').value;

  const customerName = document.getElementById('order-customer-name').value.trim();
  const customerEmail = document.getElementById('order-customer-email').value.trim();
  const customerPhone = document.getElementById('order-customer-phone').value.trim();
  const customerCompany = document.getElementById('order-customer-company').value.trim();
  const paymentMethod = document.getElementById('order-payment-method').value;
  const notes = document.getElementById('order-notes').value.trim();

  if (!customerName || !customerEmail) {
    showToast('Please provide your name and email.', false);
    return;
  }

  const submitBtn = document.getElementById('order-submit-btn');
  const originalBtnHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Confirming Order...';

  setTimeout(() => {
    // Save to CMS Customer Orders in localStorage
    let newOrder = null;
    if (typeof saveNewOrder === 'function') {
      newOrder = saveNewOrder({
        planId,
        planName,
        price: planPrice,
        period: planPeriod,
        customerName,
        customerEmail,
        customerPhone,
        customerCompany,
        paymentMethod,
        notes
      });
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;

    const orderId = newOrder ? newOrder.id : ('ORD-' + Math.floor(10000 + Math.random() * 90000));

    // Update Confirmation View elements
    document.getElementById('order-success-id').textContent = '#' + orderId;
    document.getElementById('order-success-plan').textContent = `${planName} Plan`;
    document.getElementById('order-success-price').textContent = `${currency}${planPrice}${planPeriod}`;
    document.getElementById('order-success-email').textContent = customerEmail;

    // Apply Admin Order Confirmation Settings
    if (ordering.confirmTitle) {
      document.getElementById('order-success-title').textContent = ordering.confirmTitle;
    }
    if (ordering.confirmMessage) {
      document.getElementById('order-success-message').textContent = ordering.confirmMessage;
    }

    // Configure WhatsApp Quick Confirmation button
    const waContainer = document.getElementById('order-success-whatsapp-container');
    const waBtn = document.getElementById('order-success-whatsapp-btn');
    if (ordering.whatsappNumber) {
      const cleanNum = ordering.whatsappNumber.replace(/[^0-9]/g, '');
      let waMsg = ordering.whatsappMessage || 'Hi Pixel Craft! I placed an order for the {plan} plan ({currency}{price}{period}). My Order ID is {orderId}.';
      waMsg = waMsg
        .replace(/{plan}/g, planName)
        .replace(/{price}/g, planPrice)
        .replace(/{period}/g, planPeriod)
        .replace(/{currency}/g, currency)
        .replace(/{orderId}/g, orderId);

      waBtn.href = cleanNum ? `https://wa.me/${cleanNum}?text=${encodeURIComponent(waMsg)}` : `https://wa.me/?text=${encodeURIComponent(waMsg)}`;
      if (waContainer) waContainer.classList.remove('hidden');
    } else if (waContainer) {
      waContainer.classList.add('hidden');
    }

    // Switch to Confirmation view
    document.getElementById('order-form-view').classList.add('hidden');
    document.getElementById('order-success-view').classList.remove('hidden');

    // Firebase Analytics purchase event
    if (typeof logFirebaseEvent === 'function') {
      logFirebaseEvent('purchase', {
        transaction_id: orderId,
        value: planPrice,
        currency: 'USD',
        items: [{
          item_id: planId,
          item_name: planName,
          price: planPrice
        }]
      });
    }

    showToast(`Order #${orderId} placed successfully!`);
  }, 700);
}

// Toast notification helper
function showToast(message, isSuccess = true) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  
  const icon = toast.querySelector('i');
  if (icon) {
    if (isSuccess) {
      icon.className = 'fa-solid fa-circle-check text-green-400 text-lg';
    } else {
      icon.className = 'fa-solid fa-triangle-exclamation text-amber-400 text-lg';
    }
  }

  toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
  }, 4000);
}

// Contact form submission
function handleContactSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('user-name').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const message = document.getElementById('user-message').value.trim();

  if (!name || !email || !message) {
    showToast('Please fill in all fields.', false);
    return;
  }

  const submitBtn = document.getElementById('submit-btn');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Sending...';

  setTimeout(() => {
    // Save to CMS Messages Inbox so Admin Panel receives it immediately!
    if (typeof saveNewMessage === 'function') {
      saveNewMessage({ name, email, message });
    }

    // Firebase Analytics contact event
    if (typeof logFirebaseEvent === 'function') {
      logFirebaseEvent('generate_lead', {
        form_name: 'contact_form',
        customer_name: name
      });
    }

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    showToast(`Thank you, ${name}! Your message has been sent to our team.`);
    document.getElementById('contact-form').reset();
  }, 800);
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
