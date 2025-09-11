"use client";

export default function ReportButton() {
  return (
    <button
      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
      onClick={() =>
        (window.location.href = "mailto:support.elleai@outlook.com")
      }
    >
      Contact Security Team
    </button>
  );
}
