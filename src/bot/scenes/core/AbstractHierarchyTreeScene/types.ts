export type ObjectWithId<T = number> = {
  id: T;
};
export interface HierarchyTreeNodeBase<T extends object = any> {
  id: number;
  parentId?: number;
  data: T;
}

export type HierarchyTreeLeafNode<L extends object = any> =
  HierarchyTreeNodeBase<L> & {
    type: 'leaf';
  };

export type HierarchyTreeParentNode<P extends object = any> =
  HierarchyTreeNodeBase<P> & {
    type: 'parent';
  };

export type HierarchyTreeNode<P extends object = any, L extends object = any> =
  | HierarchyTreeParentNode<P>
  | HierarchyTreeLeafNode<L>;

export interface HierarchyTreeSceneState {
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
