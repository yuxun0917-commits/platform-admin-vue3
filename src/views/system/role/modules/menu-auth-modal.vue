<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchMenuTree, fetchRoleAssignMenus, fetchRoleMenuIds } from '@/service/api';

defineOptions({
  name: 'MenuAuthModal'
});

interface Props {
  visible: boolean;
  roleId: number | null;
  roleName?: string;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const menuTree = ref<Api.Role.MenuTreeOption[]>([]);
const checkedKeys = ref<number[]>([]);
const expandedKeys = ref<number[]>([]);
const loading = ref(false);

/** 节点 id -> 父 id 映射（用于提交时补全祖先链） */
const parentMap = new Map<number, number | null>();
/** 所有叶子节点 id 集合（用于回显时过滤，避免父节点被整体勾选） */
const leafSet = new Set<number>();

function buildParentMap(nodes: Api.Role.MenuTreeOption[], parentId: number | null = null) {
  for (const n of nodes) {
    parentMap.set(n.id, parentId);
    if (n.children?.length) {
      buildParentMap(n.children, n.id);
    }
  }
}

function buildLeafSet(nodes: Api.Role.MenuTreeOption[]) {
  for (const n of nodes) {
    if (!n.children || n.children.length === 0) {
      leafSet.add(n.id);
    } else {
      buildLeafSet(n.children);
    }
  }
}

/** 把勾选的节点 id 向上补全所有祖先 id（含自身、含顶级），去重后返回 */
function collectWithAncestors(ids: number[]): number[] {
  const result = new Set<number>();
  for (const id of ids) {
    let cur: number | null | undefined = id;
    while (typeof cur === 'number') {
      result.add(cur);
      cur = parentMap.get(cur) ?? null;
    }
  }
  return Array.from(result);
}

interface TreeDataNode {
  key: number;
  title: string;
  children?: TreeDataNode[];
}

function mapMenu(nodes: Api.Role.MenuTreeOption[]): TreeDataNode[] {
  return nodes.map(n => ({
    key: n.id,
    title: n.menuName,
    children: n.children && n.children.length ? mapMenu(n.children) : undefined
  }));
}

const treeData = computed<TreeDataNode[]>(() => mapMenu(menuTree.value));

function collectKeys(nodes: Api.Role.MenuTreeOption[], acc: number[] = []) {
  for (const n of nodes) {
    acc.push(n.id);
    if (n.children && n.children.length) collectKeys(n.children, acc);
  }
  return acc;
}

async function loadData(roleId: number) {
  const [treeRes, idsRes] = await Promise.all([fetchMenuTree(), fetchRoleMenuIds(roleId)]);

  if (!treeRes.error && treeRes.data) {
    menuTree.value = treeRes.data;
    parentMap.clear();
    leafSet.clear();
    buildParentMap(treeRes.data);
    buildLeafSet(treeRes.data);
    expandedKeys.value = collectKeys(treeRes.data);
  }
  if (!idsRes.error && idsRes.data) {
    // 只把叶子节点设为勾选，父节点由组件根据子节点自动推导半选/全选，
    // 避免把祖先 id 直接塞进 checkedKeys 导致整棵子树被整体勾选。
    checkedKeys.value = idsRes.data.filter(id => leafSet.has(id));
  }
}

watch(
  () => props.visible,
  visible => {
    if (visible && props.roleId) {
      checkedKeys.value = [];
      menuTree.value = [];
      loadData(props.roleId);
    }
  }
);

function handleCheck(checked: any) {
  const keys = Array.isArray(checked) ? checked : checked.checked;
  checkedKeys.value = keys as number[];
}

function handleExpand(keys: any) {
  expandedKeys.value = keys as number[];
}

async function handleSubmit() {
  if (!props.roleId) return;
  loading.value = true;
  const { error } = await fetchRoleAssignMenus({
    roleId: props.roleId,
    menuIds: collectWithAncestors(checkedKeys.value)
  });
  loading.value = false;
  if (!error) {
    window.$message?.success('菜单分配成功');
    emit('submitted');
    emit('update:visible', false);
  }
}

function handleCancel() {
  emit('update:visible', false);
}
</script>

<template>
  <AModal
    :open="visible"
    title="分配权限"
    :confirm-loading="loading"
    width="520px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <p class="mb-8px text-14px">为角色「{{ roleName }}」分配可访问的权限：</p>
    <ATree
      v-if="treeData.length"
      :checked-keys="checkedKeys"
      :tree-data="treeData"
      :expanded-keys="expandedKeys"
      checkable
      :selectable="false"
      @check="handleCheck"
      @expand="handleExpand"
    />
    <ASpin v-else />
  </AModal>
</template>

<style scoped></style>
