import Image from "next/image";
import Link from "next/link";

export const MobileBottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden">
      <div className="mx-auto flex max-w-[640px] items-center justify-between px-6 py-2">
        <Link href="/learn" className="flex flex-1 flex-col items-center gap-1">
          <Image src="/learn.png" alt="Learn" height={24} width={24} />
          <span className="text-[11px]">Learn</span>
        </Link>
        <Link href="/leaderboard" className="flex flex-1 flex-col items-center gap-1">
          <Image src="/leaderboard.png" alt="Leaderboard" height={24} width={24} />
          <span className="text-[11px]">Leaderboard</span>
        </Link>
        <Link href="/quests" className="flex flex-1 flex-col items-center gap-1">
          <Image src="/quests.png" alt="Quests" height={24} width={24} />
          <span className="text-[11px]">Quests</span>
        </Link>
        <Link href="/shop" className="flex flex-1 flex-col items-center gap-1">
          <Image src="/shop.png" alt="Shop" height={24} width={24} />
          <span className="text-[11px]">Shop</span>
        </Link>
      </div>
    </div>
  );
};


