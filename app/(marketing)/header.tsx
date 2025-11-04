"use client";
import { useEffect, useState } from "react";

import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import Banner from "@/components/banner";
import { Button } from "@/components/ui/button";
import { links } from "@/config";
import { cn } from "@/lib/utils";

const AdminDashboardButton = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/is-admin", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch admin status");
        const data = await res.json();
        if (isMounted) setIsAdmin(Boolean(data?.isAdmin));
      } catch (_) {
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkAdmin();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !isAdmin) return null;

  return (
    <Link href="/admin">
      <Button size="lg" variant="secondary">Go to dashboard</Button>
    </Link>
  );
};

export const Header = () => {
  const { isSignedIn } = useAuth();
  const [hideBanner, setHideBanner] = useState(true);

  return (
    <>
      <Banner hide={hideBanner} setHide={setHideBanner} />

      <header
        className={cn(
          "h-20 w-full border-b-2 border-slate-200 px-4",
          !hideBanner ? "mt-20 sm:mt-16 lg:mt-10" : "mt-0"
        )}
      >
        <div className="mx-auto flex h-full items-center justify-between lg:max-w-screen-lg">
          <Link href="/" className="flex items-center gap-x-3 pb-7 pl-4 pt-8">
            <Image src="/smartbit-logo.svg" alt="Mascot" height={50} width={50} />

            <h1 className="text-2xl font-extrabold tracking-wide text-[#081a2e]">
              Smart <span className="text-[#ee9833]
              "> Bit </span>
            </h1>
          </Link>

          <div className="flex gap-x-3">
            <ClerkLoading>
              <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
            </ClerkLoading>
            <ClerkLoaded>
              <SignedIn>
                {/* Admin button */}
                {isSignedIn && (
                  <AdminDashboardButton />
                )}
                <UserButton />
              </SignedIn>

              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg" variant="ghost">
                    Login
                  </Button>
                </SignInButton>
              </SignedOut>

            </ClerkLoaded>
          </div>
        </div>
      </header>
    </>
  );
};
