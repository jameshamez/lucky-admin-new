
-- Create employee status enum
CREATE TYPE public.employee_status AS ENUM ('ACTIVE', 'RESIGNED');

-- Create employees table
CREATE TABLE public.employees (
  id TEXT NOT NULL PRIMARY KEY,
  full_name TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'General' CHECK (role IN ('Sale', 'Admin', 'General')),
  status public.employee_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- RLS policies - anyone can read
CREATE POLICY "Anyone can view employees"
  ON public.employees FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert employees"
  ON public.employees FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update employees"
  ON public.employees FOR UPDATE
  USING (true);

-- No DELETE policy intentionally - prevent hard deletes

-- Trigger for updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create positions table for dynamic position management
CREATE TABLE public.employee_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view positions" ON public.employee_positions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert positions" ON public.employee_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete positions" ON public.employee_positions FOR DELETE USING (true);

-- Seed default positions
INSERT INTO public.employee_positions (name) VALUES
  ('Sales Executive'), ('Sales Manager'), ('Admin Officer'), ('HR Officer'),
  ('Graphic Designer'), ('Production Staff'), ('Procurement Officer'),
  ('Accountant'), ('Messenger'), ('Manager');

-- Seed default employees
INSERT INTO public.employees (id, full_name, nickname, position, role, status) VALUES
  ('EMP-001', 'คุณสมชาย ใจดี', 'ชาย', 'Sales Manager', 'Sale', 'ACTIVE'),
  ('EMP-002', 'คุณสมหญิง รวยเงิน', 'หญิง', 'Sales Executive', 'Sale', 'ACTIVE'),
  ('EMP-003', 'คุณวิชัย ขยัน', 'วิชัย', 'Sales Executive', 'Sale', 'ACTIVE'),
  ('EMP-004', 'คุณสมศักดิ์ ทำงาน', 'ศักดิ์', 'Sales Executive', 'Sale', 'ACTIVE'),
  ('EMP-005', 'คุณสุดา ดี', 'สุดา', 'Admin Officer', 'Admin', 'ACTIVE'),
  ('EMP-006', 'คุณประยุทธ์ เก่ง', 'ยุทธ์', 'Sales Executive', 'Sale', 'ACTIVE'),
  ('EMP-007', 'คุณนิภา สวย', 'นิภา', 'Sales Executive', 'Sale', 'ACTIVE'),
  ('EMP-008', 'คุณอรุณ แจ่มใส', 'อรุณ', 'Admin Officer', 'Admin', 'ACTIVE'),
  ('EMP-009', 'คุณสมปอง ผลิต', 'ปอง', 'Production Staff', 'General', 'ACTIVE');
