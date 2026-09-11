export function Spinner({ full = false }: { full?: boolean }) {
  return (
    <div
      className={
        full
          ? "flex min-h-screen items-center justify-center bg-void"
          : "flex min-h-[40vh] items-center justify-center"
      }
    >
      <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-crimson" />
    </div>
  );
}
