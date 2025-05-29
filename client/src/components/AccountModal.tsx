import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Edit, Trash2, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const AccountModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const { userProfile, isAdmin, updateProfile, deleteAccount, logout, currentUser } = useAuth();
  const { toast } = useToast();

  const handleEdit = () => {
    setName(userProfile?.name || '');
    setUsername(userProfile?.username || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !username.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateProfile(name.trim(), username.trim());
      setIsEditing(false);
      toast({
        title: "تم بنجاح",
        description: "تم تحديث بيانات الحساب بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      setIsOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم حذف الحساب بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الحساب",
        variant: "destructive"
      });
    }
  };

  const getAdminMessage = () => {
    if (!isAdmin || !userProfile) return null;

    // التحقق من UID المشرف الرئيسي
    if (userProfile.uid === 'oSonmcTdxwSeWsKBf7lXqtA1pLf2') {
      return 'مرحباً بك أيها المشرف الرئيسي';
    }

    // للمشرفين الآخرين
    const adminNumber = userProfile.uid.substring(0, 8);
    return `مرحباً بك أيها المشرف رقم ${adminNumber}`;
  };

  const isCurrentlyAdmin = isAdmin || currentUser?.uid === 'oSonmcTdxwSeWsKBf7lXqtA1pLf2';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          حسابي
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إدارة الحساب</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* رسالة المشرف */}
          {isCurrentlyAdmin && (
            <Card className="border-primary">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-primary">
                  <Crown className="h-5 w-5" />
                  <span className="font-medium">{getAdminMessage()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* بيانات الحساب */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                بيانات الحساب
                {!isEditing && (
                  <Button size="sm" variant="outline" onClick={handleEdit}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أدخل اسمك"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">اسم المستخدم</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="أدخل اسم المستخدم"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1">
                      حفظ التغييرات
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">الاسم:</span>
                    <span>{userProfile?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">اسم المستخدم:</span>
                    <Badge variant="secondary">{userProfile?.username}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">النوع:</span>
                    <Badge variant={isCurrentlyAdmin ? "default" : "outline"}>
                      {isCurrentlyAdmin ? "مشرف" : "مستخدم"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">معرف المستخدم:</span>
                    <Badge variant="outline">{currentUser?.uid?.substring(0, 8)}</Badge>
                  </div>

                  {isCurrentlyAdmin && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                        <Crown className="h-4 w-4" />
                        <span className="text-sm font-medium">{getAdminMessage()}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* خيارات إضافية */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">خيارات إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full"
              >
                تسجيل الخروج
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    حذف الحساب
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد حذف الحساب</AlertDialogTitle>
                    <AlertDialogDescription>
                      هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك وجدولك الدراسي نهائياً.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive">
                      حذف الحساب نهائياً
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};