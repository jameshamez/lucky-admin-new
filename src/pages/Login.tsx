import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, User, ShieldCheck } from "lucide-react";

const API_AUTH_URL = "https://finfinphone.com/api-lucky/admin/auth.php";

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            toast.error("กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(API_AUTH_URL + "?action=login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.status === "success") {
                // Save user info to localStorage
                localStorage.setItem("user", JSON.stringify(result.user));
                toast.success(`ยินดีต้อนรับคุณ ${result.user.full_name}`);

                // Redirect to department selection
                navigate("/select-department");
            } else {
                toast.error(result.message || "การเข้าสู่ระบบล้มเหลว");
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>

            <div className="w-full max-w-[400px] z-10">
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-4 shadow-strong rotate-3 hover:rotate-0 transition-transform duration-300">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter">
                        THE BRAVO <span className="text-primary">ERP</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">ระบบบริหารจัดการองค์กรครบวงจร</p>
                </div>

                <Card className="border-none shadow-strong bg-white/80 backdrop-blur-xl">
                    <CardContent className="pt-8 px-8 pb-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-sm font-semibold tracking-wide uppercase text-muted-foreground ml-1">
                                    ชื่อผู้ใช้งาน
                                </Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="username"
                                        placeholder="Enter your username"
                                        className="pl-10 h-12 bg-slate-50/50 border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-semibold tracking-wide uppercase text-muted-foreground ml-1">
                                        รหัสผ่าน
                                    </Label>
                                    <Button variant="link" className="text-xs p-0 h-auto font-medium text-primary hover:text-primary-hover">
                                        ลืมรหัสผ่าน?
                                    </Button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-12 bg-slate-50/50 border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            กำลังเข้าสู่ระบบ...
                                        </>
                                    ) : (
                                        "เข้าสู่ระบบ"
                                    )}
                                </Button>
                            </div>
                        </form>

                        <div className="mt-8 text-center border-t border-slate-100 pt-6">
                            <p className="text-sm text-muted-foreground">
                                สำหรับพนักงานในระบบเท่านั้น หากต้องการขอสิทธิ์เข้าใช้งาน <br />
                                กรุณาติดต่อ <a href="#" className="font-semibold text-primary decoration-2 hover:underline">ฝ่ายไอทีสำนักงานใหญ่</a>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Support Info */}
                <div className="mt-8 flex items-center justify-center gap-4 text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                    <p className="text-xs font-medium uppercase tracking-widest">Powered by BRAVO TECH</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                </div>
            </div>
        </div>
    );
}
