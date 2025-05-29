
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Copy, Trash2, UserPlus } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const FriendsModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const { friends, friendsSchedules, loading, addFriend, removeFriend, copyFriendSchedule } = useFriends();
  const { userProfile, isAdmin } = useAuth();
  const { toast } = useToast();

  const handleAddFriend = async () => {
    if (!newFriendUsername.trim()) return;
    
    try {
      await addFriend(newFriendUsername.trim());
      setNewFriendUsername('');
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الصديق بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCopySchedule = async (friendUid: string, friendName: string) => {
    try {
      await copyFriendSchedule(friendUid);
      toast({
        title: "تم بنجاح",
        description: `تم نسخ جدول ${friendName} بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء نسخ الجدول",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    try {
      await removeFriend(friendId);
      toast({
        title: "تم بنجاح",
        description: `تم حذف ${friendName} من قائمة الأصدقاء`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الصديق",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          أصدقائي
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إدارة الأصدقاء</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* معلومات الحساب */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات حسابك</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">اسم المستخدم:</span>
                <Badge variant="secondary">{userProfile?.username}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">الاسم:</span>
                <span>{userProfile?.name}</span>
              </div>
              {isAdmin && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">النوع:</span>
                  <Badge variant="default">مشرف</Badge>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                شارك اسم المستخدم الخاص بك مع الآخرين لإضافتك كصديق
              </p>
            </CardContent>
          </Card>

          {/* إضافة صديق جديد */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إضافة صديق جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="أدخل اسم المستخدم"
                  value={newFriendUsername}
                  onChange={(e) => setNewFriendUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}
                />
                <Button 
                  onClick={handleAddFriend} 
                  disabled={loading || !newFriendUsername.trim()}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  إضافة
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* قائمة الأصدقاء */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">قائمة الأصدقاء ({friends.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  لم تقم بإضافة أي أصدقاء بعد
                </p>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend: any) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{friend.name}</div>
                          <div className="text-sm text-muted-foreground">@{friend.username}</div>
                        </div>
                        {friend.role === 'admin' && (
                          <Badge variant="default">مشرف</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopySchedule(friend.uid, friend.name)}
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          نسخ الجدول
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveFriend(friend.id, friend.name)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* جداول الأصدقاء */}
          {friends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">جداول الأصدقاء</CardTitle>
              </CardHeader>
              <CardContent>
                {friends.map((friend: any) => (
                  <div key={friend.uid} className="mb-4 p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{friend.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopySchedule(friend.uid, friend.name)}
                      >
                        نسخ هذا الجدول
                      </Button>
                    </div>
                    {friendsSchedules[friend.uid] ? (
                      <div className="text-sm text-muted-foreground">
                        عدد الدروس: {Object.keys(friendsSchedules[friend.uid]).length}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        لا يوجد جدول مذاكرة حالياً
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
