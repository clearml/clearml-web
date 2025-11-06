import {GetCurrentUserResponseUserObjectCompany} from '~/business-logic/model/users/getCurrentUserResponseUserObjectCompany';

export const isSharedAndNotOwner = (item, activeWorkSpace: GetCurrentUserResponseUserObjectCompany): boolean =>
  item?.system_tags?.includes('shared') && item?.company?.id !== activeWorkSpace?.id && (!!item?.company.id);

export const isSharedNotInWorkspaces = (item, workspaces: GetCurrentUserResponseUserObjectCompany[]): boolean =>
  item?.system_tags?.includes('shared') && !workspaces.map(ws=> ws.id).includes(item?.company?.id) && (!!item?.company.id);
