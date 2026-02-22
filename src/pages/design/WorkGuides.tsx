import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Play, 
  BookOpen, 
  ClipboardCheck, 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical,
  Search,
  Bookmark,
  Upload,
  ChevronRight,
  Video,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
  Palette,
  FileImage
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function WorkGuides() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookmarkedItems, setBookmarkedItems] = useState<string[]>([]);

  // Mock data for videos
  const videos = [
    { 
      id: 1, 
      title: "การใช้งาน Adobe Illustrator สำหรับถ้วยรางวัล", 
      description: "เรียนรู้เทคนิคการออกแบบถ้วยรางวัลด้วย Adobe Illustrator",
      thumbnail: "/placeholder.svg",
      duration: "25:30",
      views: 145,
      category: "โปรแกรม"
    },
    { 
      id: 2, 
      title: "เทคนิคการสลักข้อความให้สวยงาม", 
      description: "วิธีการออกแบบและจัดวางข้อความสำหรับการสลัก",
      thumbnail: "/placeholder.svg",
      duration: "15:20",
      views: 98,
      category: "เทคนิค"
    },
    { 
      id: 3, 
      title: "การเลือกสีที่เหมาะสมสำหรับรางวัล", 
      description: "หลักการเลือกสีและจับคู่สีสำหรับงานรางวัล",
      thumbnail: "/placeholder.svg",
      duration: "12:45",
      views: 120,
      category: "สี"
    },
    { 
      id: 4, 
      title: "การเตรียมไฟล์สำหรับส่งผลิต", 
      description: "ขั้นตอนการเตรียมและตรวจสอบไฟล์ก่อนส่งผลิต",
      thumbnail: "/placeholder.svg",
      duration: "18:15",
      views: 156,
      category: "เทคนิค"
    },
    { 
      id: 5, 
      title: "การออกแบบเหรียญรางวัล 3D", 
      description: "เทคนิคการสร้างเหรียญแบบ 3D และการใช้ Mockup",
      thumbnail: "/placeholder.svg",
      duration: "22:30",
      views: 89,
      category: "โปรแกรม"
    },
    { 
      id: 6, 
      title: "มาตรฐานการออกแบบโล่รางวัล", 
      description: "ข้อกำหนดและแนวทางการออกแบบโล่รางวัล",
      thumbnail: "/placeholder.svg",
      duration: "16:40",
      views: 112,
      category: "มาตรฐาน"
    }
  ];

  // Mock data for manual content
  const manualContent = [
    {
      id: 1,
      category: "การเริ่มต้น",
      title: "พื้นฐานการออกแบบรางวัล",
      subcategories: [
        { 
          id: 1, 
          title: "หลักการออกแบบรางวัล", 
          content: "การออกแบบรางวัลต้องคำนึงถึง ความสวยงาม ความเหมาะสมกับประเภทของรางวัล และความเป็นเอกลักษณ์ ควรเลือกใช้สีและรูปแบบที่สื่อถึงความยิ่งใหญ่และความสำเร็จ...",
          attachments: ["คู่มือพื้นฐาน.pdf"]
        },
        { 
          id: 2, 
          title: "เครื่องมือที่ใช้ในการออกแบบ", 
          content: "โปรแกรมหลักที่ใช้: Adobe Illustrator, Adobe Photoshop, CorelDRAW การตั้งค่าเอกสารสำหรับงานพิมพ์: CMYK color mode, Resolution 300 DPI, Bleed 3mm...",
          attachments: []
        },
        { 
          id: 3, 
          title: "ขนาดและสัดส่วนมาตรฐาน", 
          content: "ขนาดมาตรฐานของรางวัลแต่ละประเภท:\n- เหรียญ: เส้นผ่านศูนย์กลาง 50-70mm\n- ถ้วย: สูง 15-40cm\n- โล่: กว้าง 15-30cm สูง 20-40cm...",
          attachments: ["ตารางขนาดมาตรฐาน.pdf"]
        }
      ]
    },
    {
      id: 2,
      category: "การออกแบบ",
      title: "เทคนิคการออกแบบเหรียญ",
      subcategories: [
        { 
          id: 1, 
          title: "การจัดองค์ประกอบ", 
          content: "หลักการจัดวางองค์ประกอบบนเหรียญ:\n1. จัดส่วนสำคัญไว้ตรงกลาง\n2. ใช้วงกลมหรือเส้นโค้งเป็นกรอบ\n3. สมดุลระหว่างภาพและข้อความ\n4. เว้นระยะขอบอย่างน้อย 3mm...",
          attachments: ["ตัวอย่างองค์ประกอบ.jpg"]
        },
        { 
          id: 2, 
          title: "การเลือกใช้ฟอนต์", 
          content: "ฟอนต์ที่แนะนำสำหรับเหรียญ:\n- ฟอนต์ไทย: Sarabun, Prompt, Kanit\n- ฟอนต์อังกฤษ: Times New Roman, Garamond, Trajan\nขนาดอักษรต้องไม่เล็กเกิน 8pt...",
          attachments: ["ตัวอย่างฟอนต์.pdf"]
        },
        { 
          id: 3, 
          title: "การใช้สีและเอฟเฟกต์", 
          content: "การเลือกใช้สีสำหรับเหรียญ:\n- ทองคำ: C:0 M:20 Y:80 K:20\n- เงิน: C:0 M:0 Y:0 K:25\n- ทองแดง: C:0 M:50 Y:100 K:0\nเอฟเฟกต์: Gradient, Emboss, 3D...",
          attachments: []
        }
      ]
    },
    {
      id: 3,
      category: "การออกแบบ",
      title: "เทคนิคการออกแบบถ้วยรางวัล",
      subcategories: [
        { 
          id: 1, 
          title: "รูปแบบและสไตล์", 
          content: "ถ้วยรางวัลมีหลายรูปแบบ:\n1. Classic Style - ทรงโบราณสง่างาม\n2. Modern Style - ทรงเรียบง่ายสมัยใหม่\n3. Sport Style - เหมาะกับกีฬา\n4. Custom Style - ออกแบบพิเศษตามความต้องการ...",
          attachments: ["คู่มือสไตล์ถ้วย.pdf"]
        },
        { 
          id: 2, 
          title: "การออกแบบลวดลาย", 
          content: "หลักการออกแบบลวดลายบนถ้วย:\n- ใช้ลวดลายที่เหมาะกับโอกาส\n- ไม่ซับซ้อนจนเกินไป\n- พิจารณาวิธีการผลิต (สลัก, แกะ, ฉลุ)\n- ทดสอบกับขนาดจริง...",
          attachments: []
        }
      ]
    },
    {
      id: 4,
      category: "การส่งผลิต",
      title: "การเตรียมไฟล์สำหรับผลิต",
      subcategories: [
        { 
          id: 1, 
          title: "ข้อกำหนดไฟล์", 
          content: "ไฟล์ต้องมีคุณสมบัติ:\n- รูปแบบ: AI, PDF, EPS\n- สี: CMYK หรือ Pantone\n- Resolution: 300 DPI\n- Font: Convert to Outlines\n- Bleed: 3mm\n- ตรวจสอบ Layer และ Clipping Mask...",
          attachments: ["Checklist การส่งไฟล์.pdf"]
        },
        { 
          id: 2, 
          title: "การส่งมอบงาน", 
          content: "ขั้นตอนการส่งงานให้ฝ่ายผลิต:\n1. ตรวจสอบไฟล์ตาม Checklist\n2. บันทึกไฟล์ตามรูปแบบที่กำหนด\n3. จัดทำ Mockup Preview\n4. กรอกใบส่งงานในระบบ\n5. แนบไฟล์และข้อมูลครบถ้วน...",
          attachments: ["แบบฟอร์มส่งงาน.pdf"]
        },
        { 
          id: 3, 
          title: "การแก้ไขและ Feedback", 
          content: "กระบวนการแก้ไขงาน:\n- รับ Feedback จากลูกค้าหรือฝ่ายผลิต\n- บันทึก Version Control\n- แก้ไขตามข้อเสนอแนะ\n- ส่งไฟล์แก้ไขพร้อมเอกสาร Revision Note...",
          attachments: []
        }
      ]
    }
  ];

  // Mock data for assessments
  const assessments = [
    { 
      id: 1, 
      title: "แบบทดสอบพื้นฐานการออกแบบรางวัล", 
      questions: 15,
      duration: "20 นาที",
      category: "พื้นฐาน",
      status: "ยังไม่ได้ทำ",
      passingScore: 80
    },
    { 
      id: 2, 
      title: "แบบทดสอบการใช้ Adobe Illustrator", 
      questions: 20,
      duration: "25 นาที",
      category: "โปรแกรม",
      status: "ผ่าน",
      score: 90,
      passingScore: 80
    },
    { 
      id: 3, 
      title: "แบบทดสอบมาตรฐานการส่งไฟล์ผลิต", 
      questions: 12,
      duration: "15 นาที",
      category: "เทคนิค",
      status: "รอตรวจ",
      passingScore: 80
    },
    { 
      id: 4, 
      title: "แบบทดสอบการเลือกสีและฟอนต์", 
      questions: 10,
      duration: "12 นาที",
      category: "ออกแบบ",
      status: "ยังไม่ได้ทำ",
      passingScore: 75
    }
  ];

  const toggleBookmark = (id: string) => {
    setBookmarkedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ผ่าน":
        return "bg-green-500";
      case "รอตรวจ":
        return "bg-yellow-500";
      case "ไม่ผ่าน":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">คู่มือการทำงาน</h1>
        <p className="text-muted-foreground">ศูนย์รวมความรู้และคู่มือการใช้งานสำหรับฝ่ายกราฟิก</p>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            วิดีโอสอนงาน
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            คู่มือเนื้อหา
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            แบบทดสอบ
          </TabsTrigger>
        </TabsList>

        {/* Video Tutorials Section */}
        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>วิดีโอสอนงาน</CardTitle>
                  <CardDescription>คลิปวิดีโอแนะนำเทคนิคการออกแบบและการใช้โปรแกรม</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      เพิ่มวิดีโอ
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>เพิ่มวิดีโอใหม่</DialogTitle>
                      <DialogDescription>อัปโหลดวิดีโอหรือใส่ลิงก์ YouTube</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="video-title">ชื่อวิดีโอ *</Label>
                        <Input id="video-title" placeholder="กรอกชื่อวิดีโอ" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="video-description">คำอธิบายสั้น ๆ</Label>
                        <Textarea id="video-description" placeholder="กรอกคำอธิบาย" rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="video-category">หมวดหมู่</Label>
                        <Select>
                          <SelectTrigger id="video-category">
                            <SelectValue placeholder="เลือกหมวดหมู่" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="program">โปรแกรม</SelectItem>
                            <SelectItem value="technique">เทคนิค</SelectItem>
                            <SelectItem value="color">สี</SelectItem>
                            <SelectItem value="standard">มาตรฐาน</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>ประเภทวิดีโอ</Label>
                        <Tabs defaultValue="upload" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload">อัปโหลดไฟล์</TabsTrigger>
                            <TabsTrigger value="link">ลิงก์ YouTube</TabsTrigger>
                          </TabsList>
                          <TabsContent value="upload" className="space-y-2">
                            <Label htmlFor="video-file">ไฟล์วิดีโอ</Label>
                            <Input id="video-file" type="file" accept="video/*" />
                          </TabsContent>
                          <TabsContent value="link" className="space-y-2">
                            <Label htmlFor="video-url">URL วิดีโอ</Label>
                            <Input id="video-url" placeholder="https://youtube.com/watch?v=..." />
                          </TabsContent>
                        </Tabs>
                      </div>
                      <Button className="w-full">บันทึกวิดีโอ</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="ค้นหาวิดีโอ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="relative aspect-video bg-muted">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-8 h-8 text-primary ml-1" />
                        </div>
                      </div>
                      <Badge className="absolute top-2 right-2 bg-black/70 text-white">{video.duration}</Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{video.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">{video.category}</Badge>
                        <span className="text-xs text-muted-foreground">{video.views} views</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Content Section */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>คู่มือเนื้อหา</CardTitle>
                  <CardDescription>เอกสารและคู่มือการออกแบบแบบละเอียด</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      เพิ่มคู่มือ
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>เพิ่มคู่มือใหม่</DialogTitle>
                      <DialogDescription>สร้างเอกสารคู่มือการออกแบบ</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="manual-category">หมวดหมู่หลัก *</Label>
                        <Input id="manual-category" placeholder="เช่น การเริ่มต้น, การออกแบบ" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-title">หัวข้อหลัก *</Label>
                        <Input id="manual-title" placeholder="กรอกหัวข้อหลัก" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-subtitle">หัวข้อย่อย</Label>
                        <Input id="manual-subtitle" placeholder="กรอกหัวข้อย่อย" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-content">เนื้อหา *</Label>
                        <Textarea id="manual-content" placeholder="กรอกเนื้อหาคู่มือ" rows={10} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-files">ไฟล์แนบ (PDF, AI, PSD)</Label>
                        <Input id="manual-files" type="file" accept=".pdf,.ai,.psd" multiple />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-images">รูปภาพประกอบ</Label>
                        <Input id="manual-images" type="file" accept="image/*" multiple />
                      </div>
                      <Button className="w-full">บันทึกคู่มือ</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="ค้นหาคู่มือ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {manualContent.map((section) => (
                  <AccordionItem key={section.id} value={`section-${section.id}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold">{section.title}</p>
                          <p className="text-sm text-muted-foreground">{section.category}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-8">
                        {section.subcategories.map((sub) => (
                          <Card key={sub.id} className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{sub.title}</h4>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => toggleBookmark(`${section.id}-${sub.id}`)}
                                  >
                                    <Bookmark 
                                      className={`w-4 h-4 ${
                                        bookmarkedItems.includes(`${section.id}-${sub.id}`) 
                                          ? 'fill-yellow-500 text-yellow-500' 
                                          : ''
                                      }`} 
                                    />
                                  </Button>
                                </div>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                  {sub.content}
                                </p>
                              </div>
                            </div>
                            {sub.attachments && sub.attachments.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-semibold mb-2">ไฟล์แนบ:</p>
                                <div className="flex flex-wrap gap-2">
                                  {sub.attachments.map((file, idx) => (
                                    <Badge key={idx} variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
                                      <FileText className="w-3 h-3" />
                                      {file}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-3 h-3 mr-1" />
                                แก้ไข
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-3 h-3 mr-1" />
                                ลบ
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessment Section */}
        <TabsContent value="assessment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>แบบทดสอบความรู้</CardTitle>
                  <CardDescription>ทดสอบความรู้และทักษะการออกแบบ</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      สร้างแบบทดสอบ
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>สร้างแบบทดสอบใหม่</DialogTitle>
                      <DialogDescription>สร้างแบบทดสอบสำหรับพนักงาน</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="quiz-title">ชื่อแบบทดสอบ *</Label>
                        <Input id="quiz-title" placeholder="กรอกชื่อแบบทดสอบ" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quiz-category">หมวดหมู่</Label>
                          <Select>
                            <SelectTrigger id="quiz-category">
                              <SelectValue placeholder="เลือกหมวดหมู่" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">พื้นฐาน</SelectItem>
                              <SelectItem value="program">โปรแกรม</SelectItem>
                              <SelectItem value="technique">เทคนิค</SelectItem>
                              <SelectItem value="design">ออกแบบ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quiz-duration">ระยะเวลา (นาที)</Label>
                          <Input id="quiz-duration" type="number" placeholder="15" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quiz-passing">คะแนนผ่าน (%)</Label>
                        <Input id="quiz-passing" type="number" placeholder="80" />
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <Label>คำถาม</Label>
                        <div className="space-y-4 p-4 border rounded-lg">
                          <Input placeholder="คำถามที่ 1" />
                          <div className="space-y-2 pl-4">
                            <Input placeholder="ตัวเลือก A" />
                            <Input placeholder="ตัวเลือก B" />
                            <Input placeholder="ตัวเลือก C" />
                            <Input placeholder="ตัวเลือก D" />
                          </div>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกคำตอบที่ถูกต้อง" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="a">ตัวเลือก A</SelectItem>
                              <SelectItem value="b">ตัวเลือก B</SelectItem>
                              <SelectItem value="c">ตัวเลือก C</SelectItem>
                              <SelectItem value="d">ตัวเลือก D</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="outline" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          เพิ่มคำถาม
                        </Button>
                      </div>
                      <Button className="w-full">สร้างแบบทดสอบ</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <Card key={assessment.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardCheck className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold">{assessment.title}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span>{assessment.questions} คำถาม</span>
                          <span>•</span>
                          <span>{assessment.duration}</span>
                          <span>•</span>
                          <Badge variant="outline">{assessment.category}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(assessment.status)}`} />
                          <span className="text-sm">
                            {assessment.status}
                            {assessment.score && ` (${assessment.score}%)`}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            คะแนนผ่าน: {assessment.passingScore}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button>เริ่มทำ</Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-semibold mb-4">ประวัติการทำแบบทดสอบ</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>แบบทดสอบ</TableHead>
                      <TableHead>วันที่ทำ</TableHead>
                      <TableHead>คะแนน</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>แบบทดสอบการใช้ Adobe Illustrator</TableCell>
                      <TableCell>15/01/2025</TableCell>
                      <TableCell>90%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">ผ่าน</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">ดูรายละเอียด</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>แบบทดสอบมาตรฐานการส่งไฟล์ผลิต</TableCell>
                      <TableCell>10/01/2025</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <Badge variant="secondary">รอตรวจ</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">ดูรายละเอียด</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}