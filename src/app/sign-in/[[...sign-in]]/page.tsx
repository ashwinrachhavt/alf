import { SignIn } from "@clerk/nextjs";

export default function Page() {
  // Check if Clerk is configured
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!hasClerkKey) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Not Configured</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Clerk authentication is not configured for this application.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <SignIn />
    </div>
  );
}

