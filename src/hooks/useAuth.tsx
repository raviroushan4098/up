"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: "admin" | "manager" | "user";
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

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
    return null;
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await fetchProfile(user.uid);
      if (prof) setProfile(prof);
    }
  };

  useEffect(() => {
    // onAuthStateChanged only makes sense on the client side
    if (typeof window === "undefined") return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let prof = await fetchProfile(firebaseUser.uid);
        if (!prof) {
          // Fallback if profile wasn't created on signup (e.g. Google Sign-In)
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
            role: "user",
            createdAt: new Date().toISOString(),
            onboarded: false,
          };
          try {
            await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
            await setDoc(doc(db, "counters", "users"), { count: increment(1) }, { merge: true });
            prof = newProfile;
          } catch (e) {
            console.error("Error setting default user profile or counter:", e);
          }
        }
        setProfile(prof);
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
