// File: app/api/upload-auth/route.ts
import { getUploadAuthParams } from "@imagekit/next/server";

export const runtime = "nodejs";

export function GET() {
    try {
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
        const publicKey =
            process.env.IMAGEKIT_PUBLIC_KEY?.trim() ??
            process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY?.trim();

        if (!privateKey || !publicKey) {
            console.error("ImageKit credentials are not configured");

            return Response.json(
                { error: "ImageKit credentials are not configured." },
                { status: 500 }
            );
        }

        // Calculate expire time as 30 minutes from now (within 1 hour limit)
        const expireTime = Math.floor(Date.now() / 1000) + 30 * 60; // 30 minutes in seconds

        const { token, expire, signature } = getUploadAuthParams({
            privateKey,
            publicKey,
            expire: expireTime,
        });

        return Response.json(
            { token, expire: Number(expire), signature, publicKey },
            {
                headers: {
                    "Cache-Control": "no-store, max-age=0",
                },
            }
        );
    } catch (error) {
        console.error("Failed to generate ImageKit upload credentials", error);

        return Response.json(
            { error: "Failed to generate upload credentials." },
            { status: 500 }
        );
    }
}