import { PaginationSceneState } from '../AbstractPaginatedListScene';

export type ObjectWithId<T = number> = {
  id: T;
};

export type ObjectWithReplyData<T = number> = ObjectWithId<T> & {
  image?: string;
  description: string;
};

export interface FolderTreeNodeBase<T extends object = any> {
  id: number;
  parentId?: number;
  data: T;
}

export type FolderTreeLeafNode<L extends object = any> =
  FolderTreeNodeBase<L> & {
    type: 'leaf';
  };

export type FolderTreeParentNode<P extends object = any> =
  FolderTreeNodeBase<P> & {
    type: 'parent';
  };

export type FolderTreeNode<P extends object = any, L extends object = any> =
  | FolderTreeParentNode<P>
  | FolderTreeLeafNode<L>;

export interface FolderTreeSceneState extends PaginationSceneState {
  parentNodeId: number | null;
  nodeId: number | null;
}

export type HierDatasetStructure<
  P extends object = any,
  L extends object = any,
> = {
  parents: P[];
  leafs: L[];
};
