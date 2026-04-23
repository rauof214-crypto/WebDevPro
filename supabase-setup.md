-- =============================================
-- إعداد Supabase - الجداول والأمان
-- =============================================

-- 1. إنشاء جدول الطلبات
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إنشاء جدول الموظفين
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. تفعيل Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 4. السياسات (Policies)
-- السماح لأي شخص بإرسال طلب (الزبائن)
CREATE POLICY "Public can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- السماح للجميع بقراءة الطلبات مؤقتاً (للتجربة)
CREATE POLICY "Everyone can read orders" ON orders
  FOR SELECT USING (true);

-- السماح للجميع بتحديث حالة الطلبات مؤقتاً
CREATE POLICY "Everyone can update orders" ON orders
  FOR UPDATE USING (true);