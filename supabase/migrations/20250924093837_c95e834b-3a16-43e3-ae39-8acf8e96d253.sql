-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  customer_type TEXT NOT NULL,
  province TEXT,
  contact_name TEXT NOT NULL,
  phone_numbers TEXT[] NOT NULL DEFAULT '{}',
  emails TEXT[] NOT NULL DEFAULT '{}',
  line_id TEXT,
  presentation_status TEXT NOT NULL DEFAULT 'เสนอขาย',
  contact_count INTEGER NOT NULL DEFAULT 1,
  last_contact_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  interested_products TEXT,
  responsible_person TEXT NOT NULL DEFAULT 'พนักงานขายปัจจุบัน',
  customer_status TEXT NOT NULL DEFAULT 'ลูกค้าใหม่',
  how_found_us TEXT NOT NULL DEFAULT 'Facebook',
  other_channel TEXT,
  notes TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  business_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customer access
CREATE POLICY "Authenticated users can view all customers" 
ON public.customers 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customers" 
ON public.customers 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete customers" 
ON public.customers 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.customers (
  company_name, customer_type, province, contact_name, phone_numbers, emails,
  presentation_status, interested_products, customer_status, how_found_us,
  total_orders, total_value, business_type, last_contact_date
) VALUES 
(
  'บริษัท เอบีซี จำกัด', 'เจ้าของงาน', 'กรุงเทพมหานคร', 'คุณสมชาย ใจดี',
  ARRAY['02-123-4567'], ARRAY['somchai@abc.co.th'],
  'เสนอขาย', 'สินค้าทั่วไป', 'ลูกค้าประจำ', 'Facebook',
  15, 250000, 'องค์กร', '2024-01-15'
),
(
  'โรงเรียนสายรุ้ง', 'เจ้าของงาน', 'นนทบุรี', 'อาจารย์สมหญิง',
  ARRAY['081-234-5678'], ARRAY['admin@rainbow.ac.th'],
  'เสนอขาย', 'อุปกรณ์การศึกษา', 'ลูกค้าใหม่', 'Google',
  8, 120000, 'โรงเรียน', '2024-01-10'
),
(
  'สมาคมนักกีฬา', 'เจ้าของงาน', 'กรุงเทพมหานคร', 'คุณวิเชียร ชนะใจ',
  ARRAY['02-987-6543'], ARRAY['info@sportclub.org'],
  'เสนอขาย', 'อุปกรณ์กีฬา', 'ลูกค้า VIP', 'Website',
  22, 480000, 'หน่วยงาน', '2024-01-12'
);