"use client";

import { useActionState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AdminFormState } from "@/app/lib/actions/admin";
import { deleteLotMedia } from "@/app/lib/actions/admin";

type Seller = { id: string; name: string };
type ExistingMedia = { id: string; url: string; type: string };

type InitialLot = {
  title: string;
  description: string | null;
  hay_type: string | null;
  region: string | null;
  seller_id: string;
  bid_increment: number;
  end_time: string;
  status: string;
};

// Converts a UTC ISO timestamp into the "YYYY-MM-DDTHH:mm" shape a
// datetime-local input expects, using the *browser's* local time.
function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function LotForm({
  sellers,
  action,
  initial,
  existingMedia,
  lotId,
  submitLabel,
}: {
  sellers: Seller[];
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  initial?: InitialLot;
  existingMedia?: ExistingMedia[];
  lotId?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const router = useRouter();

  const inputClass =
    "mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-foreground";
  const labelClass = "block text-sm font-medium text-muted";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // The datetime-local input gives a plain local-time string with no
    // timezone. Converting to ISO here (in the browser) uses the admin's
    // actual timezone — converting server-side would silently use the
    // server's timezone instead and could shift the auction end time by
    // several hours.
    const endTimeLocal = String(formData.get("end_time") ?? "");
    if (endTimeLocal) {
      formData.set("end_time", new Date(endTimeLocal).toISOString());
    }
    formAction(formData);
  }

  async function handleDeleteMedia(mediaId: string) {
    await deleteLotMedia(mediaId);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={initial?.title}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="hay_type" className={labelClass}>
            Hay type
          </label>
          <input
            id="hay_type"
            name="hay_type"
            defaultValue={initial?.hay_type ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="region" className={labelClass}>
            Region
          </label>
          <input
            id="region"
            name="region"
            defaultValue={initial?.region ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="seller_id" className={labelClass}>
          Seller
        </label>
        <select
          id="seller_id"
          name="seller_id"
          required
          defaultValue={initial?.seller_id ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Select a seller
          </option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {!initial && (
          <div>
            <label htmlFor="starting_price" className={labelClass}>
              Starting price ($)
            </label>
            <input
              id="starting_price"
              name="starting_price"
              type="number"
              step="0.01"
              min="0"
              required
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label htmlFor="bid_increment" className={labelClass}>
            Bid increment ($)
          </label>
          <input
            id="bid_increment"
            name="bid_increment"
            type="number"
            step="0.01"
            min="1"
            required
            defaultValue={initial?.bid_increment ?? 10}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="end_time" className={labelClass}>
          Auction end time
        </label>
        <input
          id="end_time"
          name="end_time"
          type="datetime-local"
          required
          defaultValue={initial ? toDatetimeLocalValue(initial.end_time) : undefined}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={initial?.status ?? "draft"}
          className={inputClass}
        >
          <option value="draft">Draft (hidden from buyers)</option>
          <option value="active">Active (live for bidding)</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {existingMedia && existingMedia.length > 0 && (
        <div>
          <p className={labelClass}>Current photos</p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {existingMedia.map((m) => (
              <div key={m.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="" className="aspect-square w-full rounded-sm object-cover" />
                {lotId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(m.id)}
                    className="absolute right-1 top-1 rounded-sm bg-background/90 px-1.5 py-0.5 text-xs text-danger"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="photos" className={labelClass}>
          {existingMedia?.length ? "Add more photos" : "Photos"}
        </label>
        <input id="photos" name="photos" type="file" accept="image/*" multiple className={inputClass} />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-accent px-5 py-2 font-heading uppercase tracking-wide text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
