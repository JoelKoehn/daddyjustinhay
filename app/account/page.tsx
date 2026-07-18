import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/lib/actions/auth";

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
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Your account
      </h1>
      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between border-b border-zinc-200 py-2 dark:border-zinc-800">
          <dt className="text-zinc-500">Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-200 py-2 dark:border-zinc-800">
          <dt className="text-zinc-500">Name</dt>
          <dd>{profile?.full_name || "—"}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-200 py-2 dark:border-zinc-800">
          <dt className="text-zinc-500">Bank linked</dt>
          <dd>{profile?.bank_linked ? "Yes" : "Not yet"}</dd>
        </div>
      </dl>

      <form action={logout} className="mt-8">
        <button type="submit" className="text-sm underline">
          Sign out
        </button>
      </form>
    </div>
  );
}
