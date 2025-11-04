import { ClerkLoading, ClerkLoaded, UserButton } from "@clerk/nextjs";
import { Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { SidebarItem } from "./sidebar-item";

type SidebarProps = {
  className?: string;
};

export const Sidebar = ({ className }: SidebarProps) => {
  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={cn(
          "left-0 top-0 hidden h-full flex-col border-r-2 px-2 md:fixed md:flex md:w-[72px] lg:w-[256px] lg:px-4",
          className
        )}
      >
        <Link href="/">
          <div className="flex items-center gap-x-3 pb-7 pt-8 md:justify-center lg:justify-start lg:pl-4">
            <Image src="/smartbit-logo.svg" alt="Mascot" height={40} width={40} />
            <h1 className="hidden text-2xl font-extrabold tracking-wide text-black-600 lg:block">
                Smart <span className="text-[#ee9833]">Bit</span>
              </h1>
          </div>
        </Link>

        <div className="flex flex-1 flex-col gap-y-2">
          <SidebarItem label="Learn" href="/learn" iconSrc="/learn.svg" />
          <SidebarItem
            label="Leaderboard"
            href="/leaderboard"
            iconSrc="/leaderboard.svg"
          />
          <SidebarItem label="Quests" href="/quests" iconSrc="/quests.svg" />
          <SidebarItem label="Shop" href="/shop" iconSrc="/shop.svg" />
        </div>

        <div className="p-4">
          <ClerkLoading>
            <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
          </ClerkLoading>

          <ClerkLoaded>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { userButtonPopoverCard: { pointerEvents: "initial" } },
              }}
            />
          </ClerkLoaded>
        </div>
      </div>

      {/* Mobile bottom nav removed; now a dedicated component */}
    </>
  );
};
