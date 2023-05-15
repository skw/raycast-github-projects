import { ActionPanel, List, Action, getPreferenceValues, LocalStorage } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { graphqlClient, Project, RecentProjectsQuery, recentProjectsQuery } from "./query";
import { ProjectItem } from "./projectItem";
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
            <ProjectItem key={p.id} project={p} />
          ))}
        </List.Section>
      ) : null}
      {recentProjects.length > 0 && !isLoadingRecentProjects ? (
        <List.Section title="Recently Updated Projects">
          {recentProjects
            .filter((p) => !recentlyViewedProjectMap.get(p.url))
            .map((p) => (
              <ProjectItem key={p.id} project={p} />
            ))}
        </List.Section>
      ) : (
        <List.EmptyView icon={{ source: "https://placekitten.com/500/500" }} title="No projects found" />
      )}
    </List>
  );
}
