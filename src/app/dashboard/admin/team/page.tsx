"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/hooks/useAuth";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Users, UserCog, ShieldCheck } from "lucide-react";

export default function TeamManagementPage() {
  const { profile, loading } = useAuth();

  const [currentTeam, setCurrentTeam] = useState<UserProfile[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch current team members
  const fetchTeam = async () => {
    setTeamLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "in", ["admin", "manager", "team"]));
      const snap = await getDocs(q);
      const team = snap.docs.map((d) => d.data() as UserProfile);
      setCurrentTeam(team);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch team members");
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === "admin") {
      fetchTeam();
    }
  }, [profile]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter an email or phone number.");
      return;
    }
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const isEmail = searchQuery.includes("@");

      let formattedQuery = searchQuery.trim();
      if (!isEmail) {
        // Strip out spaces, dashes, or parentheses if the user typed them
        const stripped = formattedQuery.replace(/[\s\-()]/g, "");
        if (/^\d{10}$/.test(stripped)) {
          formattedQuery = `+91${stripped}`;
        } else if (/^\+91\d{10}$/.test(stripped)) {
          formattedQuery = stripped;
        }
      }

      const qField = isEmail ? "email" : "phoneNumber";
      // To handle possible different formats, we query exactly what they typed
      const q = query(collection(db, "users"), where(qField, "==", formattedQuery));
      const snap = await getDocs(q);

      const results = snap.docs.map((d) => d.data() as UserProfile);

      if (results.length === 0) {
        toast.info("No user found with that exact information.");
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error searching for user.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: "admin" | "manager" | "team" | "user") => {
    setActionLoading(uid);
    try {
      await updateDoc(doc(db, "users", uid), {
        role: newRole,
      });
      toast.success(`User role updated to ${newRole}`);
      // Refresh current team
      fetchTeam();
      // Update local search results if they are in the list
      setSearchResults((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error(err);
      toast.error("Failed to update role");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (profile?.role !== "admin") {
    return <div className="p-8 text-center text-destructive font-bold">Access Denied</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-primary">Team Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage platform administrators, managers, and team members.
        </p>
      </div>

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="team" className="flex gap-2">
            <ShieldCheck className="size-4" /> Current Team
          </TabsTrigger>
          <TabsTrigger value="search" className="flex gap-2">
            <UserCog className="size-4" /> Search & Assign
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-6">
          <Card className="border-0 shadow-card">
            <CardContent className="p-6">
              <div className="mb-6 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Filter team by name, email or phone..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {teamLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading team members...
                </div>
              ) : currentTeam.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No team members found.</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentTeam
                    .filter(
                      (member) =>
                        !teamSearchQuery ||
                        member.fullName?.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                        member.email?.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
                        member.phoneNumber?.toLowerCase().includes(teamSearchQuery.toLowerCase()),
                    )
                    .map((member) => (
                      <Card key={member.uid} className="border shadow-sm flex flex-col">
                        <div className="p-4 flex gap-4 items-start">
                          <div className="size-12 shrink-0 rounded-full bg-secondary overflow-hidden">
                            {member.profilePhotoUrl ? (
                              <img
                                src={member.profilePhotoUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-full h-full p-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-primary truncate">{member.fullName}</h3>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.phoneNumber}
                            </p>
                            <div className="mt-2 inline-block px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary capitalize">
                              {member.role}
                            </div>
                          </div>
                        </div>
                        <div className="mt-auto p-4 border-t bg-secondary/20 flex gap-2">
                          <Select
                            disabled={actionLoading === member.uid || member.uid === profile.uid}
                            value={member.role}
                            onValueChange={(val: any) => handleUpdateRole(member.uid, val)}
                          >
                            <SelectTrigger className="flex-1 h-8 text-xs">
                              <SelectValue placeholder="Change Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="team">Team</SelectItem>
                            </SelectContent>
                          </Select>
                          {member.uid !== profile.uid && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 px-3 text-xs shrink-0"
                              disabled={actionLoading === member.uid}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Are you sure you want to remove ${member.fullName} from the team?`,
                                  )
                                ) {
                                  handleUpdateRole(member.uid, "user");
                                }
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <Card className="border-0 shadow-card">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex gap-3 items-end max-w-lg">
                <div className="flex-1 space-y-2">
                  <Label>Search by Exact Email or Phone Number</Label>
                  <Input
                    placeholder="e.g. user@example.com or +919876543210"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={searchLoading}>
                  <Search className="size-4 mr-2" /> Search
                </Button>
              </form>

              {searchResults.length > 0 && (
                <div className="mt-8 border-t pt-8">
                  <h3 className="font-display font-bold text-lg mb-4">Search Results</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((member) => (
                      <Card key={member.uid} className="border shadow-sm flex flex-col">
                        <div className="p-4 flex gap-4 items-start">
                          <div className="size-12 shrink-0 rounded-full bg-secondary overflow-hidden">
                            {member.profilePhotoUrl ? (
                              <img
                                src={member.profilePhotoUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-full h-full p-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-primary truncate">{member.fullName}</h3>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.phoneNumber}
                            </p>
                            <div className="mt-2 inline-block px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary capitalize">
                              Current: {member.role}
                            </div>
                          </div>
                        </div>
                        <div className="mt-auto p-4 border-t bg-secondary/20 space-y-2">
                          <Label className="text-xs text-muted-foreground">Assign New Role</Label>
                          <div className="flex gap-2">
                            <Select
                              disabled={actionLoading === member.uid || member.uid === profile.uid}
                              value={member.role}
                              onValueChange={(val: any) => handleUpdateRole(member.uid, val)}
                            >
                              <SelectTrigger className="flex-1 h-8 text-xs">
                                <SelectValue placeholder="Select Role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="team">Team</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                            {member.uid !== profile.uid && member.role !== "user" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 px-3 text-xs shrink-0"
                                disabled={actionLoading === member.uid}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to remove ${member.fullName} from the team?`,
                                    )
                                  ) {
                                    handleUpdateRole(member.uid, "user");
                                  }
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
