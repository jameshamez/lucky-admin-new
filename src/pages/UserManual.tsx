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
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

interface Quiz {
  id: string;
  title: string;
  category: string;
  questions: number;
  passingScore: number;
  questionList: QuizQuestion[];
}

const emptyVideo: VideoTutorial = { id: "", title: "", description: "", videoUrl: "", thumbnail: "/placeholder.svg" };
const emptyQuiz: Quiz = { id: "", title: "", category: "", questions: 10, passingScore: 70, questionList: [] };

export default function UserManual() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin] = useState(true);

  // --- Data states ---
  const [videos, setVideos] = useState<VideoTutorial[]>([
    { id: "1", title: "วิธีการทำงาน", description: "แนะนำขั้นตอนการทำงานพื้นฐาน", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "/placeholder.svg" },
    { id: "2", title: "ขั้นตอนเปิดใบเสนอราคา", description: "วิธีการสร้างและจัดการใบเสนอราคา", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "/placeholder.svg" },
    { id: "3", title: "การค้นหาสินค้าในสต็อก", description: "วิธีการค้นหาและตรวจสอบสต็อกสินค้า", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", thumbnail: "/placeholder.svg" },
  ]);

  const [manuals, setManuals] = useState<ManualSection[]>([
    {
      id: "1", category: "การขออนุมัติเบิกค่าใช้จ่าย",
      subcategories: [
        { id: "1-1", title: "การกรอกฟอร์มคำขอเบิก", content: "ขั้นตอนการกรอกฟอร์มคำขอเบิกค่าใช้จ่ายอย่างถูกต้อง...", attachments: ["form-template.pdf"] },
        { id: "1-2", title: "เอกสารที่ต้องแนบ", content: "รายการเอกสารที่จำเป็นต้องแนบพร้อมคำขอ..." },
        { id: "1-3", title: "เงื่อนไขการอนุมัติ", content: "เงื่อนไขและขั้นตอนการอนุมัติค่าใช้จ่าย..." },
      ],
    },
    {
      id: "2", category: "การใช้ระบบบัญชีพื้นฐาน",
      subcategories: [
        { id: "2-1", title: "การเข้าสู่ระบบ", content: "วิธีการ login และ setup บัญชีผู้ใช้..." },
        { id: "2-2", title: "หน้า Dashboard", content: "การใช้งานหน้า Dashboard และฟีเจอร์ต่างๆ..." },
        { id: "2-3", title: "การดูรายงานส่วนตัว", content: "วิธีการดูและ export รายงาน..." },
      ],
    },
  ]);

  const [quizzes, setQuizzes] = useState<Quiz[]>([
    { id: "1", title: "ทดสอบความรู้พื้นฐานการทำงาน", category: "พื้นฐาน", questions: 3, passingScore: 70, questionList: [
      { id: "q1", question: "ขั้นตอนแรกในการเปิดใบเสนอราคาคืออะไร?", options: ["เลือกลูกค้า", "พิมพ์เอกสาร", "ส่งอีเมล", "โทรหาลูกค้า"], correctIndex: 0 },
      { id: "q2", question: "ระบบจัดเก็บข้อมูลลูกค้าอยู่ในเมนูใด?", options: ["รายงาน", "ตั้งค่า", "การขาย", "บัญชี"], correctIndex: 2 },
      { id: "q3", question: "การขออนุมัติเบิกค่าใช้จ่ายต้องแนบเอกสารอะไร?", options: ["ใบเสร็จรับเงิน", "สำเนาบัตรประชาชน", "ใบสมัครงาน", "หนังสือรับรอง"], correctIndex: 0 },
    ]},
    { id: "2", title: "ทดสอบการใช้ระบบจัดซื้อ", category: "การจัดซื้อ", questions: 3, passingScore: 80, questionList: [
      { id: "q4", question: "ใบสั่งซื้อ (PO) ต้องได้รับอนุมัติจากใคร?", options: ["พนักงานขาย", "ผู้จัดการฝ่ายจัดซื้อ", "ลูกค้า", "พนักงานคลัง"], correctIndex: 1 },
      { id: "q5", question: "การเปรียบเทียบราคาควรขอจากผู้ขายกี่ราย?", options: ["1 ราย", "อย่างน้อย 2 ราย", "อย่างน้อย 3 ราย", "5 ราย"], correctIndex: 2 },
      { id: "q6", question: "เมื่อได้รับสินค้าต้องตรวจสอบอะไรก่อน?", options: ["ราคา", "จำนวนและสภาพสินค้า", "ชื่อผู้ส่ง", "วันหมดอายุ"], correctIndex: 1 },
    ]},
  ]);

  // --- Dialog states ---
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [editVideo, setEditVideo] = useState<VideoTutorial>(emptyVideo);
  const [isVideoAdd, setIsVideoAdd] = useState(false);

  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [editManualCategory, setEditManualCategory] = useState("");
  const [isManualAdd, setIsManualAdd] = useState(false);
  const [editManualId, setEditManualId] = useState("");

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editSub, setEditSub] = useState({ sectionId: "", id: "", title: "", content: "" });
  const [isSubAdd, setIsSubAdd] = useState(false);

  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editQuiz, setEditQuiz] = useState<Quiz>(emptyQuiz);
  const [isQuizAdd, setIsQuizAdd] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; parentId?: string } | null>(null);

  // --- Quiz Taking ---
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const submitQuiz = () => {
    setQuizSubmitted(true);
  };

  const quizScore = activeQuiz ? (() => {
    let correct = 0;
    activeQuiz.questionList.forEach(q => {
      if (quizAnswers[q.id] === q.correctIndex) correct++;
    });
    return { correct, total: activeQuiz.questionList.length, percent: Math.round((correct / activeQuiz.questionList.length) * 100) };
  })() : null;

  // --- Filters ---
  const filteredVideos = videos.filter(v =>
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) || v.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredManuals = manuals.filter(m =>
    m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subcategories.some(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) || q.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Video CRUD ---
  const openAddVideo = () => { setIsVideoAdd(true); setEditVideo({ ...emptyVideo, id: crypto.randomUUID() }); setVideoDialogOpen(true); };
  const openEditVideo = (v: VideoTutorial) => { setIsVideoAdd(false); setEditVideo({ ...v }); setVideoDialogOpen(true); };
  const saveVideo = () => {
    if (!editVideo.title.trim()) { toast.error("กรุณาระบุชื่อหัวข้อ"); return; }
    if (isVideoAdd) {
      setVideos(prev => [...prev, editVideo]);
      toast.success("เพิ่มวิดีโอเรียบร้อย");
    } else {
      setVideos(prev => prev.map(v => v.id === editVideo.id ? editVideo : v));
      toast.success("แก้ไขวิดีโอเรียบร้อย");
    }
    setVideoDialogOpen(false);
  };

  // --- Manual CRUD ---
  const openAddManual = () => { setIsManualAdd(true); setEditManualCategory(""); setEditManualId(crypto.randomUUID()); setManualDialogOpen(true); };
  const openEditManual = (section: ManualSection) => { setIsManualAdd(false); setEditManualCategory(section.category); setEditManualId(section.id); setManualDialogOpen(true); };
  const saveManual = () => {
    if (!editManualCategory.trim()) { toast.error("กรุณาระบุชื่อหัวข้อ"); return; }
    if (isManualAdd) {
      setManuals(prev => [...prev, { id: editManualId, category: editManualCategory, subcategories: [] }]);
      toast.success("เพิ่มหัวข้อเรียบร้อย");
    } else {
      setManuals(prev => prev.map(m => m.id === editManualId ? { ...m, category: editManualCategory } : m));
      toast.success("แก้ไขหัวข้อเรียบร้อย");
    }
    setManualDialogOpen(false);
  };

  // --- Subcategory CRUD ---
  const openAddSub = (sectionId: string) => { setIsSubAdd(true); setEditSub({ sectionId, id: crypto.randomUUID(), title: "", content: "" }); setSubDialogOpen(true); };
  const openEditSub = (sectionId: string, sub: { id: string; title: string; content: string }) => {
    setIsSubAdd(false); setEditSub({ sectionId, id: sub.id, title: sub.title, content: sub.content }); setSubDialogOpen(true);
  };
  const saveSub = () => {
    if (!editSub.title.trim()) { toast.error("กรุณาระบุชื่อหัวข้อย่อย"); return; }
    setManuals(prev => prev.map(m => {
      if (m.id !== editSub.sectionId) return m;
      if (isSubAdd) {
        return { ...m, subcategories: [...m.subcategories, { id: editSub.id, title: editSub.title, content: editSub.content }] };
      } else {
        return { ...m, subcategories: m.subcategories.map(s => s.id === editSub.id ? { ...s, title: editSub.title, content: editSub.content } : s) };
      }
    }));
    toast.success(isSubAdd ? "เพิ่มหัวข้อย่อยเรียบร้อย" : "แก้ไขหัวข้อย่อยเรียบร้อย");
    setSubDialogOpen(false);
  };

  // --- Quiz CRUD ---
  const openAddQuiz = () => { setIsQuizAdd(true); setEditQuiz({ ...emptyQuiz, id: crypto.randomUUID() }); setQuizDialogOpen(true); };
  const openEditQuiz = (q: Quiz) => { setIsQuizAdd(false); setEditQuiz({ ...q }); setQuizDialogOpen(true); };
  const saveQuiz = () => {
    if (!editQuiz.title.trim()) { toast.error("กรุณาระบุชื่อแบบทดสอบ"); return; }
    if (isQuizAdd) {
      setQuizzes(prev => [...prev, editQuiz]);
      toast.success("สร้างแบบทดสอบเรียบร้อย");
    } else {
      setQuizzes(prev => prev.map(q => q.id === editQuiz.id ? editQuiz : q));
      toast.success("แก้ไขแบบทดสอบเรียบร้อย");
    }
    setQuizDialogOpen(false);
  };

  // --- Delete ---
  const openDelete = (type: string, id: string, parentId?: string) => { setDeleteTarget({ type, id, parentId }); setDeleteDialogOpen(true); };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { type, id, parentId } = deleteTarget;
    if (type === "video") {
      setVideos(prev => prev.filter(v => v.id !== id));
    } else if (type === "manual") {
      setManuals(prev => prev.filter(m => m.id !== id));
    } else if (type === "sub" && parentId) {
      setManuals(prev => prev.map(m => m.id === parentId ? { ...m, subcategories: m.subcategories.filter(s => s.id !== id) } : m));
    } else if (type === "quiz") {
      setQuizzes(prev => prev.filter(q => q.id !== id));
    }
    toast.success("ลบข้อมูลเรียบร้อย");
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">คู่มือการทำงาน</h1>
        <p className="text-muted-foreground mt-2">ศูนย์กลางการเรียนรู้และพัฒนาทักษะการทำงาน</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ค้นหาคู่มือ, วิดีโอ หรือแบบทดสอบ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบข้อมูล</AlertDialogTitle>
            <AlertDialogDescription>คุณแน่ใจหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">ลบข้อมูล</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isVideoAdd ? "เพิ่มวิดีโอใหม่" : "แก้ไขวิดีโอ"}</DialogTitle>
            <DialogDescription>{isVideoAdd ? "กรอกข้อมูลวิดีโอที่ต้องการเพิ่ม" : "แก้ไขข้อมูลวิดีโอ"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อหัวข้อ</Label>
              <Input value={editVideo.title} onChange={e => setEditVideo({ ...editVideo, title: e.target.value })} placeholder="ระบุชื่อหัวข้อวิดีโอ" />
            </div>
            <div className="space-y-2">
              <Label>คำอธิบาย</Label>
              <Textarea value={editVideo.description} onChange={e => setEditVideo({ ...editVideo, description: e.target.value })} placeholder="คำอธิบายสั้นๆ" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>ลิงก์วิดีโอ (YouTube Embed URL)</Label>
              <Input value={editVideo.videoUrl} onChange={e => setEditVideo({ ...editVideo, videoUrl: e.target.value })} placeholder="https://www.youtube.com/embed/..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveVideo} className="gap-2"><Save className="w-4 h-4" />บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Category Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isManualAdd ? "เพิ่มหัวข้อใหม่" : "แก้ไขหัวข้อ"}</DialogTitle>
            <DialogDescription>{isManualAdd ? "กรอกชื่อหัวข้อหมวดหมู่ใหม่" : "แก้ไขชื่อหัวข้อหมวดหมู่"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อหัวข้อ</Label>
              <Input value={editManualCategory} onChange={e => setEditManualCategory(e.target.value)} placeholder="เช่น การขออนุมัติเบิกค่าใช้จ่าย" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveManual} className="gap-2"><Save className="w-4 h-4" />บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSubAdd ? "เพิ่มหัวข้อย่อย" : "แก้ไขหัวข้อย่อย"}</DialogTitle>
            <DialogDescription>{isSubAdd ? "กรอกข้อมูลหัวข้อย่อยใหม่" : "แก้ไขข้อมูลหัวข้อย่อย"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อหัวข้อย่อย</Label>
              <Input value={editSub.title} onChange={e => setEditSub({ ...editSub, title: e.target.value })} placeholder="ชื่อหัวข้อย่อย" />
            </div>
            <div className="space-y-2">
              <Label>เนื้อหา</Label>
              <Textarea value={editSub.content} onChange={e => setEditSub({ ...editSub, content: e.target.value })} placeholder="เนื้อหารายละเอียด..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveSub} className="gap-2"><Save className="w-4 h-4" />บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isQuizAdd ? "สร้างแบบทดสอบใหม่" : "แก้ไขแบบทดสอบ"}</DialogTitle>
            <DialogDescription>{isQuizAdd ? "กรอกข้อมูลแบบทดสอบที่ต้องการสร้าง" : "แก้ไขข้อมูลแบบทดสอบ"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อแบบทดสอบ</Label>
              <Input value={editQuiz.title} onChange={e => setEditQuiz({ ...editQuiz, title: e.target.value })} placeholder="ชื่อแบบทดสอบ" />
            </div>
            <div className="space-y-2">
              <Label>หมวดหมู่</Label>
              <Input value={editQuiz.category} onChange={e => setEditQuiz({ ...editQuiz, category: e.target.value })} placeholder="เช่น พื้นฐาน, การจัดซื้อ" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>จำนวนคำถาม</Label>
                <Input type="number" min={1} value={editQuiz.questions} onChange={e => setEditQuiz({ ...editQuiz, questions: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>คะแนนผ่าน (%)</Label>
                <Input type="number" min={0} max={100} value={editQuiz.passingScore} onChange={e => setEditQuiz({ ...editQuiz, passingScore: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveQuiz} className="gap-2"><Save className="w-4 h-4" />บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="videos"><Video className="mr-2 h-4 w-4" />วิดีโอสอนงาน</TabsTrigger>
          <TabsTrigger value="manuals"><BookOpen className="mr-2 h-4 w-4" />คู่มือ (เนื้อหา)</TabsTrigger>
          <TabsTrigger value="quizzes"><ClipboardCheck className="mr-2 h-4 w-4" />แบบทดสอบ</TabsTrigger>
        </TabsList>

        {/* Tab 1: Video Tutorials */}
        <TabsContent value="videos">
          <div className="space-y-4">
            {isAdmin && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>จัดการวิดีโอ (Admin)</CardTitle>
                    <Button onClick={openAddVideo}><Plus className="mr-2 h-4 w-4" />เพิ่มวิดีโอ</Button>
                  </div>
                </CardHeader>
              </Card>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="relative">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-40 object-cover" />
                    <Dialog>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader><DialogTitle>{video.title}</DialogTitle></DialogHeader>
                        <div className="aspect-video">
                          <iframe width="100%" height="100%" src={video.videoUrl} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <CardHeader><CardTitle className="text-base">{video.title}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{video.description}</p>
                    {isAdmin && (
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditVideo(video)}>
                          <Edit className="mr-2 h-3 w-3" />แก้ไข
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDelete("video", video.id)}>
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
                  <Button onClick={openAddManual}><Plus className="mr-2 h-4 w-4" />เพิ่มหัวข้อ</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredManuals.map((section) => (
                  <AccordionItem key={section.id} value={section.id}>
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2 flex-1 text-left">
                        {section.category}
                        {isAdmin && (
                          <div className="flex gap-1 ml-auto mr-4" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => openEditManual(section)}><Edit className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="sm" className="hover:text-destructive" onClick={() => openDelete("manual", section.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pl-4">
                        {section.subcategories.map((sub) => (
                          <Card key={sub.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{sub.title}</CardTitle>
                                {isAdmin && (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditSub(section.id, sub)}><Edit className="h-3 w-3" /></Button>
                                    <Button variant="destructive" size="sm" onClick={() => openDelete("sub", sub.id, section.id)}><Trash2 className="h-3 w-3" /></Button>
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{sub.content}</p>
                              {sub.attachments && sub.attachments.length > 0 && (
                                <div className="mt-4">
                                  <Label className="text-xs">ไฟล์แนบ:</Label>
                                  <div className="flex gap-2 mt-2">
                                    {sub.attachments.map((file, idx) => (
                                      <Badge key={idx} variant="secondary" className="cursor-pointer">📄 {file}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                        {isAdmin && (
                          <Button variant="outline" className="w-full" onClick={() => openAddSub(section.id)}>
                            <Plus className="mr-2 h-4 w-4" />เพิ่มหัวข้อย่อย
                          </Button>
                        )}
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
                  <Button onClick={openAddQuiz}><Plus className="mr-2 h-4 w-4" />สร้างแบบทดสอบ</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredQuizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{quiz.title}</CardTitle>
                        <Badge>{quiz.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">จำนวนคำถาม: {quiz.questions} ข้อ</p>
                      <p className="text-sm text-muted-foreground">คะแนนผ่าน: {quiz.passingScore}%</p>
                      <Button className="w-full mt-4" onClick={() => startQuiz(quiz)}>เริ่มทำแบบทดสอบ</Button>
                      {isAdmin && (
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditQuiz(quiz)}>
                            <Edit className="mr-2 h-3 w-3" />แก้ไข
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => openDelete("quiz", quiz.id)}>
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

      {/* Quiz Taking Dialog */}
      <Dialog open={!!activeQuiz} onOpenChange={(open) => { if (!open) setActiveQuiz(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeQuiz?.title}</DialogTitle>
            <DialogDescription>
              {quizSubmitted
                ? `ผลคะแนน: ${quizScore?.correct}/${quizScore?.total} (${quizScore?.percent}%)`
                : `จำนวน ${activeQuiz?.questionList.length} ข้อ | คะแนนผ่าน ${activeQuiz?.passingScore}%`}
            </DialogDescription>
          </DialogHeader>

          {quizSubmitted && quizScore && (
            <div className={`p-4 rounded-lg text-center font-bold text-lg ${quizScore.percent >= (activeQuiz?.passingScore || 0) ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>
              {quizScore.percent >= (activeQuiz?.passingScore || 0) ? "🎉 ผ่าน! ยินดีด้วย" : "❌ ไม่ผ่าน ลองใหม่อีกครั้ง"}
            </div>
          )}

          <div className="space-y-6">
            {activeQuiz?.questionList.map((q, qi) => (
              <div key={q.id} className="space-y-3">
                <p className="font-medium">{qi + 1}. {q.question}</p>
                <div className="space-y-2 pl-4">
                  {q.options.map((opt, oi) => {
                    const isSelected = quizAnswers[q.id] === oi;
                    const isCorrect = q.correctIndex === oi;
                    let optClass = "border rounded-lg p-3 cursor-pointer transition-colors ";
                    if (quizSubmitted) {
                      if (isCorrect) optClass += "border-green-500 bg-green-50 dark:bg-green-900/30";
                      else if (isSelected && !isCorrect) optClass += "border-red-500 bg-red-50 dark:bg-red-900/30";
                      else optClass += "border-border opacity-60";
                    } else {
                      optClass += isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50";
                    }
                    return (
                      <div
                        key={oi}
                        className={optClass}
                        onClick={() => { if (!quizSubmitted) setQuizAnswers(prev => ({ ...prev, [q.id]: oi })); }}
                      >
                        <span className="text-sm">{String.fromCharCode(65 + oi)}. {opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            {quizSubmitted ? (
              <>
                <Button variant="outline" onClick={() => setActiveQuiz(null)}>ปิด</Button>
                <Button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}>ทำใหม่อีกครั้ง</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setActiveQuiz(null)}>ยกเลิก</Button>
                <Button
                  onClick={submitQuiz}
                  disabled={activeQuiz ? Object.keys(quizAnswers).length < activeQuiz.questionList.length : true}
                >
                  ส่งคำตอบ ({Object.keys(quizAnswers).length}/{activeQuiz?.questionList.length})
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
