import { CreateUserData, CreateUserVariables, GetProfileData, GetProfileVariables, CreateCategoryData, CreateCategoryVariables, CreateContentItemData, CreateContentItemVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;

export function useGetProfile(vars: GetProfileVariables, options?: useDataConnectQueryOptions<GetProfileData>): UseDataConnectQueryResult<GetProfileData, GetProfileVariables>;
export function useGetProfile(dc: DataConnect, vars: GetProfileVariables, options?: useDataConnectQueryOptions<GetProfileData>): UseDataConnectQueryResult<GetProfileData, GetProfileVariables>;

export function useCreateCategory(options?: useDataConnectMutationOptions<CreateCategoryData, FirebaseError, CreateCategoryVariables>): UseDataConnectMutationResult<CreateCategoryData, CreateCategoryVariables>;
export function useCreateCategory(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCategoryData, FirebaseError, CreateCategoryVariables>): UseDataConnectMutationResult<CreateCategoryData, CreateCategoryVariables>;

export function useCreateContentItem(options?: useDataConnectMutationOptions<CreateContentItemData, FirebaseError, CreateContentItemVariables>): UseDataConnectMutationResult<CreateContentItemData, CreateContentItemVariables>;
export function useCreateContentItem(dc: DataConnect, options?: useDataConnectMutationOptions<CreateContentItemData, FirebaseError, CreateContentItemVariables>): UseDataConnectMutationResult<CreateContentItemData, CreateContentItemVariables>;
