import { createFileRoute } from "@tanstack/react-router";
import { LiveWorkspace } from "@/components/live-workspace";
import { loadFeedWorkspace } from "@/lib/pulse/api";
import { parseFeedSearch } from "@/lib/pulse/search";

export const Route = createFileRoute("/feed")({
  validateSearch: parseFeedSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => loadFeedWorkspace(deps),
  component: FeedPage,
});

function FeedPage() {
  const initial = Route.useLoaderData();
  const search = Route.useSearch();
  return (
    <LiveWorkspace
      variant="reader"
      search={search}
      searchFrom="/feed"
      initial={initial}
    />
  );
}
