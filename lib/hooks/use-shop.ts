"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type ShopData = {
  hearts: number;
  points: number;
  hasActiveSubscription: boolean;
};

async function fetchShopData(): Promise<ShopData> {
  const response = await fetch("/api/shop");
  if (!response.ok) {
    throw new Error("Failed to fetch shop data");
  }
  return (await response.json()) as ShopData;
}

export function useShop() {
  return useQuery({
    queryKey: ["shop"],
    queryFn: fetchShopData,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRefillHearts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/shop/refill", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to refill hearts");
      }
      return (await response.json()) as { success?: boolean };
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["shop"] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ShopData>(["shop"]);

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<ShopData>(["shop"], {
          ...previousData,
          hearts: 5, // MAX_HEARTS
          points: Math.max(0, previousData.points - 10), // POINTS_TO_REFILL
        });
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["shop"], context.previousData);
      }
      toast.error("Failed to refill hearts");
    },
    onSuccess: () => {
      toast.success("Hearts refilled!");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
}

