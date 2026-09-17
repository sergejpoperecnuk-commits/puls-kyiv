import { createFileRoute } from "@tanstack/react-router";
import { LiveWorkspace } from "@/components/live-workspace";
import { loadFeedWorkspace } from "@/lib/pulse/api";
import { parseFeedSearch } from "@/lib/pulse/search";

export const Route = createFileRoute("/")({
  validateSearch: parseFeedSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadFeedWorkspace(deps),
  component: HomePage,
});

function HomePage() {
  const initial = Route.useLoaderData();
  const search = Route.useSearch();
  return (
    <LiveWorkspace
      variant="dashboard"
      search={search}
      searchFrom="/"
      initial={initial}
    />
  );
}
