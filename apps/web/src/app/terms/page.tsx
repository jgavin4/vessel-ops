import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
      <p className="text-muted-foreground mb-6">
        Placeholder. Add your terms of service here.
      </p>
      <Link href="/" className="text-primary hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
