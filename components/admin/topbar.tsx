"use client";

import { UserButton } from "@clerk/nextjs";


export function AdminTopBar() {
  return (
    <div className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      </div>
    
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
            },
          }}
        />
    </div>
  );
}

