// ============================================================
// app.js — النسخة النظيفة والنهائية
// ============================================================

// ── الإعدادات ────────────────────────────────────────────────
const SUPABASE_URL     = 'https://xgxrnjjarkadzrqkbxno.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XvhqP5jG-Y0GvG9Phae6cw_9Ii_Ovyf';

// ── تهيئة Supabase ──────────────────────────────────────────
const { createClient } = window.supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── المتغيرات العامة ─────────────────────────────────────────
let selectedService = null; // الخدمة المختارة حالياً

// ============================================================
// دوال رفع ومعاينة صورة التصميم
// ============================================================

/** عرض معاينة الصورة عند اختيارها */
function previewImage(input) {
  const file = input.files?.[0];
  if (!file) return;

  // التحقق من الحجم (5MB كحد أقصى)
  if (file.size > 5 * 1024 * 1024) {
    alert('❌ حجم الصورة يجب أن لا يتجاوز 5MB');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('img-preview').src     = e.target.result;
    document.getElementById('img-name').textContent = file.name;
    document.getElementById('img-placeholder').style.display  = 'none';
    document.getElementById('img-preview-wrap').style.display = 'block';
    document.getElementById('img-upload-area').style.borderColor = 'rgba(139,92,246,.6)';
  };
  reader.readAsDataURL(file);
}

/** إزالة الصورة المختارة */
function clearImage(e) {
  e.stopPropagation(); // منع فتح File Picker عند الضغط على "إزالة"
  document.getElementById('design-image').value        = '';
  document.getElementById('img-preview').src           = '';
  document.getElementById('img-name').textContent      = '';
  document.getElementById('img-placeholder').style.display  = 'block';
  document.getElementById('img-preview-wrap').style.display = 'none';
  document.getElementById('img-upload-area').style.borderColor = 'rgba(139,92,246,.35)';
}

/** دعم السحب والإفلات */
function handleImageDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('img-upload-area').style.borderColor = 'rgba(139,92,246,.35)';
  const file = e.dataTransfer?.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;
  // حقن الملف في الـ input
  const dt = new DataTransfer();
  dt.items.add(file);
  const input = document.getElementById('design-image');
  input.files = dt.files;
  previewImage(input);
}

/**
 * رفع الصورة إلى Supabase Storage
 * @returns {string|null} الرابط العام أو null إذا لم تُختر صورة أو فشل الرفع
 */
async function uploadDesignImage() {
  const input = document.getElementById('design-image');
  const file  = input?.files?.[0];
  if (!file) return null;

  // اسم فريد للملف
  const ext      = file.name.split('.').pop();
  const fileName = `design_${Date.now()}.${ext}`;

  const { data, error } = await sb.storage
    .from('order-designs')        // اسم الـ bucket في Supabase
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.warn('[Upload] فشل رفع الصورة:', error.message);
    return null;
  }

  // الحصول على الرابط العام
  const { data: urlData } = sb.storage.from('order-designs').getPublicUrl(fileName);
  return urlData?.publicUrl || null;
}

// ============================================================
// دوال المودال (فتح / إغلاق)
// ============================================================

/** فتح مودال معين */
function showModal(overlayId, modalId) {
  const ov = document.getElementById(overlayId);
  const mo = document.getElementById(modalId);
  if (!ov || !mo) { console.error('Modal not found:', overlayId, modalId); return; }
  ov.style.display = 'flex';
  mo.style.display = 'block';
  requestAnimationFrame(() => {
    ov.style.opacity = '1';
    mo.style.opacity = '1';
    mo.style.transform = 'translate(-50%, -50%)';
  });
}

/** إغلاق مودال معين */
function hideModal(overlayId, modalId) {
  const ov = document.getElementById(overlayId);
  const mo = document.getElementById(modalId);
  if (!ov || !mo) return;
  ov.style.opacity = '0';
  mo.style.opacity = '0';
  mo.style.transform = 'translate(-50%, -60%)';
  setTimeout(() => { ov.style.display = 'none'; mo.style.display = 'none'; }, 300);
}

/** إغلاق كل المودالات */
function closeAllModals() {
  hideModal('order-overlay', 'order-modal');
}

// ============================================================
// نموذج الطلب — ORDER MODAL
// ============================================================

/**
 * يُفتح عند الضغط على "اطلب الخدمة" في أي باقة
 * @param {string} serviceName - اسم الخدمة
 * @param {number} price - سعر الخدمة
 */
