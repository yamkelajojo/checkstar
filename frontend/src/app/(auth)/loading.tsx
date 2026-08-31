export default function AuthLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
        </div>
        <span className="text-sm font-medium text-foreground/50">Signing you in…</span>
      </div>
    </div>
  );
}
