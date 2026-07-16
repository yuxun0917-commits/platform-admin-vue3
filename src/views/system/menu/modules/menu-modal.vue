<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import { fetchMenuAdd, fetchMenuEdit } from '@/service/api';
import SvgIcon from '@/components/custom/svg-icon.vue';
import IconPickerModal from './icon-picker-modal.vue';

defineOptions({
  name: 'MenuModal'
});

interface Props {
  visible: boolean;
  type: 'add' | 'edit';
  row?: Api.Menu.MenuVO | null;
  /** 完整菜单树，用于上级菜单选择 */
  tree?: Api.Menu.MenuVO[];
  /** 新增时的默认父级（新增子项时传入） */
  defaultParentId?: number;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const title = computed(() => (props.type === 'add' ? '新增菜单' : '编辑菜单'));

const formRef = ref<FormInstance>();
const formModel = reactive({
  parentId: 0,
  menuType: 1 as Api.Menu.MenuType,
  menuName: '',
  path: '',
  component: '',
  perms: '',
  icon: '',
  redirect: '',
  displayOrder: 1,
  /** 显示（isHidden=0） */
  showHidden: true,
  /** 缓存（isCache=1） */
  cache: false,
  /** 外链（isExternal=1） */
  external: false,
  /** 正常（status=1） */
  statusNormal: true
});

const loading = ref(false);

const menuTypeOptions = [
  { value: 1, label: '目录' },
  { value: 2, label: '菜单' },
  { value: 3, label: '按钮' }
];

/** 上级菜单树（编辑时排除自身及其子孙，避免环） */
const parentTreeData = computed(() => {
  const excludeId = props.type === 'edit' && props.row ? props.row.id : -1;
  const map = (nodes: Api.Menu.MenuVO[]): any[] =>
    nodes
      .filter(n => n.id !== excludeId)
      .map(n => ({
        value: n.id,
        title: n.menuName,
        children: map(n.children || [])
      }));
  return [
    {
      value: 0,
      title: '根目录',
      children: map(props.tree || [])
    }
  ];
});

function resetForm() {
  formModel.parentId = props.defaultParentId ?? 0;
  formModel.menuType = 1;
  formModel.menuName = '';
  formModel.path = '';
  formModel.component = '';
  formModel.perms = '';
  formModel.icon = '';
  formModel.redirect = '';
  formModel.displayOrder = 1;
  formModel.showHidden = true;
  formModel.cache = false;
  formModel.external = false;
  formModel.statusNormal = true;
  formRef.value?.resetFields();
}

function setFormFromRow() {
  const row = props.row;
  if (!row) return;
  formModel.parentId = row.parentId;
  formModel.menuType = row.menuType;
  formModel.menuName = row.menuName;
  formModel.path = row.path || '';
  formModel.component = row.component || '';
  formModel.perms = row.perms || '';
  formModel.icon = row.icon || '';
  formModel.redirect = row.redirect || '';
  formModel.displayOrder = row.displayOrder ?? 1;
  formModel.showHidden = row.isHidden === 0;
  formModel.cache = row.isCache === 1;
  formModel.external = row.isExternal === 1;
  formModel.statusNormal = row.status === 1;
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      resetForm();
      if (props.type === 'edit' && props.row) {
        setFormFromRow();
      }
    }
  }
);

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  const base = {
    parentId: formModel.parentId,
    menuName: formModel.menuName.trim(),
    menuType: formModel.menuType,
    path: formModel.path.trim(),
    component: formModel.component.trim() || undefined,
    redirect: formModel.redirect.trim() || undefined,
    icon: formModel.icon.trim() || undefined,
    perms: formModel.perms.trim() || undefined,
    displayOrder: formModel.displayOrder,
    isHidden: formModel.showHidden ? 0 : 1,
    isCache: formModel.cache ? 1 : 0,
    isExternal: formModel.external ? 1 : 0,
    status: formModel.statusNormal ? 1 : 0
  };

  if (props.type === 'add') {
    const { error } = await fetchMenuAdd(base as Api.Menu.MenuSaveVO);
    if (!error) {
      window.$message?.success('新增成功');
      emit('submitted');
      emit('update:visible', false);
    }
  } else {
    const payload = { ...base, id: props.row?.id } as Api.Menu.MenuEditVO;
    const { error } = await fetchMenuEdit(payload);
    if (!error) {
      window.$message?.success('编辑成功');
      emit('submitted');
      emit('update:visible', false);
    }
  }

  loading.value = false;
}

