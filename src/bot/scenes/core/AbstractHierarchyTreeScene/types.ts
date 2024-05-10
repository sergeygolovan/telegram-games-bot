export interface HierarchyTreeNode<T = any> {
  id: number;
  parentId?: number;
  children: T[];
}

export interface HierarchyTreeSceneState {
  parentNodeId?: number;
  currentNodeId?: number;
}
