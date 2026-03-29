export default function DashboardLoadingState () {
  return (
    <div className="flex flex-col items-center justify-center mt-auto mb-auto min-h-[50vh]">
      <span className="loading loading-spinner text-primary mb-6"></span>
      <p className="text-text-label">Loading all settlements…</p>
    </div>
  );
}