function openOrderModal(serviceName, price) {
  // حفظ الخدمة المختارة
  selectedService = { service_name: serviceName, price: price };

  // تحديث عنوان المودال
  const nameEl  = document.getElementById('modal-service-name');
  const priceEl = document.getElementById('modal-price');
  if (nameEl)  nameEl.textContent  = serviceName;
  if (priceEl) priceEl.textContent = price + ' دولار';

  // تنظيف النموذج
  const form = document.getElementById('order-form');
  if (form) form.reset();

  // مسح رسالة النجاح/الخطأ
  const msgEl = document.getElementById('order-result-msg');
  if (msgEl) msgEl.textContent = '';

  // فتح المودال
  showModal('order-overlay', 'order-modal');
}

/** إغلاق مودال الطلب */
function closeOrderModal() {
  hideModal('order-overlay', 'order-modal');
}

// ============================================================
// انتقال الموظف لصفحة تسجيل الدخول
// ============================================================
function goToLogin() {
  window.location.href = 'login.html';
}

// ============================================================
// معالجة إرسال نموذج الطلب
// ============================================================
async function handleOrderSubmit(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const msgEl     = document.getElementById('order-result-msg');

  // تحقق من الحقول الإلزامية
  const name  = document.getElementById('customer-name')?.value.trim()  || '';
  const email = document.getElementById('customer-email')?.value.trim() || '';
  if (!name)  { showMsg(msgEl, '❌ يرجى إدخال الاسم الكامل', 'error'); return; }
  if (!email) { showMsg(msgEl, '❌ يرجى إدخال البريد الإلكتروني', 'error'); return; }

  // حالة الإرسال
  submitBtn.disabled    = true;
  submitBtn.textContent = '⏳ جاري الإرسال...';

  // رفع الصورة إن وُجدت
  const imageUrl = await uploadDesignImage();

  // بناء payload الأساسي (بدون عمود الصورة مبدئياً)
  const baseData = {
    customer_name: name,
    email:         email,
    phone:         document.getElementById('customer-phone')?.value.trim() || null,
    service_name:  selectedService?.service_name || '',
    price:         selectedService?.price        || 0,
    notes:         document.getElementById('customer-notes')?.value.trim() || null,
    status:        'new'
  };

  // أضف رابط الصورة فقط إذا تم الرفع بنجاح
  const orderData = imageUrl ? { ...baseData, design_image_url: imageUrl } : baseData;

  // المحاولة الأولى: إرسال الطلب
  let { error } = await sb.from('orders').insert([orderData]);

  // إذا فشل بسبب عمود design_image_url غير موجود — أعد المحاولة بدونه
  if (error && error.message?.includes('design_image_url')) {
    console.warn('[Order] عمود design_image_url غير موجود — أضفه بـ SQL. الإرسال بدونه...');
    const retry = await sb.from('orders').insert([baseData]);
    error = retry.error;
  }

  if (error) {
    // عرض الخطأ الحقيقي لتسهيل التشخيص
    console.error('[Order] خطأ:', error.code, error.message, error.details);
    showMsg(msgEl, '❌ ' + (error.message || 'حدث خطأ غير متوقع'), 'error');
    submitBtn.disabled    = false;
    submitBtn.textContent = 'إرسال الطلب 🚀';
  } else {
    showMsg(msgEl, '✅ تم إرسال طلبك بنجاح! سنتواصل معك خلال 24 ساعة.', 'success');
    e.target.reset();
    clearImage({ stopPropagation: () => {} });
    setTimeout(closeOrderModal, 2500);
    submitBtn.disabled    = false;
    submitBtn.textContent = 'إرسال الطلب 🚀';
  }
}

/** عرض رسالة في العنصر المحدد */
function showMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.style.color = type === 'error' ? '#f87171' : '#4ade80';
}

// ============================================================
// تأثيرات الصفحة (Scroll Reveal + 3D Tilt)
// ============================================================

/** تأثير الظهور عند التمرير */
function observeReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('active'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal, .reveal-right').forEach(el => io.observe(el));
}

