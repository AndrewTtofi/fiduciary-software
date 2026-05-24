"use client";
import { useState } from "react";
import { EditRequestModal } from "./EditRequestModal";

export function EditRequestClient({ id, description, dueAt }: {
  id: string;
  description: string;
  dueAt: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[12px] underline mr-2"
      >
        Edit
      </button>
      {open && (
        <EditRequestModal
          id={id}
          description={description}
          dueAt={dueAt}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
