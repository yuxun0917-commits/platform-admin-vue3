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

interface TreeDataNode {
  key: number;
  title: string;
  disableCheckbox?: boolean;
  children?: TreeDataNode[];
}

function mapMenu(nodes: Api.Role.MenuTreeOption[]): TreeDataNode[] {
  return nodes.map(n => ({
    key: n.id,
    title: n.menuName,
    disableCheckbox: n.menuType === 3,
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
    expandedKeys.value = collectKeys(treeRes.data);
  }
  if (!idsRes.error && idsRes.data) {
    checkedKeys.value = idsRes.data;
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

async function handleSubmit() {
  if (!props.roleId) return;
  loading.value = true;
  const { error } = await fetchRoleAssignMenus({
    roleId: props.roleId,
    menuIds: checkedKeys.value
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
    title="分配菜单"
    :confirm-loading="loading"
    width="520px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <p class="mb-8px text-14px">为角色「{{ roleName }}」分配可访问的菜单：</p>
    <ATree
      v-if="treeData.length"
      :checked-keys="checkedKeys"
      :tree-data="treeData"
      :expanded-keys="expandedKeys"
      checkable
      :selectable="false"
      @check="handleCheck"
    />
    <ASpin v-else />
  </AModal>
</template>

<style scoped></style>
