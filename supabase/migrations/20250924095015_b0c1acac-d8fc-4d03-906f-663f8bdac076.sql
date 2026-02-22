-- Update RLS policies to allow public access for customers table
DROP POLICY IF EXISTS "Authenticated users can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

-- Create new policies that allow public access
CREATE POLICY "Anyone can view customers" ON public.customers
FOR SELECT USING (true);

CREATE POLICY "Anyone can create customers" ON public.customers
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update customers" ON public.customers
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete customers" ON public.customers
FOR DELETE USING (true);