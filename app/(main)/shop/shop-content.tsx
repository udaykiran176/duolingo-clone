"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useShop, useRefillHearts } from "@/lib/hooks/use-shop";
import { createStripeUrl } from "@/actions/user-subscription";
import { Button } from "@/components/ui/button";
import { MAX_HEARTS, POINTS_TO_REFILL } from "@/constants";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function ShopContent() {
  const [pending, startTransition] = useTransition();
  const { data, isLoading, error } = useShop();
  const refillHearts = useRefillHearts();

  const onRefillHearts = () => {
    if (!data) return;
    if (pending || data.hearts === MAX_HEARTS || data.points < POINTS_TO_REFILL)
      return;

    refillHearts.mutate();
  };

  const onUpgrade = () => {
    toast.loading("Redirecting to checkout...");
    startTransition(() => {
      createStripeUrl()
        .then((response) => {
          if (response.data) window.location.href = response.data;
        })
        .catch(() => toast.error("Something went wrong."));
    });
  };

  if (isLoading) {
    return (
      <div className="flex w-full flex-col items-center">
        <div className="h-[90px] w-[90px] animate-pulse rounded bg-gray-200" />
        <div className="my-6 h-8 w-24 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex w-full flex-col items-center">
        <p className="text-red-500">Failed to load shop</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      <Image
        src="/shop.png"
        alt="Shop"
        height={90}
        width={90}
        priority
        quality={85}
      />

      <h1 className="my-6 text-center text-2xl font-bold text-neutral-800">
        Shop
      </h1>
      <p className="mb-6 text-center text-lg text-muted-foreground">
        Spend your points on cool stuff.
      </p>

      <ul className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full items-center gap-x-4 border-t-2 p-4"
        >
          <Image
            src="/heart.png"
            alt="Heart"
            height={60}
            width={60}
            loading="lazy"
            quality={85}
          />

          <div className="flex-1">
            <p className="text-base font-bold text-neutral-700 lg:text-xl">
              Refill hearts
            </p>
            <p className="text-xs text-muted-foreground">
              Current: {data.hearts} / {MAX_HEARTS}
            </p>
          </div>

          <Button
            onClick={onRefillHearts}
            disabled={
              pending ||
              refillHearts.isPending ||
              data.hearts === MAX_HEARTS ||
              data.points < POINTS_TO_REFILL
            }
            aria-disabled={
              pending ||
              refillHearts.isPending ||
              data.hearts === MAX_HEARTS ||
              data.points < POINTS_TO_REFILL
            }
          >
            {data.hearts === MAX_HEARTS ? (
              "full"
            ) : (
              <div className="flex items-center">
                <Image src="/points.png" alt="Points" height={20} width={20} />

                <p>{POINTS_TO_REFILL}</p>
              </div>
            )}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex w-full items-center gap-x-4 border-t-2 p-4 pt-8"
        >
          <Image
            src="/unlimited.png"
            alt="Unlimited"
            height={60}
            width={60}
            loading="lazy"
            quality={85}
          />

          <div className="flex-1">
            <p className="text-base font-bold text-neutral-700 lg:text-xl">
              Unlimited hearts
            </p>
            <p className="text-xs text-muted-foreground">
              Never lose hearts again
            </p>
          </div>

          <Button onClick={onUpgrade} disabled={pending} aria-disabled={pending}>
            {data.hasActiveSubscription ? "settings" : "upgrade"}
          </Button>
        </motion.div>
      </ul>
    </div>
  );
}

