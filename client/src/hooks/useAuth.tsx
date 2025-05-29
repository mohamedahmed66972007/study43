
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { auth, database } from '@/lib/firebase';

interface UserProfile {
  name: string;
  username: string;
  role: 'user' | 'admin';
  uid: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  register: (email: string, password: string, name: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, username: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  isAdmin: boolean;
  showAdminWelcome: boolean;
  setShowAdminWelcome: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

const ADMIN_UID = 'oSonmcTdxwSeWsKBf7lXqtA1pLf2';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminWelcome, setShowAdminWelcome] = useState(false);

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      const usernamesRef = ref(database, 'usernames');
      const snapshot = await get(usernamesRef);
      return snapshot.exists() && snapshot.val()[username];
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string, username: string) => {
    try {
      // التحقق من عدم وجود اليوزر نيم
      const usernameExists = await checkUsernameExists(username);
      if (usernameExists) {
        throw new Error('اسم المستخدم موجود بالفعل');
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // تحديد نوع المستخدم
      const role = user.uid === ADMIN_UID ? 'admin' : 'user';
      
      // حفظ الملف الشخصي أولاً
      const profile = { name, username, role, uid: user.uid };
      
      try {
        // حفظ الملف الشخصي
        await set(ref(database, `users/${user.uid}/profile`), profile);
        // حفظ اليوزر نيم
        await set(ref(database, `usernames/${username}`), user.uid);
        
        setUserProfile(profile);
        
        // إرسال تأكيد الإيميل بعد حفظ البيانات
        await sendEmailVerification(user);
        
      } catch (dbError) {
        console.error('Database error during registration:', dbError);
        // في حالة فشل حفظ البيانات، حذف المستخدم
        try {
          await user.delete();
        } catch (deleteError) {
          console.error('Error deleting user after failed registration:', deleteError);
        }
        throw new Error('فشل في حفظ بيانات المستخدم');
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful for user:', result.user.uid);
      
      // التأكد من تحديث حالة المشرف
      if (result.user.uid === ADMIN_UID) {
        console.log('Admin login detected');
        // إظهار نافذة الترحيب للمشرف دائماً عند تسجيل الدخول
        setTimeout(() => {
          setShowAdminWelcome(true);
        }, 500);
      }
      
      return result;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateProfile = async (name: string, username: string) => {
    if (!currentUser || !userProfile) return;
    
    try {
      // التحقق من اليوزر نيم الجديد
      if (username !== userProfile.username) {
        const usernameExists = await checkUsernameExists(username);
        if (usernameExists) {
          throw new Error('اسم المستخدم موجود بالفعل');
        }
        
        // حذف اليوزر نيم القديم
        await set(ref(database, `usernames/${userProfile.username}`), null);
        // إضافة اليوزر نيم الجديد
        await set(ref(database, `usernames/${username}`), currentUser.uid);
      }
      
      const updatedProfile = { ...userProfile, name, username };
      await update(ref(database, `users/${currentUser.uid}/profile`), { name, username });
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!currentUser || !userProfile) return;
    
    try {
      // حذف جميع البيانات من قاعدة البيانات
      await set(ref(database, `users/${currentUser.uid}`), null);
      await set(ref(database, `usernames/${userProfile.username}`), null);
      
      // حذف الحساب
      await currentUser.delete();
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid);
      setCurrentUser(user);
      
      if (user) {
        try {
          // انتظار قصير للتأكد من تحديث Firebase
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // جلب الملف الشخصي
          const profileRef = ref(database, `users/${user.uid}/profile`);
          const snapshot = await get(profileRef);
          
          if (snapshot.exists()) {
            const profile = snapshot.val();
            console.log('Profile loaded:', profile);
            
            // تحديث الدور للمشرف إذا لم يكن محدث
            if (user.uid === ADMIN_UID && profile.role !== 'admin') {
              const updatedProfile = { ...profile, role: 'admin' };
              await update(profileRef, { role: 'admin' });
              setUserProfile(updatedProfile);
            } else {
              setUserProfile(profile);
            }
          } else {
            // إذا لم يوجد ملف شخصي، إنشاء واحد افتراضي
            const role = user.uid === ADMIN_UID ? 'admin' : 'user';
            const defaultProfile = {
              name: user.displayName || 'مستخدم جديد',
              username: `user_${user.uid.substring(0, 8)}`,
              role,
              uid: user.uid
            };
            
            console.log('Creating default profile:', defaultProfile);
            
            // حفظ الملف الشخصي مع إعادة المحاولة
            let retries = 3;
            while (retries > 0) {
              try {
                await set(ref(database, `users/${user.uid}/profile`), defaultProfile);
                await set(ref(database, `usernames/${defaultProfile.username}`), user.uid);
                break;
              } catch (error) {
                console.log(`محاولة حفظ فاشلة، المحاولات المتبقية: ${retries - 1}`);
                retries--;
                if (retries === 0) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            setUserProfile(defaultProfile);
          }
        } catch (error) {
          console.error('خطأ في جلب الملف الشخصي:', error);
          // في حالة الخطأ، إنشاء ملف افتراضي بسيط
          const role = user.uid === ADMIN_UID ? 'admin' : 'user';
          setUserProfile({
            name: 'مستخدم جديد',
            username: `user_${user.uid.substring(0, 8)}`,
            role,
            uid: user.uid
          });
        }
      } else {
        setUserProfile(null);
        setShowAdminWelcome(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    logout,
    updateProfile,
    deleteAccount,
    isAdmin: userProfile?.role === 'admin' || currentUser?.uid === ADMIN_UID,
    showAdminWelcome,
    setShowAdminWelcome
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
