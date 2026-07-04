import { Logo } from "@/components/marketing/Logo";
import { ResetForm } from "./ResetForm";

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="flex justify-center mb-8"><Logo size="lg" /></div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Set a new password</h1>
        <p className="text-muted mt-1 mb-6" style={{ fontSize: "0.875rem" }}>
          Choose a password of at least 8 characters.
        </p>
        <ResetForm token={token} />
      </div>
    </main>
  );
}
