"use client";

// Last-resort error page, used when the main layout itself fails.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          fontFamily: "system-ui, Tahoma, sans-serif",
          textAlign: "center",
          padding: "4rem 1rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem" }}>صار خطأ غير متوقع</h1>
        <p style={{ color: "#475569" }}>حاول مرة ثانية بعد شوي.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "1rem",
            padding: "0.6rem 1.2rem",
            borderRadius: 8,
            border: 0,
            background: "#1c625b",
            color: "#fff",
          }}
        >
          حاول مرة ثانية
        </button>
      </body>
    </html>
  );
}
