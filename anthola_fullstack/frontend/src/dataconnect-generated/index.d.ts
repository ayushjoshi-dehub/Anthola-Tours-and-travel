import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AuditLog_Key {
  id: UUIDString;
  __typename?: 'AuditLog_Key';
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface ContentItem_Key {
  id: UUIDString;
  __typename?: 'ContentItem_Key';
}

export interface CreateCategoryData {
  category_insert: Category_Key;
}

export interface CreateCategoryVariables {
  name: string;
  slug: string;
}

export interface CreateContentItemData {
  contentItem_insert: ContentItem_Key;
}

export interface CreateContentItemVariables {
  categoryId: UUIDString;
  title: string;
  status: string;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface CreateUserVariables {
  email: string;
  displayName: string;
}

export interface GetProfileData {
  user?: {
    email: string;
    displayName?: string | null;
    profileSettingss_on_user: ({
      themePreference: string;
      notificationsEnabled: boolean;
    })[];
  };
}

export interface GetProfileVariables {
  id: UUIDString;
}

export interface ProfileSettings_Key {
  id: UUIDString;
  __typename?: 'ProfileSettings_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;
export function createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface GetProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProfileVariables): QueryRef<GetProfileData, GetProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetProfileVariables): QueryRef<GetProfileData, GetProfileVariables>;
  operationName: string;
}
export const getProfileRef: GetProfileRef;

export function getProfile(vars: GetProfileVariables, options?: ExecuteQueryOptions): QueryPromise<GetProfileData, GetProfileVariables>;
export function getProfile(dc: DataConnect, vars: GetProfileVariables, options?: ExecuteQueryOptions): QueryPromise<GetProfileData, GetProfileVariables>;

interface CreateCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
  operationName: string;
}
export const createCategoryRef: CreateCategoryRef;

export function createCategory(vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;
export function createCategory(dc: DataConnect, vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;

interface CreateContentItemRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateContentItemVariables): MutationRef<CreateContentItemData, CreateContentItemVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateContentItemVariables): MutationRef<CreateContentItemData, CreateContentItemVariables>;
  operationName: string;
}
export const createContentItemRef: CreateContentItemRef;

export function createContentItem(vars: CreateContentItemVariables): MutationPromise<CreateContentItemData, CreateContentItemVariables>;
export function createContentItem(dc: DataConnect, vars: CreateContentItemVariables): MutationPromise<CreateContentItemData, CreateContentItemVariables>;

