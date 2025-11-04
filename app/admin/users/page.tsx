"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, Crown, User } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Breadcrumb } from "@/components/admin/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type User = {
  userId: string;
  userName: string;
  userImageSrc: string;
  hearts: number;
  points: number;
  activeCourse: string;
  hasSubscription: boolean;
  isActive: boolean;
  subscriptionEndDate: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

type UsersResponse = {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

async function fetchUsers(
  search: string,
  page: number
): Promise<UsersResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: "10",
  });
  if (search) {
    params.append("search", search);
  }
  const res = await fetch(`/api/users?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["users", debouncedSearch, page],
    queryFn: () => fetchUsers(debouncedSearch, page),
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isSubscriptionActive = (user: User) => {
    if (!user.subscriptionEndDate) return false;
    const endDate = new Date(user.subscriptionEndDate);
    const now = new Date();
    return endDate.getTime() > now.getTime();
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Users" }]} />
        <h1 className="mt-2 text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          View and manage all platform users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or user ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : !data?.users || data.users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Hearts</TableHead>
                      <TableHead>Active Course</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user) => {
                      const hasActiveSubscription = isSubscriptionActive(user);
                      return (
                        <TableRow key={user.userId}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 overflow-hidden rounded-full">
                                <Image
                                  src={user.userImageSrc}
                                  alt={user.userName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-medium">{user.userName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {user.userId.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{user.points}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{user.hearts}</span>
                          </TableCell>
                          <TableCell>{user.activeCourse}</TableCell>
                          <TableCell>
                            {user.hasSubscription ? (
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {formatDate(user.subscriptionEndDate)}
                                </span>
                                {user.stripeSubscriptionId && (
                                  <span className="text-xs text-muted-foreground">
                                    {user.stripeSubscriptionId.slice(0, 12)}...
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                No subscription
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasActiveSubscription ? (
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-orange-500" />
                                <span className="text-sm font-medium text-orange-500">
                                  Active
                                </span>
                              </div>
                            ) : user.hasSubscription ? (
                              <span className="text-sm text-muted-foreground">
                                Expired
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  Free
                                </span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {data.pagination.page * data.pagination.limit -
                      data.pagination.limit +
                      1}{" "}
                    to{" "}
                    {Math.min(
                      data.pagination.page * data.pagination.limit,
                      data.pagination.total
                    )}{" "}
                    of {data.pagination.total} users
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {data.pagination.page} of{" "}
                      {data.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) =>
                          Math.min(data.pagination.totalPages, p + 1)
                        )
                      }
                      disabled={page === data.pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

