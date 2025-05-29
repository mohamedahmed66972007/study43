import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AdminWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminWelcomeModal = ({ isOpen, onClose }: AdminWelcomeModalProps) => {
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateProfile, userProfile } = useAuth();
  const { toast } = useToast();

  const handleSaveProfile = async () => {
    if (!adminName.trim() || !adminUsername.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await updateProfile(adminName.trim(), adminUsername.trim());
      toast({
        title: "مرحباً بك أيها المشرف!",
        description: "تم حفظ بيانات المشرف بنجاح",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ البيانات",
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
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            مرحباً بك أيها المشرف!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-center text-muted-foreground">
            يرجى إدخال اسمك والمعرف الخاص بك
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">اسم المشرف</Label>
              <Input
                id="admin-name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="أدخل اسمك"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-username">المعرف (اسم المستخدم)</Label>
              <Input
                id="admin-username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="أدخل المعرف الخاص بك"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                هذا هو المعرف الذي سيستخدمه الآخرون للتواصل معك
              </p>
            </div>

            <Button 
              onClick={handleSaveProfile} 
              className="w-full"
              disabled={loading}
            >
              {loading ? "جاري الحفظ..." : "حفظ البيانات"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};