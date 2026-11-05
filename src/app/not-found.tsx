import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Not found</h1>
      <p className="mb-6 text-muted-foreground">That page or bill doesn&apos;t exist.</p>
      <Button asChild>
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
