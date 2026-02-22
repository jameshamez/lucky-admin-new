import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ActivityFormProps {
  customerId: string;
  onSave: () => void;
  onCancel: () => void;
  activityData?: any;
}

export function ActivityForm({ customerId, onSave, onCancel, activityData }: ActivityFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    activityType: activityData?.activity_type || "โทรศัพท์",
    title: activityData?.title || "",
    description: activityData?.description || "",
    startDateTime: activityData?.start_datetime ? new Date(activityData.start_datetime) : new Date(),
    endDateTime: activityData?.end_datetime ? new Date(activityData.end_datetime) : null,
    reminder: activityData?.reminder_type || "ไม่ต้องแจ้ง",
    contactPerson: activityData?.contact_person || "",
    responsiblePerson: activityData?.responsible_person || "",
    status: activityData?.status || "รอดำเนินการ",
    priority: activityData?.priority || "ปานกลาง"
  });

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกหัวข้อกิจกรรม",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      if (activityData) {
        // Update existing activity
        const { error } = await supabase
          .from('customer_activities')
          .update({
            activity_type: formData.activityType,
            title: formData.title,
            description: formData.description,
            start_datetime: formData.startDateTime.toISOString(),
            end_datetime: formData.endDateTime ? formData.endDateTime.toISOString() : null,
            reminder_type: formData.reminder,
            contact_person: formData.contactPerson || null,
            responsible_person: formData.responsiblePerson || null,
            status: formData.status,
            priority: formData.priority
          })
          .eq('id', activityData.id);

        if (error) throw error;

        toast({
          title: "สำเร็จ",
          description: "อัปเดตกิจกรรมเรียบร้อยแล้ว"
        });
      } else {
        // Create new activity
        const { error } = await supabase
          .from('customer_activities')
          .insert([
            {
              customer_id: customerId,
              activity_type: formData.activityType,
              title: formData.title,
              description: formData.description,
              start_datetime: formData.startDateTime.toISOString(),
              end_datetime: formData.endDateTime ? formData.endDateTime.toISOString() : null,
              reminder_type: formData.reminder,
              contact_person: formData.contactPerson || null,
              responsible_person: formData.responsiblePerson || null,
              status: formData.status,
              priority: formData.priority
            }
          ]);

        if (error) throw error;

        toast({
          title: "สำเร็จ",
          description: "บันทึกกิจกรรมเรียบร้อยแล้ว"
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกกิจกรรมได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Type and Title */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="activityType">ประเภทกิจกรรม</Label>
          <Select value={formData.activityType} onValueChange={(value) => setFormData({...formData, activityType: value})}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกประเภทกิจกรรม" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="โทรศัพท์">โทรศัพท์</SelectItem>
              <SelectItem value="อีเมล">อีเมล</SelectItem>
              <SelectItem value="การประชุม">การประชุม</SelectItem>
              <SelectItem value="เยี่ยมชม">เยี่ยมชม</SelectItem>
              <SelectItem value="ส่งใบเสนอราคา">ส่งใบเสนอราคา</SelectItem>
              <SelectItem value="ติดตามงาน">ติดตามงาน</SelectItem>
              <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">หัวข้อกิจกรรม</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="ระบุหัวข้อกิจกรรม"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">รายละเอียด</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="ระบุรายละเอียดของกิจกรรม"
          className="min-h-[100px]"
        />
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>วันเวลาเริ่มต้น</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !formData.startDateTime && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDateTime ? format(formData.startDateTime, "PP", { locale: th }) : "เลือกวันที่"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={formData.startDateTime}
                  onSelect={(date) => {
                    if (date) {
                      const newDateTime = new Date(formData.startDateTime);
                      newDateTime.setFullYear(date.getFullYear());
                      newDateTime.setMonth(date.getMonth());
                      newDateTime.setDate(date.getDate());
                      setFormData({...formData, startDateTime: newDateTime});
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Input
              type="time"
              value={format(formData.startDateTime, "HH:mm")}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':');
                const newDateTime = new Date(formData.startDateTime);
                newDateTime.setHours(parseInt(hours), parseInt(minutes));
                setFormData({...formData, startDateTime: newDateTime});
              }}
              className="w-32"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>วันเวลาสิ้นสุด (ไม่บังคับ)</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !formData.endDateTime && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.endDateTime ? format(formData.endDateTime, "PP", { locale: th }) : "เลือกวันที่"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={formData.endDateTime}
                  onSelect={(date) => {
                    if (date) {
                      const currentTime = formData.endDateTime || new Date();
                      const newDateTime = new Date(date);
                      newDateTime.setHours(currentTime.getHours());
                      newDateTime.setMinutes(currentTime.getMinutes());
                      setFormData({...formData, endDateTime: newDateTime});
                    } else {
                      setFormData({...formData, endDateTime: null});
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Input
              type="time"
              value={formData.endDateTime ? format(formData.endDateTime, "HH:mm") : ""}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':');
                const newDateTime = formData.endDateTime || new Date(formData.startDateTime);
                newDateTime.setHours(parseInt(hours), parseInt(minutes));
                setFormData({...formData, endDateTime: newDateTime});
              }}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Reminder */}
      <div className="space-y-2">
        <Label htmlFor="reminder">การแจ้งเตือน</Label>
        <Select value={formData.reminder} onValueChange={(value) => setFormData({...formData, reminder: value})}>
          <SelectTrigger>
            <SelectValue placeholder="เลือกการแจ้งเตือน" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ไม่ต้องแจ้ง">ไม่ต้องแจ้งเตือน</SelectItem>
            <SelectItem value="15 นาทีก่อน">15 นาทีก่อน</SelectItem>
            <SelectItem value="30 นาทีก่อน">30 นาทีก่อน</SelectItem>
            <SelectItem value="1 ชั่วโมงก่อน">1 ชั่วโมงก่อน</SelectItem>
            <SelectItem value="1 วันก่อน">1 วันก่อน</SelectItem>
            <SelectItem value="1 สัปดาห์ก่อน">1 สัปดาห์ก่อน</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contact and Responsible Person */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactPerson">ผู้ติดต่อ</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
            placeholder="ชื่อผู้ติดต่อ"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsiblePerson">ผู้รับผิดชอบ</Label>
          <Input
            id="responsiblePerson"
            value={formData.responsiblePerson}
            onChange={(e) => setFormData({...formData, responsiblePerson: e.target.value})}
            placeholder="ชื่อผู้รับผิดชอบ"
          />
        </div>
      </div>

      {/* Status and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">สถานะ</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="รอดำเนินการ">รอดำเนินการ</SelectItem>
              <SelectItem value="กำลังดำเนินการ">กำลังดำเนินการ</SelectItem>
              <SelectItem value="เสร็จสิ้น">เสร็จสิ้น</SelectItem>
              <SelectItem value="ยกเลิก">ยกเลิก</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">ระดับความสำคัญ</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกระดับความสำคัญ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ต่ำ">ต่ำ</SelectItem>
              <SelectItem value="ปานกลาง">ปานกลาง</SelectItem>
              <SelectItem value="สูง">สูง</SelectItem>
              <SelectItem value="ด่วนมาก">ด่วนมาก</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label>แนบไฟล์ (ไม่บังคับ)</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <Button type="button" variant="outline" size="sm">
              เลือกไฟล์
            </Button>
            <p className="mt-2 text-sm text-gray-500">หรือลากไฟล์มาวางที่นี่</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="button" onClick={handleSave} disabled={loading}>
          {loading ? "กำลังบันทึก..." : activityData ? "อัปเดต" : "บันทึก"}
        </Button>
      </div>
    </div>
  );
}