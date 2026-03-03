import { SignIn } from "@clerk/nextjs";
import { ClerkAuthDebug } from "@/components/clerk-auth-debug";

export default function SignInPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <ClerkAuthDebug />
      <SignIn />
    </div>
  );
}
