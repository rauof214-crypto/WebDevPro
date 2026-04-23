-- ══════════════════════════════════════════════
-- شغّل هذا في Supabase → SQL Editor
-- ══════════════════════════════════════════════

-- 1) جدول الخدمات
CREATE TABLE IF NOT EXISTS services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       INTEGER NOT NULL DEFAULT 0,
  badge       TEXT,
  is_featured BOOLEAN DEFAULT false,
  features    TEXT[] DEFAULT '{}',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_services" ON services;
CREATE POLICY "public_read_services"  ON services FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "auth_write_services" ON services;
CREATE POLICY "auth_write_services"   ON services FOR ALL TO authenticated USING (true);

-- 2) جدول الأعمال السابقة
CREATE TABLE IF NOT EXISTS portfolio (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  tech        TEXT,
  url         TEXT,
  img         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_portfolio" ON portfolio;
CREATE POLICY "public_read_portfolio" ON portfolio FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "auth_write_portfolio" ON portfolio;
CREATE POLICY "auth_write_portfolio"  ON portfolio FOR ALL TO authenticated USING (true);

-- 3) جدول التقييمات
CREATE TABLE IF NOT EXISTS reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_name  TEXT NOT NULL,
  reviewer_title TEXT,
  content        TEXT NOT NULL,
  rating         INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_visible     BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews"  ON reviews FOR SELECT TO anon USING (is_visible = true);

DROP POLICY IF EXISTS "auth_write_reviews" ON reviews;
CREATE POLICY "auth_write_reviews"   ON reviews FOR ALL TO authenticated USING (true);

-- 4) عمود صورة الطلب (إن لم يكن موجوداً)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS design_image_url TEXT;

-- ══════════════════════════════════════════════
-- إضافة 3 خدمات افتراضية (ليتم عرضها في الموقع مباشرة)
-- (سيتم الإضافة فقط إذا كان الجدول فارغاً لمنع التكرار)
-- ══════════════════════════════════════════════
INSERT INTO services (name, price, badge, is_featured, features)
SELECT 'موقع احترافي', 199, 'الأكثر طلباً', false, ARRAY['تصميم UI/UX عصري', 'متجاوب مع الموبايل', 'SEO محسّن', 'سرعة تحميل عالية', 'دعم فني لمدة شهر']
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'موقع احترافي');

INSERT INTO services (name, price, badge, is_featured, features)
SELECT 'متجر إلكتروني', 499, 'موصى به', true, ARRAY['لوحة تحكم كاملة', 'بوابات دفع متعددة', 'إدارة المخزون', 'تحليلات المبيعات', 'دعم فني 3 أشهر']
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'متجر إلكتروني');

INSERT INTO services (name, price, badge, is_featured, features)
SELECT 'تطبيق ويب', 999, 'متقدم', false, ARRAY['قاعدة بيانات متكاملة', 'مصادقة المستخدمين', 'API مخصصة', 'لوحة إدارة', 'دعم فني 6 أشهر']
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'تطبيق ويب');
