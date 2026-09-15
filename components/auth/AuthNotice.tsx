export default function AuthNotice({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <div
      role="status"
      className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
        error
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
    >
      {error ?? message}
    </div>
  );
}
