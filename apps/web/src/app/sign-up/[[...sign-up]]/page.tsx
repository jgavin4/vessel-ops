import { SignUp } from "@clerk/nextjs";
import { ClerkAuthDebug } from "@/components/clerk-auth-debug";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <ClerkAuthDebug />
      <SignUp />
    </div>
  );
}
