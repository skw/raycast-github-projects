import { ActionPanel, List, Action, getPreferenceValues, LocalStorage } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { graphqlClient, Project, RecentProjectsQuery, recentProjectsQuery } from "./query";
import { Preferences } from "./preferences";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { login } = getPreferenceValues<Preferences>();

export default function Command() {
  const [isLoadingRecentProjects, setIsLoadingRecentProjects] = useState<boolean>(true);
  const [recentProjects, setRecentProjects] = useState<Array<Project>>([]);
  const [recentlyViewedProjects, setRecentlyViewedProjects] = useState<Array<Project>>([]);
  const [recentlyViewedProjectMap, setRecentlyViewedProjectMap] = useState<Map<string, Project>>(new Map());

  useEffect(() => {
    async function fetchRecentProjects() {
      try {
        setIsLoadingRecentProjects(true);

        const result: RecentProjectsQuery = await graphqlClient(recentProjectsQuery, { login });

        setRecentProjects(result.organization.recentProjects.nodes);
        setIsLoadingRecentProjects(false);
      } catch (error) {
        console.error(error);
      }
    }

    fetchRecentProjects();
  }, []);

  const onOpenProject = useCallback(async (url: string) => {
    const currentJson = await LocalStorage.getItem(`recently-viewed`);

    const hash = currentJson ? JSON.parse(currentJson.toString()) : {};

    LocalStorage.setItem(
      `recently-viewed`,
      JSON.stringify({
        ...hash,
        [url]: Date.now(),
      })
    );
  }, []);

  useEffect(() => {
    async function parseRecentlyViewedProjects() {
      try {
        const currentJson = await LocalStorage.getItem(`recently-viewed`);

        if (!currentJson) return;

        const hash = JSON.parse(currentJson.toString());

        setRecentlyViewedProjects(recentProjects.filter((project) => hash[project.url]).sort());

        setRecentlyViewedProjectMap(
          new Map(recentProjects.filter((project) => hash[project.url]).map((project) => [project.url, project]))
        );
      } catch (error) {
        console.error(error);
      }
    }

    parseRecentlyViewedProjects();
  }, [recentProjects]);

  return (
    <List
      navigationTitle="Search Projects"
      searchBarPlaceholder="Search your Projects"
      isShowingDetail
      isLoading={isLoadingRecentProjects}
    >
      {recentlyViewedProjects.length > 0 ? (
        <List.Section title="Recently Viewed">
          {recentlyViewedProjects.map((p) => (
            <List.Item
              key={p.id}
              title={p.title}
              icon={{ source: "table.svg" }}
              detail={
                <List.Item.Detail
                  markdown={p.shortDescription}
                  metadata={
                    <List.Item.Detail.Metadata>
                      <List.Item.Detail.Metadata.Label title="Public" text={p.public.toString()} />
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Label title="Last Updated" text={dayjs(p.updatedAt).fromNow()} />
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Label title="Items" text={`${p.items.totalCount}`} />
                      <List.Item.Detail.Metadata.Separator />
                      <List.Item.Detail.Metadata.Label title="Views" text={`${p.views.totalCount}`} />
                      <List.Item.Detail.Metadata.Separator />
                    </List.Item.Detail.Metadata>
                  }
                />
              }
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser title="Open Project" url={p.url} onOpen={onOpenProject} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ) : null}
      {recentProjects.length > 0 && !isLoadingRecentProjects ? (
        <List.Section title="Recently Updated Projects">
          {recentProjects
            .filter((p) => !recentlyViewedProjectMap.get(p.url))
            .map((p) => (
              <List.Item
                key={p.id}
                title={p.title}
                icon={{ source: "table.svg" }}
                detail={
                  <List.Item.Detail
                    markdown={p.shortDescription}
                    metadata={
                      <List.Item.Detail.Metadata>
                        <List.Item.Detail.Metadata.Label title="Public" text={p.public.toString()} />
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Label title="Last Updated" text={dayjs(p.updatedAt).fromNow()} />
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Label title="Items" text={`${p.items.totalCount}`} />
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Label title="Views" text={`${p.views.totalCount}`} />
                        <List.Item.Detail.Metadata.Separator />
                      </List.Item.Detail.Metadata>
                    }
                  />
                }
                actions={
                  <ActionPanel>
                    <Action.OpenInBrowser title="Open Project" url={p.url} onOpen={onOpenProject} />
                  </ActionPanel>
                }
              />
            ))}
        </List.Section>
      ) : (
        <List.EmptyView icon={{ source: "https://placekitten.com/500/500" }} title="No projects found" />
      )}
    </List>
  );
}
