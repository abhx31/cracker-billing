"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="py-20 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Something went wrong</h1>
      <p className="mb-6 text-muted-foreground">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "Check your internet / database connection and try again."}
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
