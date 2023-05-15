import { Action, ActionPanel, List, LocalStorage } from "@raycast/api";
import { Project } from "./query";
import dayjs from "dayjs";
import { useCallback } from "react";

export function ProjectItem({ project }: { project: Project }) {
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

  return (
    <List.Item
      key={project.id}
      title={project.title}
      icon={{ source: "table.svg" }}
      detail={
        <List.Item.Detail
          markdown={project.shortDescription}
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label title="Public" text={project.public.toString()} />
              <List.Item.Detail.Metadata.Separator />
              <List.Item.Detail.Metadata.Label title="Last Updated" text={dayjs(project.updatedAt).fromNow()} />
              <List.Item.Detail.Metadata.Separator />
              <List.Item.Detail.Metadata.Label title="Items" text={`${project.items.totalCount}`} />
              <List.Item.Detail.Metadata.Separator />
              <List.Item.Detail.Metadata.Label title="Views" text={`${project.views.totalCount}`} />
              <List.Item.Detail.Metadata.Separator />
            </List.Item.Detail.Metadata>
          }
        />
      }
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open Project" url={project.url} onOpen={onOpenProject} />
        </ActionPanel>
      }
    />
  );
}