/** تأثير الإمالة ثلاثية الأبعاد والإضاءة المتتبعة للماوس */
function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      // حساب الإمالة
      const xTilt = ((e.clientX - r.left) / r.width  - 0.5) * 20; // 20 للميلان الأقوى
      const yTilt = ((e.clientY - r.top)  / r.height - 0.5) * -20;
      
      // حساب موقع الماوس للـ Glow Effect
      const xGlow = (e.clientX - r.left) - r.width;
      const yGlow = (e.clientY - r.top)  - r.height;

      card.style.transform = `perspective(1000px) rotateY(${xTilt}deg) rotateX(${yTilt}deg) translateY(-10px) scale3d(1.02, 1.02, 1.02)`;
      
      // تمرير الموقع لـ CSS
      card.style.setProperty('--x', `${e.clientX - r.left - r.width/2}px`);
      card.style.setProperty('--y', `${e.clientY - r.top - r.height/2}px`);
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.setProperty('--x', `0px`);
      card.style.setProperty('--y', `0px`);
    });
  });
}

// ظل الهيدر عند التمرير
window.addEventListener('scroll', () => {
  const h = document.getElementById('site-header');
  if (h) h.style.boxShadow = window.scrollY > 20 ? '0 4px 30px rgba(0,0,0,.5)' : '';
});

// القائمة المتنقلة
function toggleMenu() {
  document.getElementById('mobile-menu')?.classList.toggle('open');
}

// Toast notification
let _toastTimer;
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ============================================================
// التهيئة عند تحميل الصفحة
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // تفعيل تأثير الظهور
  observeReveal();

  // تفعيل الإمالة ثلاثية الأبعاد
  initTilt();

  // ربط نموذج الطلب
  const orderForm = document.getElementById('order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', handleOrderSubmit);
  } else {
    console.warn('order-form غير موجود في الصفحة');
  }

  // إغلاق المودال عند الضغط على الخلفية
  const overlay = document.getElementById('order-overlay');
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeOrderModal();
    });
  }
});

// ============================================================
// دوال دخول الموظفين — EMPLOYEE LOGIN MODAL
// ============================================================

/** فتح مودال دخول الموظفين */
function openEmpLogin() {
  const ov = document.getElementById('emp-overlay');
  const mo = document.getElementById('emp-modal');
  // تنظيف الحقول ورسائل الخطأ
  document.getElementById('emp-login-form')?.reset();
  document.getElementById('emp-err').textContent = '';
  // إظهار المودال
  ov.style.display = 'block';
  mo.style.display = 'block';
  requestAnimationFrame(() => {
    ov.style.opacity = '1';
    mo.style.opacity = '1';
    mo.style.transform = 'translate(-50%, -50%)';
  });
  // التركيز على حقل الإيميل
  setTimeout(() => document.getElementById('emp-email')?.focus(), 300);
}

/** إغلاق مودال دخول الموظفين */
function closeEmpLogin() {
  const ov = document.getElementById('emp-overlay');
  const mo = document.getElementById('emp-modal');
  ov.style.opacity = '0';
  mo.style.opacity = '0';
  mo.style.transform = 'translate(-50%, -60%)';
  setTimeout(() => { ov.style.display = 'none'; mo.style.display = 'none'; }, 300);
}

/**
 * معالجة تسجيل دخول الموظف
 * يعتمد على Supabase Auth فقط — لوحة التحكم تتحقق من الصلاحيات عند التحميل
 */
async function handleEmpLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('emp-err');
  const btn   = document.getElementById('emp-submit-btn');
  const email = document.getElementById('emp-email').value.trim();
  const pass  = document.getElementById('emp-pass').value;

  // تنظيف
  errEl.textContent = '';
  btn.disabled      = true;
  btn.textContent   = '⏳ جاري التحقق...';

  try {
    // محاولة تسجيل الدخول
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });

    // تفصيل للتشخيص في المتصفح
    console.log('[EmpLogin] auth result →', { data, error });

    if (error) {
      // فشل Auth — كلمة مرور أو إيميل خاطئ
      console.error('[EmpLogin] Auth error:', error.message, error.status);
      if (error.message.includes('Email not confirmed')) {
        errEl.textContent = '❌ يرجى تأكيد بريدك الإلكتروني أولاً';
      } else if (error.message.includes('Invalid login')) {
        errEl.textContent = '❌ البريد أو كلمة المرور غير صحيحة';
      } else {
        errEl.textContent = '❌ ' + error.message;
      }
      btn.disabled    = false;
      btn.textContent = '🔓 دخول';
      return;
    }

    // ✅ نجح تسجيل الدخول — الانتقال مباشرة للوحة التحكم
    // ملاحظة: لوحة التحكم ستتحقق من وجود الموظف في جدول employees
    btn.textContent = '✅ جاري التوجيه...';
    window.location.href = 'dashboard.html';

  } catch (err) {
    console.error('[EmpLogin] Unexpected error:', err);
    errEl.textContent = '❌ حدث خطأ غير متوقع، حاول مجدداً';
    btn.disabled    = false;
    btn.textContent = '🔓 دخول';
  }
}

