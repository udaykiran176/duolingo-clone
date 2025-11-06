import { BookOpen, GraduationCap, FileText, Puzzle, Users, Megaphone } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";

const stats = [
  {
    title: "Courses",
    href: "/admin/courses",
    icon: BookOpen,
    description: "Manage courses",
  },
  {
    title: "Units",
    href: "/admin/units",
    icon: GraduationCap,
    description: "Manage units",
  },
  {
    title: "Lessons",
    href: "/admin/lessons",
    icon: FileText,
    description: "Manage lessons",
  },
  {
    title: "Challenges",
    href: "/admin/challenges",
    icon: Puzzle,
    description: "Manage challenges",
  },
  {
    title: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone,
    description: "Manage announcements",
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    description: "View users",
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your learning platform content
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.href} href={stat.href}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{stat.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