function handleCancel() {
  emit('update:visible', false);
}

/** 图标选择器 */
const showIconPicker = ref(false);

function openIconPicker() {
  showIconPicker.value = true;
}

function handleIconPicked(iconName: string) {
  formModel.icon = iconName;
  showIconPicker.value = false;
}

function clearIcon() {
  formModel.icon = '';
}
</script>

<template>
  <AModal
    :open="visible"
    :title="title"
    :confirm-loading="loading"
    width="820px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <AForm ref="formRef" :model="formModel" :label-col="{ span: 7 }" :wrapper-col="{ span: 17 }">
      <ARow :gutter="16">
        <ACol :span="12">
          <AFormItem label="上级菜单" name="parentId">
            <ATreeSelect
              v-model:value="formModel.parentId"
              :tree-data="parentTreeData"
              :tree-default-expand-all="true"
              placeholder="请选择上级菜单"
              allow-clear
            />
          </AFormItem>
        </ACol>
        <ACol :span="12">
          <AFormItem label="菜单类型" name="menuType" :rules="[{ required: true, message: '请选择菜单类型' }]">
            <ASelect v-model:value="formModel.menuType" :options="menuTypeOptions" placeholder="请选择菜单类型" />
          </AFormItem>
        </ACol>
        <ACol :span="12">
          <AFormItem label="菜单名称" name="menuName" :rules="[{ required: true, message: '请输入菜单名称' }]">
            <AInput v-model:value="formModel.menuName" placeholder="请输入菜单名称" />
          </AFormItem>
        </ACol>
        <ACol :span="12">
          <AFormItem label="路由地址" name="path">
            <AInput v-model:value="formModel.path" placeholder="如 user（相对父级）" />
          </AFormItem>
        </ACol>
        <ACol :span="12">
          <AFormItem label="组件路径" name="component">
            <AInput v-model:value="formModel.component" placeholder="如 system/user/index" />
          </AFormItem>
        </ACol>
        <ACol :span="12">
          <AFormItem label="权限标识" name="perms">
            <AInput v-model:value="formModel.perms" placeholder="如 system:menu:list" />
          </AFormItem>
        </ACol>
        <ACol :span="12">
          <AFormItem label="菜单图标" name="icon">
            <div class="flex items-center gap-8px">
              <AInput v-model:value="formModel.icon" placeholder="ant-design:user-outlined" class="flex-1" />
              <AButton @click="openIconPicker">选择</AButton>
            </div>
            <div class="mt-8px flex items-center gap-8px">
              <SvgIcon v-if="formModel.icon" :icon="formModel.icon" style="font-size: 18px" />
              <span class="text-12px text-gray-400">{{ formModel.icon || '未设置图标' }}</span>
              <AButton v-if="formModel.icon" type="link" size="small" @click="clearIcon">清除</AButton>
            </div>
          </AFormItem>
        </ACol>
        <ACol :span="12">
          <AFormItem label="重定向" name="redirect">
            <AInput v-model:value="formModel.redirect" placeholder="目录跳转地址，如 user" />
          </AFormItem>
        </ACol>
        <ACol :span="12">
          <AFormItem label="显示排序" name="displayOrder">
            <AInputNumber v-model:value="formModel.displayOrder" :min="0" class="w-full" />
          </AFormItem>
        </ACol>
        <ACol :span="12">
          <AFormItem label="是否显示">
            <ASwitch v-model:checked="formModel.showHidden" checked-children="显示" un-checked-children="隐藏" />
          </AFormItem>
        </ACol>
        <ACol :span="12">
          <AFormItem label="是否缓存">
            <ASwitch v-model:checked="formModel.cache" checked-children="缓存" un-checked-children="不缓存" />
          </AFormItem>
        </ACol>
        <ACol :span="12">
          <AFormItem label="是否外链">
            <ASwitch v-model:checked="formModel.external" checked-children="外链" un-checked-children="内部" />
          </AFormItem>
        </ACol>
        <ACol :span="12">
          <AFormItem label="状态">
            <ASwitch v-model:checked="formModel.statusNormal" checked-children="正常" un-checked-children="禁用" />
          </AFormItem>
        </ACol>
      </ARow>
    </AForm>

    <IconPickerModal :visible="showIconPicker" @select="handleIconPicked" @cancel="showIconPicker = false" />
  </AModal>
</template>

<style scoped></style>