// ============================================================
// تحميل البيانات العامة (الخدمات، الأعمال، التقييمات)
// ============================================================

async function loadPublicData() {
  // جلب الخدمات
  if(document.getElementById('services-grid')) {
    const { data: services } = await sb.from('services').select('*').eq('is_active', true).order('created_at', { ascending: true });
    const sGrid = document.getElementById('services-grid');
    if (services && services.length > 0) {
      sGrid.innerHTML = services.map(s => {
        // تحديد الأيقونة بذكاء بناءً على اسم الخدمة
        let iconClass = 'fa-code';
        if (s.name.includes('متجر') || s.name.includes('e-commerce') || s.name.includes('تجارة')) {
          iconClass = 'fa-cart-shopping';
        } else if (s.name.includes('موقع') || s.name.includes('website') || s.name.includes('صفحة')) {
          iconClass = 'fa-laptop-code';
        } else if (s.name.includes('تطبيق') || s.name.includes('app') || s.name.includes('متقدم')) {
          iconClass = 'fa-server';
        }

        return `
        <div class="service-card ${s.is_featured ? 'featured' : ''} reveal" data-id="${s.id}" data-price="${s.price}" data-name="${s.name}" data-tilt>
            <div class="code-particles"></div>
            <div class="svc-icon"><i class="fa ${iconClass}"></i></div>
            ${s.badge ? `<div class="svc-badge ${s.is_featured ? 'popular' : ''}">${s.badge}</div>` : ''}
            <h3>${s.name}</h3>
            <div class="price">$${s.price} <span>/ مشروع</span></div>
            ${s.description ? `<p style="font-size:0.85rem; color:#94a3b8; margin-bottom:1rem; text-align:center;">${s.description}</p>` : ''}
            <ul class="features-list">
                ${(s.features || []).map(f => `<li><i class="fa fa-check"></i> ${f}</li>`).join('')}
            </ul>
            <button class="btn-primary full" onclick="openOrderModal('${s.name}', ${s.price})">
                <i class="fa fa-rocket"></i> اطلب الخدمة
            </button>
        </div>
        `;
      }).join('');
    } else {
      sGrid.innerHTML = '<div style="text-align:center; padding:2rem; color:#64748b; grid-column:1/-1;">لا توجد خدمات متاحة حالياً</div>';
    }
  }

  // جلب الأعمال
  if(document.getElementById('portfolio-grid')) {
    const { data: portfolio } = await sb.from('portfolio').select('*').order('created_at', { ascending: false });
    const pGrid = document.getElementById('portfolio-grid');
    if (portfolio && portfolio.length > 0) {
      pGrid.innerHTML = portfolio.map(p => `
        <div class="port-card reveal" data-tilt>
            <div class="port-img" style="background: linear-gradient(135deg,#1a0a35,#5b21b6); overflow:hidden; position:relative;">
              ${p.img ? `<img src="${p.img}" style="width:100%;height:100%;object-fit:cover;opacity:0.8;">` : '<i class="fa fa-globe fa-3x"></i>'}
            </div>
            <div class="port-info">
                <h4>${p.title}</h4>
                ${p.description ? `<p>${p.description}</p>` : ''}
                <div class="port-tech">
                  ${(p.tech || '').split(',').map(t => t.trim()).filter(Boolean).map(t => `<span>${t}</span>`).join('')}
                </div>
                ${p.url ? `<a href="${p.url}" class="btn-outline btn-sm" target="_blank">عرض <i class="fa fa-arrow-up-right-from-square"></i></a>` : ''}
            </div>
        </div>
      `).join('');
    } else {
      pGrid.innerHTML = '<div style="text-align:center; padding:2rem; color:#64748b; grid-column:1/-1;">لا توجد أعمال سابقة للعرض</div>';
    }
  }

  // جلب التقييمات
  if(document.getElementById('reviews-grid')) {
    const { data: reviews } = await sb.from('reviews').select('*').eq('is_visible', true).order('created_at', { ascending: false });
    const rGrid = document.getElementById('reviews-grid');
    if (reviews && reviews.length > 0) {
      rGrid.innerHTML = reviews.map(r => `
        <div class="review-card reveal">
            <div class="stars">${'⭐'.repeat(r.rating || 5)}</div>
            <p>"${r.content}"</p>
            <div class="reviewer">
                <div class="avatar">${r.reviewer_name.charAt(0)}</div>
                <div><strong>${r.reviewer_name}</strong><small>${r.reviewer_title || 'عميل'}</small></div>
            </div>
        </div>
      `).join('');
    } else {
      rGrid.innerHTML = '<div style="text-align:center; padding:2rem; color:#64748b; grid-column:1/-1;">لا توجد تقييمات حالياً</div>';
    }
  }

  // إعادة تهيئة تأثير الظهور والميلان
  setTimeout(() => {
    observeReveal();
    initTilt();
  }, 100);
}

