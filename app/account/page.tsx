import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/lib/actions/auth";
import { BankLinkButton } from "@/components/bank-link-button";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, bank_linked")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-6 py-16">
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-foreground">
        Your account
      </h1>
      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between border-b border-border py-2">
          <dt className="text-muted">Email</dt>
          <dd className="text-foreground">{user.email}</dd>
        </div>
        <div className="flex justify-between border-b border-border py-2">
          <dt className="text-muted">Name</dt>
          <dd className="text-foreground">{profile?.full_name || "—"}</dd>
        </div>
        <div className="flex justify-between border-b border-border py-2">
          <dt className="text-muted">Bank linked</dt>
          <dd className={profile?.bank_linked ? "text-success" : "text-foreground"}>
            {profile?.bank_linked ? "Yes" : "Not yet"}
          </dd>
        </div>
      </dl>

      {!profile?.bank_linked && (
        <div className="mt-6">
          <BankLinkButton email={user.email} />
        </div>
      )}

      <form action={logout} className="mt-8">
        <button type="submit" className="text-sm text-muted underline hover:text-foreground">
          Sign out
        </button>
      </form>
    </div>
  );
}
