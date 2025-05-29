import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(loginData.email, loginData.password);
      onClose();
      toast({
        title: "مرحباً بك",
        description: "تم تسجيل الدخول بنجاح",
      });
    } catch (error: any) {
      let message = "حدث خطأ أثناء تسجيل الدخول";

      if (error.code === 'auth/user-not-found') {
        message = "لم يتم العثور على هذا الحساب";
      } else if (error.code === 'auth/wrong-password') {
        message = "كلمة المرور غير صحيحة";
      } else if (error.code === 'auth/invalid-email') {
        message = "عنوان البريد الإلكتروني غير صحيح";
      }

      toast({
        title: "خطأ في تسجيل الدخول",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور غير متطابقة",
        variant: "destructive"
      });
      return;
    }

    if (!registerData.name.trim() || !registerData.username.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await register(
        registerData.email,
        registerData.password,
        registerData.name.trim(),
        registerData.username.trim()
      );
      setVerificationSent(true);
      toast({
        title: "تم إنشاء الحساب",
        description: "تم إرسال رابط التأكيد إلى بريدك الإلكتروني",
      });
    } catch (error: any) {
      let message = "حدث خطأ أثناء إنشاء الحساب";

      if (error.code === 'auth/email-already-in-use') {
        message = "هذا البريد الإلكتروني مُستخدم بالفعل";
      } else if (error.code === 'auth/weak-password') {
        message = "كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل";
      } else if (error.code === 'auth/invalid-email') {
        message = "عنوان البريد الإلكتروني غير صحيح";
      } else if (error.message === 'اسم المستخدم موجود بالفعل') {
        message = error.message;
      }

      toast({
        title: "خطأ في إنشاء الحساب",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل الدخول / إنشاء حساب</DialogTitle>
        </DialogHeader>

        {verificationSent ? (
          <Alert>
            <AlertDescription>
              تم إرسال رابط التأكيد إلى بريدك الإلكتروني. يرجى التحقق من البريد وتأكيد حسابك قبل تسجيل الدخول.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">البريد الإلكتروني</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">كلمة المرور</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">الاسم الكامل</Label>
                  <Input
                    id="register-name"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="register-username">المعرف (اسم المستخدم)</Label>
                    <Input
                      id="register-username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="أدخل المعرف الخاص بك"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      هذا هو المعرف الذي سيستخدمه الآخرون للتواصل معك
                    </p>
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">البريد الإلكتروني</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">كلمة المرور</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm">تأكيد كلمة المرور</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};