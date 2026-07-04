import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  Video, Users, Search, BookOpen, Calendar, Clock,
  AlertCircle, Tv, User, Loader2
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import JitsiMeeting from "../components/features/JitsiMeeting";

interface Classroom {
  id: string;
  title: string;
  description: string;
  type: "direct" | "differe" | "video";
  video_url?: string;
  lawyer_id: string;
  scheduled_at?: string;
  duration_minutes: number;
  max_members: number;
  created_at: string;
  lawyer_first_name?: string;
  lawyer_last_name?: string;
}

const ClassroomsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "direct" | "differe" | "video">("all");
  const [registrations, setRegistrations] = useState<string[]>([]);
  const [activeClassroom, setActiveClassroom] = useState<Classroom | null>(null);
  const [isInMeeting, setIsInMeeting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: rooms, error: roomsErr } = await supabase
        .from("classrooms_just")
        .select("*, registrations:classroom_registrations_just(count)")
        .order("created_at", { ascending: false });

      if (roomsErr) {
        console.error("Classrooms fetch error:", roomsErr.message);
        setClassrooms([]);
        return;
      }

      if (rooms && rooms.length > 0) {
        const lawyerIds = [...new Set(rooms.map((r) => r.lawyer_id))] as string[];
        const { data: profiles } = await supabase
          .from("profiles_just")
          .select("id, first_name, last_name")
          .in("id", lawyerIds);

        const profileMap: Record<string, { first_name: string; last_name: string }> = {};
        profiles?.forEach((p) => { profileMap[p.id] = p; });

        const enriched = rooms.map((r) => ({
          ...r,
          lawyer_first_name: profileMap[r.lawyer_id]?.first_name || "",
          lawyer_last_name: profileMap[r.lawyer_id]?.last_name || "",
          registered_count: (r.registrations as any)?.[0]?.count || 0,
        }));
        setClassrooms(enriched);
      } else {
        setClassrooms([]);
      }

      if (user) {
        const { data: regs } = await supabase
          .from("classroom_registrations_just")
          .select("classroom_id")
          .eq("user_id", user.id);
        setRegistrations(regs?.map((r) => r.classroom_id) || []);
      }
    } catch (e) {
      console.error("fetchData error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    const ch = supabase
      .channel("classrooms-public-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "classrooms_just" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_registrations_just" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchData]);

  useEffect(() => {
    if (classrooms.length > 0 && !isInMeeting) {
      const params = new URLSearchParams(window.location.search);
      const joinId = params.get("join");
      if (joinId) {
        const room = classrooms.find((r) => r.id === joinId);
        if (room) {
          joinMeeting(room);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classrooms, isInMeeting]);

  const handleRegister = async (classroom: Classroom) => {
    if (!user) { navigate("/login?redirect=/classrooms"); return; }
    const isReg = registrations.includes(classroom.id);
    if (isReg) {
      await supabase
        .from("classroom_registrations_just")
        .delete()
        .eq("classroom_id", classroom.id)
        .eq("user_id", user.id);
      setRegistrations((p) => p.filter((id) => id !== classroom.id));
    } else {
      await supabase
        .from("classroom_registrations_just")
        .insert([{ classroom_id: classroom.id, user_id: user.id }]);
      setRegistrations((p) => [...p, classroom.id]);
    }
  };

  const joinMeeting = async (classroom: Classroom) => {
    if (!user) { navigate("/login?redirect=/classrooms"); return; }
    setActiveClassroom(classroom);
    setIsInMeeting(true);

    // If the lawyer of the classroom is the current user, set the classroom live in real-time!
    if (classroom.lawyer_id === user.id) {
      await supabase
        .from("classrooms_just")
        .update({ is_live: true })
        .eq("id", classroom.id);
    }
  };

  const leaveMeeting = useCallback(async () => {
    if (activeClassroom && user && activeClassroom.lawyer_id === user.id) {
      await supabase
        .from("classrooms_just")
        .update({ is_live: false })
        .eq("id", activeClassroom.id);
    }
    setIsInMeeting(false);
    setActiveClassroom(null);
  }, [activeClassroom, user]);

  const filtered = classrooms.filter((r) => {
    const q = searchQuery.toLowerCase();
    const match = r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    if (activeFilter === "all") return match;
    return r.type === activeFilter && match;
  });

  if (isInMeeting && activeClassroom) {
    const displayName = profile
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      : user?.email || "Participant";
    const email = user?.email || "";
    const isHost = activeClassroom.lawyer_id === user?.id;

    return (
      <JitsiMeeting
        roomId={activeClassroom.id}
        displayName={displayName || "Participant"}
        email={email}
        onLeave={leaveMeeting}
        isHost={isHost}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden mb-12 shadow-2xl bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white p-8 md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(59,130,246,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.1),transparent_60%)]" />
          <div className="relative z-10 max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-500/30 text-primary-200 border border-primary-500/20">
              <Tv className="w-3.5 h-3.5" /> Espace Academique
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Formations et Visioconferences Juridiques
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Rejoignez des sessions en direct avec vos pairs, participez a des classes video interactives avec une vraie visioconference integree.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 backdrop-blur px-4 py-2 rounded-xl border border-white/10">
                <Video className="w-4 h-4 text-primary-400" /> Visio WebRTC reelle
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 backdrop-blur px-4 py-2 rounded-xl border border-white/10">
                <Users className="w-4 h-4 text-emerald-400" /> 100+ participants
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 backdrop-blur px-4 py-2 rounded-xl border border-white/10">
                <Video className="w-4 h-4 text-purple-400" /> Partage ecran reel
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Toutes les salles" },
              { id: "direct", label: "Direct" },
              { id: "video", label: "Video" },
              { id: "differe", label: "Differe" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as "all" | "direct" | "differe" | "video")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  activeFilter === f.id
                    ? "bg-primary-600 text-white border-primary-600 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center gap-3 py-24 text-slate-400">
            <Loader2 className="animate-spin h-8 w-8" />
            <span className="text-sm font-medium">Chargement des salles...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center max-w-xl mx-auto shadow-sm">
            <BookOpen className="h-14 w-14 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Aucune salle disponible</h3>
            <p className="text-slate-400 text-sm">Les avocats n ont pas encore cree de salle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((room) => {
              const isReg = registrations.includes(room.id);
              return (
                <Card key={room.id} className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none shadow-md flex flex-col bg-white group">
                  <div className={`h-2 bg-gradient-to-r ${
                    room.type === "direct" ? "from-red-500 to-orange-400" :
                    room.type === "video" ? "from-blue-500 to-indigo-400" :
                    "from-emerald-500 to-teal-400"
                  }`} />
                  <CardContent className="p-6 flex-1 flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          room.type === "direct" ? "bg-red-50 text-red-600" :
                          room.type === "video" ? "bg-blue-50 text-blue-600" :
                          "bg-emerald-50 text-emerald-600"
                        }`}>
                          {room.type === "direct" ? "Direct" : room.type === "video" ? "Salle Video" : "Cours Differe"}
                        </span>
                        {(room as any).is_live && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                            <span className="w-1 h-1 rounded-full bg-white" />
                            EN DIRECT
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium whitespace-nowrap">
                        <Users className="w-3.5 h-3.5" /> {(room as any).registered_count || 0} / {room.max_members}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 line-clamp-2 leading-tight mb-1">{room.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{room.description}</p>
                    </div>
                    <div className="space-y-2 text-sm border-t border-slate-50 pt-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Me <span className="font-semibold text-slate-800">{room.lawyer_first_name} {room.lawyer_last_name}</span></span>
                      </div>
                      {room.scheduled_at && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{new Date(room.scheduled_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{room.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-auto">
                      {user ? (
                        <>
                          <Button
                            variant="primary"
                            className={`w-full font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                              (room as any).is_live
                                ? "bg-red-600 hover:bg-red-700 shadow-red-600/15 animate-bounce-subtle"
                                : "shadow-primary-600/15"
                            }`}
                            onClick={() => joinMeeting(room)}
                          >
                            <Video className="w-4 h-4" /> {(room as any).is_live ? "Rejoindre (Session en cours 🔴)" : "Rejoindre la visio"}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full text-slate-600 text-sm"
                            onClick={() => handleRegister(room)}
                          >
                            {isReg ? "Inscrit - Se desinscrire" : "S inscrire"}
                          </Button>
                        </>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                          <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                          <p className="text-xs text-amber-700 font-medium mb-2">Connectez-vous pour acceder</p>
                          <Button size="sm" variant="primary" className="w-full" onClick={() => navigate("/login?redirect=/classrooms")}>
                            Se connecter
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomsPage;
