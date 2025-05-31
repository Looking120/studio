
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPageDeprecated() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/'); 
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full mt-4" />
        <p className="text-center text-muted-foreground pt-4">
          Redirecting to the login page...
        </p>
      </div>
    </div>
  );
}
