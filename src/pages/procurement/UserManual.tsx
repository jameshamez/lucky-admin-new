import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Video,
  BookOpen,
  ClipboardCheck,
  Plus,
  Edit,
  Trash2,
  Play,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
}

interface ManualSection {
  id: string;
  category: string;
  subcategories: {
    id: string;
    title: string;
    content: string;
    attachments?: string[];
  }[];
}

interface Quiz {
  id: string;
  title: string;
  category: string;
  questions: number;
  passingScore: number;
}

export default function UserManual() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin] = useState(true); // Demo: set based on user role

  const [videos, setVideos] = useState<VideoTutorial[]>([
    {
      id: "1",
      title: "วิธีการทำงาน",
      description: "แนะนำขั้นตอนการทำงานพื้นฐาน",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg",
    },
    {
      id: "2",
      title: "ขั้นตอนเปิดใบเสนอราคา",
      description: "วิธีการสร้างและจัดการใบเสนอราคา",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg",
    },
    {
      id: "3",
      title: "การค้นหาสินค้าในสต็อก",
      description: "วิธีการค้นหาและตรวจสอบสต็อกสินค้า",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg",
    },
  ]);

  const [manuals, setManuals] = useState<ManualSection[]>([
    {
      id: "1",
      category: "การขออนุมัติเบิกค่าใช้จ่าย",
      subcategories: [
        {
          id: "1-1",
          title: "การกรอกฟอร์มคำขอเบิก",
          content: "ขั้นตอนการกรอกฟอร์มคำขอเบิกค่าใช้จ่ายอย่างถูกต้อง...",
          attachments: ["form-template.pdf"],
        },
        {
          id: "1-2",
          title: "เอกสารที่ต้องแนบ",
          content: "รายการเอกสารที่จำเป็นต้องแนบพร้อมคำขอ...",
        },
        {
          id: "1-3",
          title: "เงื่อนไขการอนุมัติ",
          content: "เงื่อนไขและขั้นตอนการอนุมัติค่าใช้จ่าย...",
        },
      ],
    },
    {
      id: "2",
      category: "การใช้ระบบบัญชีพื้นฐาน",
      subcategories: [
        {
          id: "2-1",
          title: "การเข้าสู่ระบบ",
          content: "วิธีการ login และ setup บัญชีผู้ใช้...",
        },
        {
          id: "2-2",
          title: "หน้า Dashboard",
          content: "การใช้งานหน้า Dashboard และเข้าใจข้อมูลต่างๆ...",
        },
        {
          id: "2-3",
          title: "การดูรายงานส่วนตัว",
          content: "วิธีการดูและ export รายงาน...",
        },
      ],
    },
  ]);

  const [quizzes, setQuizzes] = useState<Quiz[]>([
    {
      id: "1",
      title: "ทดสอบความรู้พื้นฐานการทำงาน",
      category: "พื้นฐาน",
      questions: 10,
      passingScore: 70,
    },
    {
      id: "2",
      title: "ทดสอบการใช้ระบบจัดซื้อ",
      category: "การจัดซื้อ",
      questions: 15,
      passingScore: 80,
    },
  ]);

  const filteredVideos = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredManuals = manuals.filter((m) =>
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteVideo = (id: string) => {
    if (confirm("ต้องการลบวิดีโอนี้หรือไม่?")) {
      setVideos((prev) => prev.filter((v) => v.id !== id));
      toast.success("ลบวิดีโอเรียบร้อย");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">คู่มือการทำงาน</h1>
        <p className="text-muted-foreground mt-2">
          ศูนย์กลางการเรียนรู้และพัฒนาทักษะการทำงาน
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาคู่มือ, วิดีโอ หรือแบบทดสอบ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="videos">
            <Video className="mr-2 h-4 w-4" />
            วิดีโอสอนงาน
          </TabsTrigger>
          <TabsTrigger value="manuals">
            <BookOpen className="mr-2 h-4 w-4" />
            คู่มือ (เนื้อหา)
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            แบบทดสอบ
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Video Tutorials */}
        <TabsContent value="videos">
          <div className="space-y-4">
            {isAdmin && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>จัดการวิดีโอ (Admin)</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          เพิ่มวิดีโอ
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>เพิ่มวิดีโอใหม่</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>ชื่อหัวข้อ</Label>
                            <Input placeholder="ระบุชื่อหัวข้อวิดีโอ" />
                          </div>
                          <div>
                            <Label>คำอธิบาย</Label>
                            <Textarea placeholder="คำอธิบายสั้นๆ" rows={3} />
                          </div>
                          <div>
                            <Label>ลิงก์วิดีโอ (YouTube/Upload)</Label>
                            <Input placeholder="https://youtube.com/..." />
                          </div>
                          <div>
                            <Label>อัปโหลดไฟล์วิดีโอ</Label>
                            <Input type="file" accept="video/*" />
                          </div>
                          <Button
                            onClick={() => toast.success("เพิ่มวิดีโอเรียบร้อย")}
                            className="w-full"
                          >
                            บันทึก
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
              </Card>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-40 object-cover"
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          className="absolute inset-0 m-auto w-16 h-16 rounded-full"
                        >
                          <Play className="h-8 w-8" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>{video.title}</DialogTitle>
                        </DialogHeader>
                        <div className="aspect-video">
                          <iframe
                            width="100%"
                            height="100%"
                            src={video.videoUrl}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base">{video.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {video.description}
                    </p>
                    {isAdmin && (
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="mr-2 h-3 w-3" />
                          แก้ไข
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteVideo(video.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Manuals */}
        <TabsContent value="manuals">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>คู่มือการทำงาน</CardTitle>
                {isAdmin && (
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มหัวข้อ
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredManuals.map((section) => (
                  <AccordionItem key={section.id} value={section.id}>
                    <AccordionTrigger className="text-lg font-semibold">
                      {section.category}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pl-4">
                        {section.subcategories.map((sub) => (
                          <Card key={sub.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                  {sub.title}
                                </CardTitle>
                                {isAdmin && (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {sub.content}
                              </p>
                              {sub.attachments && sub.attachments.length > 0 && (
                                <div className="mt-4">
                                  <Label className="text-xs">
                                    ไฟล์แนบ:
                                  </Label>
                                  <div className="flex gap-2 mt-2">
                                    {sub.attachments.map((file, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="cursor-pointer"
                                      >
                                        📄 {file}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
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

        {/* Tab 3: Quizzes */}
        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>แบบทดสอบความรู้</CardTitle>
                {isAdmin && (
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    สร้างแบบทดสอบ
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{quiz.title}</CardTitle>
                        <Badge>{quiz.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        จำนวนคำถาม: {quiz.questions} ข้อ
                      </p>
                      <p className="text-sm text-muted-foreground">
                        คะแนนผ่าน: {quiz.passingScore}%
                      </p>
                      <Button className="w-full mt-4">เริ่มทำแบบทดสอบ</Button>
                      {isAdmin && (
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="mr-2 h-3 w-3" />
                            แก้ไข
                          </Button>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
