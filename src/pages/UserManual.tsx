import { useState, useEffect } from "react";
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
  Search,
  Save,
  Loader2,
  Paperclip,
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  userManualService,
  VideoTutorial,
  ManualSection,
  Quiz,
  QuizQuestion,
  QuizAttemptResult,
} from "@/services/userManualService";

const emptyVideo: Partial<VideoTutorial> = { title: "", description: "", videoUrl: "", thumbnail: "/placeholder.svg" };
const emptyQuestion: QuizQuestion = { question: "", options: ["", "", "", ""], correctIndex: 0 };

export default function UserManual() {
  const { user, isAdminOrManager } = useAuth();
  const isAdmin = isAdminOrManager;

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // --- Data states ---
  const [videos, setVideos] = useState<VideoTutorial[]>([]);
  const [manuals, setManuals] = useState<ManualSection[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [videosRes, manualsRes, quizzesRes] = await Promise.all([
        userManualService.getVideos(),
        userManualService.getManuals(),
        userManualService.getQuizzes(),
      ]);
      if (videosRes.status === "success") setVideos(videosRes.data);
      if (manualsRes.status === "success") setManuals(manualsRes.data);
      if (quizzesRes.status === "success") setQuizzes(quizzesRes.data);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลคู่มือการทำงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- Dialog states ---
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [editVideo, setEditVideo] = useState<Partial<VideoTutorial>>(emptyVideo);
  const [isVideoAdd, setIsVideoAdd] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);

  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [editManualCategory, setEditManualCategory] = useState("");
  const [isManualAdd, setIsManualAdd] = useState(false);
  const [editManualId, setEditManualId] = useState<number | undefined>(undefined);
  const [savingManual, setSavingManual] = useState(false);

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editSub, setEditSub] = useState<{ sectionId: number; id?: number; title: string; content: string }>({ sectionId: 0, title: "", content: "" });
  const [isSubAdd, setIsSubAdd] = useState(false);
  const [editSubFile, setEditSubFile] = useState<File | null>(null);
  const [savingSub, setSavingSub] = useState(false);

  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editQuiz, setEditQuiz] = useState<{ id?: number; title: string; category: string; passingScore: number }>({ title: "", category: "", passingScore: 70 });
  const [editQuizQuestions, setEditQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isQuizAdd, setIsQuizAdd] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [loadingQuizEdit, setLoadingQuizEdit] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number; parentId?: number } | null>(null);

  // --- Quiz Taking ---
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [loadingQuizTake, setLoadingQuizTake] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const startQuiz = async (quiz: Quiz) => {
    setLoadingQuizTake(true);
    try {
      const res = await userManualService.getQuiz(quiz.id, "take");
      if (res.status === "success") {
        setActiveQuiz(res.data);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizResult(null);
      } else {
        toast.error("ไม่สามารถโหลดแบบทดสอบได้");
      }
    } finally {
      setLoadingQuizTake(false);
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmittingQuiz(true);
    try {
      const answers = activeQuiz.questionList.map((q) => ({
        questionId: q.id!,
        selectedIndex: quizAnswers[q.id!] ?? -1,
      }));
      const res = await userManualService.submitAttempt({
        quizId: activeQuiz.id,
        username: user?.username,
        fullName: user?.full_name,
        answers,
      });
      if (res.status === "success") {
        setQuizResult(res.data);
        setQuizSubmitted(true);
      } else {
        toast.error(res.message || "ส่งคำตอบไม่สำเร็จ");
      }
    } finally {
      setSubmittingQuiz(false);
    }
  };

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
  const openAddVideo = () => { setIsVideoAdd(true); setEditVideo({ ...emptyVideo }); setVideoDialogOpen(true); };
  const openEditVideo = (v: VideoTutorial) => { setIsVideoAdd(false); setEditVideo({ ...v }); setVideoDialogOpen(true); };
  const saveVideo = async () => {
    if (!editVideo.title?.trim()) { toast.error("กรุณาระบุชื่อหัวข้อ"); return; }
    if (!editVideo.videoUrl?.trim()) { toast.error("กรุณาระบุลิงก์วิดีโอ"); return; }
    setSavingVideo(true);
    try {
      const res = await userManualService.saveVideo(editVideo);
      if (res.status === "success") {
        toast.success(isVideoAdd ? "เพิ่มวิดีโอเรียบร้อย" : "แก้ไขวิดีโอเรียบร้อย");
        setVideoDialogOpen(false);
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSavingVideo(false);
    }
  };

  // --- Manual CRUD ---
  const openAddManual = () => { setIsManualAdd(true); setEditManualCategory(""); setEditManualId(undefined); setManualDialogOpen(true); };
  const openEditManual = (section: ManualSection) => { setIsManualAdd(false); setEditManualCategory(section.category); setEditManualId(section.id); setManualDialogOpen(true); };
  const saveManual = async () => {
    if (!editManualCategory.trim()) { toast.error("กรุณาระบุชื่อหัวข้อ"); return; }
    setSavingManual(true);
    try {
      const res = await userManualService.saveSection({ id: editManualId, category: editManualCategory });
      if (res.status === "success") {
        toast.success(isManualAdd ? "เพิ่มหัวข้อเรียบร้อย" : "แก้ไขหัวข้อเรียบร้อย");
        setManualDialogOpen(false);
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSavingManual(false);
    }
  };

  // --- Subcategory CRUD ---
  const openAddSub = (sectionId: number) => { setIsSubAdd(true); setEditSub({ sectionId, title: "", content: "" }); setEditSubFile(null); setSubDialogOpen(true); };
  const openEditSub = (sectionId: number, sub: { id: number; title: string; content: string }) => {
    setIsSubAdd(false); setEditSub({ sectionId, id: sub.id, title: sub.title, content: sub.content }); setEditSubFile(null); setSubDialogOpen(true);
  };
  const saveSub = async () => {
    if (!editSub.title.trim()) { toast.error("กรุณาระบุชื่อหัวข้อย่อย"); return; }
    setSavingSub(true);
    try {
      const res = await userManualService.saveSubsection(editSub);
      if (res.status !== "success") {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
        return;
      }
      const subsectionId = editSub.id ?? res.id;
      if (editSubFile) {
        const uploadRes = await userManualService.uploadFile(editSubFile, "user-manual/attachments");
        if (uploadRes.status === "success") {
          await userManualService.addAttachment({ subsectionId, fileName: editSubFile.name, fileUrl: uploadRes.url });
        } else {
          toast.error("แนบไฟล์ไม่สำเร็จ แต่บันทึกหัวข้อย่อยแล้ว");
        }
      }
      toast.success(isSubAdd ? "เพิ่มหัวข้อย่อยเรียบร้อย" : "แก้ไขหัวข้อย่อยเรียบร้อย");
      setSubDialogOpen(false);
      fetchAll();
    } finally {
      setSavingSub(false);
    }
  };

  // --- Quiz CRUD ---
  const openAddQuiz = () => {
    setIsQuizAdd(true);
    setEditQuiz({ title: "", category: "", passingScore: 70 });
    setEditQuizQuestions([]);
    setQuizDialogOpen(true);
  };
  const openEditQuiz = async (q: Quiz) => {
    setIsQuizAdd(false);
    setQuizDialogOpen(true);
    setLoadingQuizEdit(true);
    try {
      const res = await userManualService.getQuiz(q.id, "edit");
      if (res.status === "success") {
        setEditQuiz({ id: res.data.id, title: res.data.title, category: res.data.category, passingScore: res.data.passingScore });
        setEditQuizQuestions(res.data.questionList);
      } else {
        toast.error("ไม่สามารถโหลดแบบทดสอบได้");
        setQuizDialogOpen(false);
      }
    } finally {
      setLoadingQuizEdit(false);
    }
  };
  const addQuestionRow = () => setEditQuizQuestions(prev => [...prev, { ...emptyQuestion, options: [...emptyQuestion.options] }]);
  const removeQuestionRow = (index: number) => setEditQuizQuestions(prev => prev.filter((_, i) => i !== index));
  const updateQuestionText = (index: number, value: string) =>
    setEditQuizQuestions(prev => prev.map((q, i) => i === index ? { ...q, question: value } : q));
  const updateQuestionOption = (index: number, optionIndex: number, value: string) =>
    setEditQuizQuestions(prev => prev.map((q, i) => {
      if (i !== index) return q;
      const options = [...q.options];
      options[optionIndex] = value;
      return { ...q, options };
    }));
  const updateQuestionCorrect = (index: number, optionIndex: number) =>
    setEditQuizQuestions(prev => prev.map((q, i) => i === index ? { ...q, correctIndex: optionIndex } : q));

  const saveQuiz = async () => {
    if (!editQuiz.title.trim()) { toast.error("กรุณาระบุชื่อแบบทดสอบ"); return; }
    if (editQuizQuestions.length === 0) { toast.error("กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ"); return; }
    const incomplete = editQuizQuestions.some(q => !q.question.trim() || q.options.some(o => !o.trim()));
    if (incomplete) { toast.error("กรุณากรอกคำถามและตัวเลือกให้ครบทุกข้อ"); return; }

    setSavingQuiz(true);
    try {
      const res = await userManualService.saveQuiz({ ...editQuiz, questionList: editQuizQuestions });
      if (res.status === "success") {
        toast.success(isQuizAdd ? "สร้างแบบทดสอบเรียบร้อย" : "แก้ไขแบบทดสอบเรียบร้อย");
        setQuizDialogOpen(false);
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSavingQuiz(false);
    }
  };

  // --- Delete ---
  const openDelete = (type: string, id: number, parentId?: number) => { setDeleteTarget({ type, id, parentId }); setDeleteDialogOpen(true); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    let res;
    if (type === "video") {
      res = await userManualService.deleteVideo(id);
    } else if (type === "manual") {
      res = await userManualService.deleteManualEntity("section", id);
    } else if (type === "sub") {
      res = await userManualService.deleteManualEntity("subsection", id);
    } else if (type === "quiz") {
      res = await userManualService.deleteQuiz(id);
    }
    if (res?.status === "success") {
      toast.success("ลบข้อมูลเรียบร้อย");
      fetchAll();
    } else {
      toast.error("ลบไม่สำเร็จ");
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const quizPassed = quizResult ? quizResult.passed : false;

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

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
            <Button onClick={saveVideo} className="gap-2" disabled={savingVideo}>
              {savingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}บันทึก
            </Button>
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
            <Button onClick={saveManual} className="gap-2" disabled={savingManual}>
              {savingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}บันทึก
            </Button>
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
            <div className="space-y-2">
              <Label>แนบไฟล์ (ถ้ามี)</Label>
              <Input type="file" onChange={e => setEditSubFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveSub} className="gap-2" disabled={savingSub}>
              {savingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isQuizAdd ? "สร้างแบบทดสอบใหม่" : "แก้ไขแบบทดสอบ"}</DialogTitle>
            <DialogDescription>{isQuizAdd ? "กรอกข้อมูลแบบทดสอบและคำถามที่ต้องการสร้าง" : "แก้ไขข้อมูลแบบทดสอบและคำถาม"}</DialogDescription>
          </DialogHeader>
          {loadingQuizEdit ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ชื่อแบบทดสอบ</Label>
                  <Input value={editQuiz.title} onChange={e => setEditQuiz({ ...editQuiz, title: e.target.value })} placeholder="ชื่อแบบทดสอบ" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>หมวดหมู่</Label>
                    <Input value={editQuiz.category} onChange={e => setEditQuiz({ ...editQuiz, category: e.target.value })} placeholder="เช่น พื้นฐาน, การจัดซื้อ" />
                  </div>
                  <div className="space-y-2">
                    <Label>คะแนนผ่าน (%)</Label>
                    <Input type="number" min={0} max={100} value={editQuiz.passingScore} onChange={e => setEditQuiz({ ...editQuiz, passingScore: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>คำถาม ({editQuizQuestions.length})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestionRow}>
                    <Plus className="w-4 h-4 mr-1" />เพิ่มคำถาม
                  </Button>
                </div>
                {editQuizQuestions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีคำถาม กด "เพิ่มคำถาม" เพื่อเริ่มสร้าง</p>
                )}
                {editQuizQuestions.map((q, qi) => (
                  <div key={qi} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">คำถามที่ {qi + 1}</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestionRow(qi)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    <Input value={q.question} onChange={e => updateQuestionText(qi, e.target.value)} placeholder={`คำถามที่ ${qi + 1}`} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[0, 1, 2, 3].map((oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qi}`}
                            checked={q.correctIndex === oi}
                            onChange={() => updateQuestionCorrect(qi, oi)}
                            className="accent-primary"
                          />
                          <Input
                            value={q.options[oi]}
                            onChange={e => updateQuestionOption(qi, oi, e.target.value)}
                            placeholder={`ตัวเลือก ${String.fromCharCode(65 + oi)}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveQuiz} className="gap-2" disabled={savingQuiz || loadingQuizEdit}>
              {savingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}บันทึก
            </Button>
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
              {filteredVideos.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8">ยังไม่มีวิดีโอ</p>
              )}
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
                  <AccordionItem key={section.id} value={String(section.id)}>
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
                              <p className="text-sm text-muted-foreground whitespace-pre-line">{sub.content}</p>
                              {sub.attachments && sub.attachments.length > 0 && (
                                <div className="mt-4">
                                  <Label className="text-xs">ไฟล์แนบ:</Label>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {sub.attachments.map((file) => (
                                      <a key={file.id} href={file.fileUrl} target="_blank" rel="noreferrer">
                                        <Badge variant="secondary" className="cursor-pointer gap-1">
                                          <Paperclip className="w-3 h-3" />{file.fileName}
                                        </Badge>
                                      </a>
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
                {filteredManuals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีคู่มือ</p>
                )}
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
                      <Button
                        className="w-full mt-4"
                        onClick={() => startQuiz(quiz)}
                        disabled={loadingQuizTake || quiz.questions === 0}
                      >
                        {loadingQuizTake ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {quiz.questions === 0 ? "ยังไม่มีคำถาม" : "เริ่มทำแบบทดสอบ"}
                      </Button>
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
                {filteredQuizzes.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full text-center py-8">ยังไม่มีแบบทดสอบ</p>
                )}
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
              {quizSubmitted && quizResult
                ? `ผลคะแนน: ${quizResult.correct}/${quizResult.total} (${quizResult.percent}%)`
                : `จำนวน ${activeQuiz?.questionList.length} ข้อ`}
            </DialogDescription>
          </DialogHeader>

          {quizSubmitted && quizResult && (
            <div className={`p-4 rounded-lg text-center font-bold text-lg ${quizPassed ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>
              {quizPassed ? "🎉 ผ่าน! ยินดีด้วย" : "❌ ไม่ผ่าน ลองใหม่อีกครั้ง"}
            </div>
          )}

          <div className="space-y-6">
            {activeQuiz?.questionList.map((q, qi) => {
              const reviewForQ = quizResult?.review.find(r => r.questionId === q.id);
              return (
                <div key={q.id} className="space-y-3">
                  <p className="font-medium">{qi + 1}. {q.question}</p>
                  <div className="space-y-2 pl-4">
                    {q.options.map((opt, oi) => {
                      const isSelected = quizAnswers[q.id!] === oi;
                      const isCorrect = reviewForQ?.correctIndex === oi;
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
                          onClick={() => { if (!quizSubmitted) setQuizAnswers(prev => ({ ...prev, [q.id!]: oi })); }}
                        >
                          <span className="text-sm">{String.fromCharCode(65 + oi)}. {opt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            {quizSubmitted ? (
              <>
                <Button variant="outline" onClick={() => setActiveQuiz(null)}>ปิด</Button>
                <Button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); setQuizResult(null); }}>ทำใหม่อีกครั้ง</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setActiveQuiz(null)}>ยกเลิก</Button>
                <Button
                  onClick={submitQuiz}
                  disabled={submittingQuiz || (activeQuiz ? Object.keys(quizAnswers).length < activeQuiz.questionList.length : true)}
                >
                  {submittingQuiz ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