// تنفيذ عند تحميل الصفحة (فقط إذا كنا في الصفحة الرئيسية)
if (document.getElementById('services-grid')) {
  document.addEventListener('DOMContentLoaded', loadPublicData);
}

// ============================================================
// خلفية Cyberpunk WebDev 3D
// ============================================================
function initCyberpunkBG() {
  const layerBack = document.getElementById('layer-back');
  const layerMid = document.getElementById('layer-mid');
  const layerFront = document.getElementById('layer-front');
  const floatingContainer = document.getElementById('cyber-floating');
  
  if (!layerBack) return;

  const codeSnippets = [
    '01001011', '11010010', '00110011', '10101010',
    'function()', 'const dev = new', '=> { }', 'import * as',
    'SELECT *', '<div class="wow">', 'await fetch()',
    'return null;', 'console.log()', 'padding: 2rem;'
  ];

  const icons = ['</>', '{ }', '[ ]', '()', '#', ';'];

  function createMatrixRain(container, count, speedMultiplier) {
    for (let i = 0; i < count; i++) {
      const col = document.createElement('div');
      col.className = `matrix-col ${Math.random() > 0.5 ? 'green' : 'purple'}`;
      col.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
      
      const left = Math.random() * 100;
      const duration = (Math.random() * 20 + 10) * speedMultiplier;
      const delay = Math.random() * -30;
      const fontSize = Math.random() * 0.5 + 0.6; // 0.6 to 1.1 rem

      col.style.left = `${left}%`;
      col.style.animationDuration = `${duration}s`;
      col.style.animationDelay = `${delay}s`;
      col.style.fontSize = `${fontSize}rem`;
      
      container.appendChild(col);
    }
  }

  function createFloatingIcons(count) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const isCode = Math.random() > 0.4;
      el.className = `float-icon ${isCode ? 'code' : 'bracket'}`;
      el.textContent = isCode ? codeSnippets[Math.floor(Math.random() * codeSnippets.length)] : icons[Math.floor(Math.random() * icons.length)];
      
      const startX = (Math.random() * 100) - 50 + 'vw';
      const endX = (Math.random() * 100) - 50 + 'vw';
      const startZ = (Math.random() * 800) - 400 + 'px';
      const endZ = (Math.random() * 800) - 400 + 'px';
      const duration = Math.random() * 30 + 20;
      const delay = Math.random() * -40;

      el.style.setProperty('--startX', startX);
      el.style.setProperty('--endX', endX);
      el.style.setProperty('--startZ', startZ);
      el.style.setProperty('--endZ', endZ);
      el.style.animationDuration = `${duration}s`;
      el.style.animationDelay = `${delay}s`;

      floatingContainer.appendChild(el);
    }
  }

  const isMobile = window.innerWidth < 768;
  createMatrixRain(layerBack, isMobile ? 10 : 25, 2);
  createMatrixRain(layerMid, isMobile ? 8 : 15, 1.5);
  createMatrixRain(layerFront, isMobile ? 5 : 10, 1);
  createFloatingIcons(isMobile ? 10 : 25);

  // تأثير الـ Parallax العام عند تحريك الماوس
  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10; // max 5deg
    const y = (e.clientY / window.innerHeight - 0.5) * -10;
    const parallax = document.getElementById('cyber-parallax');
    if (parallax) {
      parallax.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    }
  });
}

document.addEventListener('DOMContentLoaded', initCyberpunkBG);
