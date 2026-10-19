"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";

export function SubmitButton({ children, pendingText }: { children: string; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending} className="w-full">
      {pending ? pendingText : children}
    </Button>
  );
}
