import { ActionPanel, Detail, List, Action, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import { graphqlClient, Project, RecentProjectsQuery, recentProjectsQuery } from "./query";
import { Preferences } from "./preferences";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { login } = getPreferenceValues<Preferences>();

export default function Command() {
  const [recentProjects, setRecentProjects] = useState<Array<Project>>([]);

  useEffect(() => {
    async function fetchRecentProjects() {
      try {
        const result: RecentProjectsQuery = await graphqlClient(recentProjectsQuery, { login });

        setRecentProjects(result.organization.recentProjects.nodes);
      } catch (error) {
        console.error(error);
      }
    }

    fetchRecentProjects();
  }, []);

  return (
    <List navigationTitle="Search Projects" searchBarPlaceholder="Search your Projects" isShowingDetail>
      {recentProjects.length > 0 ? (
        <List.Section title="Recently Updated Projects">
          {recentProjects.map((p) => (
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
                  <Action.OpenInBrowser title="Open Project" url={p.url} />
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
