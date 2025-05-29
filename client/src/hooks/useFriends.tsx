
import { useState, useEffect } from 'react';
import { ref, get, set, push, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from './useAuth';

interface Friend {
  uid: string;
  username: string;
  name: string;
  role: 'user' | 'admin';
}

interface FriendSchedule {
  [key: string]: any; // بيانات الجدول
}

export const useFriends = () => {
  const { currentUser, userProfile } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsSchedules, setFriendsSchedules] = useState<Record<string, FriendSchedule>>({});
  const [loading, setLoading] = useState(false);

  const addFriend = async (username: string) => {
    if (!currentUser || !userProfile) return;
    
    setLoading(true);
    try {
      // البحث عن المستخدم بالـ username
      const usernamesRef = ref(database, `usernames/${username}`);
      const usernameSnapshot = await get(usernamesRef);
      
      if (!usernameSnapshot.exists()) {
        throw new Error('لم يتم العثور على هذا المستخدم');
      }
      
      const friendUid = usernameSnapshot.val();
      
      // التحقق من عدم إضافة نفسك
      if (friendUid === currentUser.uid) {
        throw new Error('لا يمكنك إضافة نفسك كصديق');
      }
      
      // جلب بيانات الصديق
      const friendProfileRef = ref(database, `users/${friendUid}/profile`);
      const friendSnapshot = await get(friendProfileRef);
      
      if (!friendSnapshot.exists()) {
        throw new Error('لم يتم العثور على بيانات هذا المستخدم');
      }
      
      const friendData = friendSnapshot.val();
      
      // التحقق من عدم وجود الصديق مسبقاً
      const existingFriendsRef = ref(database, `users/${currentUser.uid}/friends`);
      const existingSnapshot = await get(existingFriendsRef);
      
      if (existingSnapshot.exists()) {
        const existingFriends = existingSnapshot.val();
        if (Object.values(existingFriends).some((friend: any) => friend.uid === friendUid)) {
          throw new Error('هذا المستخدم مضاف بالفعل كصديق');
        }
      }
      
      // إضافة الصديق
      const friendsRef = ref(database, `users/${currentUser.uid}/friends`);
      await push(friendsRef, {
        uid: friendUid,
        username: friendData.username,
        name: friendData.name,
        role: friendData.role,
        addedAt: Date.now()
      });
      
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!currentUser) return;
    
    await set(ref(database, `users/${currentUser.uid}/friends/${friendId}`), null);
  };

  const copyFriendSchedule = async (friendUid: string) => {
    if (!currentUser) return;
    
    // جلب جدول الصديق
    const friendScheduleRef = ref(database, `users/${friendUid}/schedule`);
    const snapshot = await get(friendScheduleRef);
    
    if (snapshot.exists()) {
      // نسخ الجدول لحسابك
      const myScheduleRef = ref(database, `users/${currentUser.uid}/schedule`);
      await set(myScheduleRef, snapshot.val());
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    
    // الاستماع لتحديثات قائمة الأصدقاء
    const friendsRef = ref(database, `users/${currentUser.uid}/friends`);
    const unsubscribeFriends = onValue(friendsRef, (snapshot) => {
      if (snapshot.exists()) {
        const friendsData = snapshot.val();
        const friendsList = Object.entries(friendsData).map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }));
        setFriends(friendsList);
        
        // الاستماع لجداول الأصدقاء
        friendsList.forEach((friend: any) => {
          const scheduleRef = ref(database, `users/${friend.uid}/schedule`);
          onValue(scheduleRef, (scheduleSnapshot) => {
            if (scheduleSnapshot.exists()) {
              setFriendsSchedules(prev => ({
                ...prev,
                [friend.uid]: scheduleSnapshot.val()
              }));
            }
          });
        });
      } else {
        setFriends([]);
        setFriendsSchedules({});
      }
    });

    return () => {
      off(friendsRef);
      // إلغاء الاستماع لجداول الأصدقاء
      friends.forEach(friend => {
        const scheduleRef = ref(database, `users/${friend.uid}/schedule`);
        off(scheduleRef);
      });
    };
  }, [currentUser]);

  return {
    friends,
    friendsSchedules,
    loading,
    addFriend,
    removeFriend,
    copyFriendSchedule
  };
};
