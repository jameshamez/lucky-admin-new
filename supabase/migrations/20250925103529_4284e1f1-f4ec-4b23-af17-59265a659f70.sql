-- Update customers table to add new fields
ALTER TABLE public.customers 
ADD COLUMN address TEXT,
ADD COLUMN tax_id TEXT;

-- Add table for additional contacts
CREATE TABLE public.customer_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  line_id TEXT,
  phone_number TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on customer_contacts
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_contacts
CREATE POLICY "Anyone can view customer contacts" 
ON public.customer_contacts 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create customer contacts" 
ON public.customer_contacts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update customer contacts" 
ON public.customer_contacts 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete customer contacts" 
ON public.customer_contacts 
FOR DELETE 
USING (true);

-- Add trigger for timestamps on customer_contacts
CREATE TRIGGER update_customer_contacts_updated_at
BEFORE UPDATE ON public.customer_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for activity timeline
CREATE TABLE public.customer_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  reminder_type TEXT DEFAULT 'ไม่ต้องแจ้ง',
  contact_person TEXT,
  responsible_person TEXT,
  status TEXT NOT NULL DEFAULT 'รอดำเนินการ',
  priority TEXT NOT NULL DEFAULT 'ปานกลาง',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on customer_activities
ALTER TABLE public.customer_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_activities
CREATE POLICY "Anyone can view customer activities" 
ON public.customer_activities 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create customer activities" 
ON public.customer_activities 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update customer activities" 
ON public.customer_activities 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete customer activities" 
ON public.customer_activities 
FOR DELETE 
USING (true);

-- Add trigger for timestamps on customer_activities
CREATE TRIGGER update_customer_activities_updated_at
BEFORE UPDATE ON public.customer_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();