interface FieldFeedbackProps {
  id: string;
  message?: string;
  tone?: "error" | "warning";
}

export function FieldFeedback({ id, message, tone = "error" }: FieldFeedbackProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={tone === "error" ? "text-red-600 text-xs mt-1" : "text-amber-600 text-xs mt-1"}
    >
      {message}
    </p>
  );
}
