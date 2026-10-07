"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MeetingFormModal } from "@/components/meetings/MeetingFormModal";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const NewMeetingContext = createContext<{ openCreate: () => void }>({ openCreate: () => {} });
const UserContext = createContext<User | null>(null);

/** Opens the "New meeting" modal from anywhere in the app. */
export const useNewMeeting = () => useContext(NewMeetingContext);
export const useCurrentUser = () => useContext(UserContext);

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .me(controller.signal)
      .then(setUser)
      .catch(() => {}); // the shell still works without the profile
    return () => controller.abort();
  }, []);

  // Close the mobile drawer after navigating.
  useEffect(() => setDrawerOpen(false), [pathname]);

  const openCreate = useCallback(() => setCreating(true), []);
  const closeCreate = useCallback(() => setCreating(false), []);
  const newMeeting = useMemo(() => ({ openCreate }), [openCreate]);

  return (
    <UserContext.Provider value={user}>
      <NewMeetingContext.Provider value={newMeeting}>
        <div className="flex h-dvh overflow-hidden">
          {/* Desktop sidebar */}
          <div className="hidden w-64 shrink-0 md:block">
            <Sidebar user={user} />
          </div>

          {/* Mobile drawer */}
          {drawerOpen && (
            <div className="fixed inset-0 z-40 md:hidden">
              <div className="absolute inset-0 bg-scrim/40" onClick={() => setDrawerOpen(false)} aria-hidden />
              <div className="pop-in relative h-full w-64 bg-surface shadow-xl">
                <Sidebar user={user} />
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar user={user} onOpenMenu={() => setDrawerOpen(true)} onNewMeeting={openCreate} />
            <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
          </div>
        </div>

        {creating && (
          <MeetingFormModal
            onClose={closeCreate}
            onSaved={(meeting) => {
              setCreating(false);
              toast.success("Meeting created");
              router.push(`/meetings/${meeting.id}`);
            }}
          />
        )}
      </NewMeetingContext.Provider>
    </UserContext.Provider>
  );
}
