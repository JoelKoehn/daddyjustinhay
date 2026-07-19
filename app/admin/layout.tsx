import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border bg-background-elevated">
        <div className="mx-auto flex max-w-6xl gap-6 px-6 py-3 text-sm">
          <Link
            href="/admin"
            className="font-heading uppercase tracking-wide text-muted transition-colors hover:text-accent"
          >
            Lots
          </Link>
          <Link
            href="/admin/sellers"
            className="font-heading uppercase tracking-wide text-muted transition-colors hover:text-accent"
          >
            Sellers
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
