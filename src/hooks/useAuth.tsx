"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: "admin" | "manager" | "team" | "user";
  district?: string;
  state?: string;
  pincode?: string;
  instagramHandle?: string;
  category?: string;
  createdAt: string;
  onboarded?: boolean;
  fatherName?: string;
  motherName?: string;
  gender?: string;
  dob?: string;
  age?: number;
  profession?: string;
  villageCity?: string;
  phoneNumber?: string;
  address?: string;
  profilePhotoUrl?: string;
  // Verification workflow fields
  verificationStatus?: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  verificationUpdatedAt?: string;
  // Soft deletion metadata fields
  deleted?: "yes" | "no" | "pending";
  deletionInitiatedAt?: string;
  deletionScheduledAt?: string;
  deletedBy?: string;
  deletedByUid?: string;
  appealPending?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string): Promise<{ exists: boolean; data?: UserProfile }> => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { exists: true, data: docSnap.data() as UserProfile };
      }
      return { exists: false };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const result = await fetchProfile(user.uid);
        if (result.exists && result.data) {
          setProfile(result.data);
        }
      } catch (error) {
        console.error("Failed to refresh profile:", error);
      }
    }
  };

  useEffect(() => {
    // onAuthStateChanged only makes sense on the client side
    if (typeof window === "undefined") return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const result = await fetchProfile(firebaseUser.uid);
          if (result.exists && result.data) {
            setProfile(result.data);
          } else {
            // Fallback if profile wasn't created on signup (e.g. Google Sign-In or phone sign up)
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
              role: "user",
              createdAt: new Date().toISOString(),
              onboarded: false,
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
            await setDoc(doc(db, "counters", "users"), { count: increment(1) }, { merge: true });
            setProfile(newProfile);
          }
        } catch (e) {
          console.error("Error loading user profile on auth state change:", e);
          // Keep profile as null or handle connection error gracefully
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
