<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import { fetchMenuAdd, fetchMenuEdit, fetchMenuView } from '@/service/api';
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

/** 当前菜单类型是否对应各字段的展示开关（不同类型填写字段不同） */
const isDir = computed(() => formModel.menuType === 1);
const isMenu = computed(() => formModel.menuType === 2);
const isBtn = computed(() => formModel.menuType === 3);
const showPath = computed(() => isDir.value || isMenu.value);
const showIcon = computed(() => isDir.value || isMenu.value);
const showRedirect = computed(() => isDir.value);
const showComponent = computed(() => isMenu.value);
const showPerms = computed(() => isMenu.value || isBtn.value);
const showVisible = computed(() => isDir.value || isMenu.value);
const showCache = computed(() => isMenu.value);
const showExternal = computed(() => isDir.value || isMenu.value);

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

const viewLoading = ref(false);

async function loadMenuView() {
  if (!props.row?.id) return;
  viewLoading.value = true;
  const { error, data } = await fetchMenuView(props.row.id);
  viewLoading.value = false;
  if (!error && data) {
    formModel.parentId = data.parentId;
    formModel.menuType = data.menuType;
    formModel.menuName = data.menuName;
    formModel.path = data.path || '';
    formModel.component = data.component || '';
    formModel.perms = data.perms || '';
    formModel.icon = data.icon || '';
    formModel.redirect = data.redirect || '';
    formModel.displayOrder = data.displayOrder ?? 1;
    formModel.showHidden = data.isHidden === 0;
    formModel.cache = data.isCache === 1;
    formModel.external = data.isExternal === 1;
    formModel.statusNormal = data.status === 1;
  }
}

watch(
  () => props.visible,
  visible => {
    if (visible) {
      resetForm();
      if (props.type === 'edit' && props.row) {
        loadMenuView();
      }
    }
  }
);

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  const mType = formModel.menuType;
  const base: Record<string, unknown> = {
    parentId: formModel.parentId,
    menuName: formModel.menuName.trim(),
    menuType: mType,
    displayOrder: formModel.displayOrder,
    status: formModel.statusNormal ? 1 : 0
  };

  if (mType === 3) {
    // 按钮：仅权限标识，其余目录/菜单专属字段不传（给后端默认值）
    base.path = '';
    base.isHidden = 0;
    base.isCache = 0;
    base.isExternal = 0;
    base.perms = formModel.perms.trim() || undefined;
  } else {
    // 目录 / 菜单：路由地址必填
    base.path = formModel.path.trim();
    base.isHidden = formModel.showHidden ? 0 : 1;
    base.isExternal = formModel.external ? 1 : 0;
    base.icon = formModel.icon.trim() || undefined;
    base.perms = formModel.perms.trim() || undefined;
    if (mType === 1) {
      // 目录：无组件、无缓存
      base.isCache = 0;
      base.redirect = formModel.redirect.trim() || undefined;
    } else {
      // 菜单
      base.isCache = formModel.cache ? 1 : 0;
      base.component = formModel.component.trim() || undefined;
    }
  }

  if (props.type === 'add') {
    const { error } = await fetchMenuAdd(base as unknown as Api.Menu.MenuSaveVO);
    if (!error) {
      window.$message?.success('新增成功');
      emit('submitted');
      emit('update:visible', false);
    }
  } else {
    const payload = { ...base, id: props.row?.id } as unknown as Api.Menu.MenuEditVO;
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
    <ASpin :spinning="viewLoading">
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
          <ACol v-if="showPath" :span="12">
            <AFormItem label="路由地址" name="path" :rules="[{ required: true, message: '请输入路由地址' }]">
              <AInput v-model:value="formModel.path" placeholder="如 user（相对父级）" />
            </AFormItem>
          </ACol>
          <ACol v-if="showComponent" :span="12">
            <AFormItem label="组件路径" name="component">
              <AInput v-model:value="formModel.component" placeholder="如 system/user/index" />
            </AFormItem>
          </ACol>
          <ACol v-if="showPerms" :span="12">
            <AFormItem
              label="权限标识"
              name="perms"
              :rules="isBtn ? [{ required: true, message: '请输入权限标识' }] : []"
            >
              <AInput v-model:value="formModel.perms" placeholder="如 system:menu:list" />
            </AFormItem>
          </ACol>
          <ACol v-if="showIcon" :span="12">
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
          <ACol v-if="showRedirect" :span="12">
            <AFormItem label="重定向" name="redirect">
              <AInput v-model:value="formModel.redirect" placeholder="目录跳转地址，如 user" />
            </AFormItem>
          </ACol>
          <ACol :span="12">
            <AFormItem label="显示排序" name="displayOrder">
              <AInputNumber v-model:value="formModel.displayOrder" :min="0" class="w-full" />
            </AFormItem>
          </ACol>
          <ACol v-if="showVisible" :span="12">
            <AFormItem label="是否显示">
              <ASwitch v-model:checked="formModel.showHidden" checked-children="显示" un-checked-children="隐藏" />
            </AFormItem>
          </ACol>
          <ACol v-if="showCache" :span="12">
            <AFormItem label="是否缓存">
              <ASwitch v-model:checked="formModel.cache" checked-children="缓存" un-checked-children="不缓存" />
            </AFormItem>
          </ACol>
          <ACol v-if="showExternal" :span="12">
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
    </ASpin>

    <IconPickerModal :visible="showIconPicker" @select="handleIconPicked" @cancel="showIconPicker = false" />
  </AModal>
</template>

<style scoped></style>
