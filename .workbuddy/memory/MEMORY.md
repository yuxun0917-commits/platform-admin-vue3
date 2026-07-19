# 项目长期笔记：platform-admin-vue3

## 启动方式（重要）
- 本机 dev 端口约定 8848。
- 不要依赖 `pnpm dev -- --port 8848`：pnpm 11 未把 `--port` 透传给 vite，vite 会回退到 vite.config 里的 9527。
- 正确启动（根目录，后台常驻）：
  `BROWSER=none node node_modules/vite/bin/vite.js --mode test --port 8848 --host 0.0.0.0`
- pnpm 全局 shim 损坏，安装/命令统一用绝对路径：
  `node "D:/Program Files/nodejs/node_global/node_modules/pnpm/bin/pnpm.cjs" install`

## 依赖注意
- `build/plugins/unocss.ts` 直接值导入 `@iconify/utils`，已在根 package.json devDependencies 显式声明 `"@iconify/utils": "3.1.4"`。勿删除该行，否则 vite.config 加载报 ERR_MODULE_NOT_FOUND。
- 项目原本无 pnpm-lock.yaml，首次 `pnpm install` 由 pnpm 自动生成。

## 图标方案（重要）
- 项目**未安装** `@ant-design/icons-vue`，也**未安装任何本地 `@iconify-json/*` 集合**（`node_modules/@iconify-json/` 为空）。
- 图标走 **iconify 聚合 + `@iconify/vue` 运行时在线拉取**：`useSvgIcon()`→`useSvgIconRender(SvgIcon)`→`SvgIconVNode({icon})`（`src/hooks/common/icon.ts`）。传入的字符串即 iconify 全名，任意集合（`ep:`、`ant-design:`、`mdi:`…）都能现拉现用。
- **当前后端 `sys_menu.icon` 字段全部是 `ep:xxx` 前缀（Element Plus 图标）**，故侧边栏渲染出的是 Element 风格图标（非 antd）。要切到 ant-design 风格，需把 icon 改为 `ant-design:xxx`（改后端库 or 前端 `backend-menu.ts` 加 `ep:→ant-design:` 映射）。
- 新增/编辑菜单弹窗里的图标输入框接受 iconify 全名（如 `ant-design:user-outlined`）。菜单弹窗 placeholder 旧示例为 `ep:tools`，可按需改为 `ant-design:` 系列。

## 后台接口响应规范（Result）对齐
- 后台统一响应 `Result<T>`: `{ code: Integer, msg: String, data: T }`。成功码 `ErrorCode.SUCCESS = 200`；未登录/过期 `ErrorCode.UNAUTHORIZED = 10003`；无权限 `10004`；通用失败 `500`。
- 前端 `@sa/axios` 主 `request`（src/service/request/index.ts）已按此解包：`isBackendSuccess` 比对 `response.data.code === VITE_SERVICE_SUCCESS_CODE`；`transformBackendResponse` 返回 `response.data.data`；`onError` 取 `response.data.msg`。结构与后台一致。
- 已对齐（根 `.env`）：`VITE_SERVICE_SUCCESS_CODE=200`、`VITE_SERVICE_LOGOUT_CODES=10003`，modal/expired 码清空（后台 ErrorCode 无对应）。`.env.prod` 未覆盖，随 `.env`。
- 类型 `App.Service.Response.code` 已改为 `number`（匹配后台 Integer）。
- 业务 API 调用用 `request<T>()` 直接取 `data` 内容，不要用 `Response<>` 包裹。
- 注意：`.env.test`/`.env.prod` 的 `VITE_SERVICE_BASE_URL` 已改为 `http://localhost:8080`（真实后台 platform-parent）。直连绝对地址，未走 Vite proxy（`VITE_HTTP_PROXY` 未开），若遇跨域需后台开 CORS。后端/Mock 必须返回 `{code:200, msg, data}` 结构。
- 后台 API 规范（见 platform-scaffold-dev skill）：仅 POST/GET；POST 改数据、GET 查询走问号传参（不加 @RequestParam）；Controller 统一返回裸 `Result`（不带泛型）。

## 登录 / 验证码契约（重要，前端已对齐）
- `GET /captcha/get` → `Result<CaptchaVO>`，`data`: `{ captchaKey: string, base64Image: string }`。`base64Image` 可直接给 `<img src>`。
- `POST /auth/login` 入参 `LoginVO`：`{ username, password, captchaKey, captchaCode }`（全部 @NotBlank，**验证码必填**）；后端先校验图形验证码再校验账号密码，成功返回 `Result.success(StpUtil.getTokenValue())`——即**单个 token 字符串**，不是 `{token,refreshToken}`。
- 前端已对齐：
  - `Api.Auth.LoginToken` 改为 `type LoginToken = string`（匹配后台单 token 返回）；`loginByToken` 仅 `localStg.set('token', loginToken)`，不再存 refreshToken（后台无 refresh 接口，`VITE_SERVICE_EXPIRED_TOKEN_CODES` 已清空，刷新流程不触发）。
  - `fetchLogin(userName, password, captchaKey, captchaCode)` 请求体字段用 `username`（非 `userName`，匹配 `LoginVO`）。
  - `authStore` 新增 `captchaKey/captchaImage` 状态与 `getCaptcha()`；`login()` 增加 `captchaKey?/captchaCode?` 参数（pwd-login 必传，toggle-auth 演示页不传）。
  - `pwd-login.vue` 已加图形验证码图片+输入框：挂载/点击刷新拉取 `/captcha/get`，提交时带 `authStore.captchaKey` 与用户输入的 `captchaCode`。
- `components.d.ts` 第 148 行 `IconIc:roundPlus` 是 volar 自动生成文件的已知预存错误（icon 名含冒号），与业务无关；`vue-tsc` 仅报此一处，本次改动文件均无类型错误。

## 菜单渲染（后端驱动，2026-07-15 实现）
- 登录成功后从 `GET /user/info` 拉取菜单树并渲染侧边栏（覆盖 Soybean 静态/动态路由菜单）。
- 后端 `MenuTreeVO` 约定：`menuType`(1目录/2菜单/3按钮)、`path`(相对父级)、`component`(相对 `src/views`，如 `system/user/index`，兼容带/不带 `/index`)、`redirect`(相对父级)、`icon`(iconify 名如 `ep:user`)、`isHidden`(0/1)、`isCache`(1/0)、`isExternal`(1/0)。
- 前端映射（`src/store/modules/route/backend-menu.ts`）：目录→`layout.base` 父路由；菜单→`import.meta.glob('@/views/**/*.vue')` 解析 component，找不到则回退 `src/views/_builtin/coming-soon/index.vue` 占位页；按钮/`isHidden=1` 跳过。route name 由全路径推导（`/system/user`→`system_user`），与菜单 `key`/`routeKey` 一致。
- `authStore.userMenus` 存原始菜单树；`routeStore.initBackendMenu()` 在 `initAuthRoute()` 内（static/dynamic 分支之后）调用，注册路由并覆盖 `menus.value`。
- 注意：后端菜单 component 指向的 `src/views/system/...` 等页面当前 scaffold 尚未开发，点击会显示“页面建设中”占位页，补齐前端视图即可正常加载。`VITE_AUTH_ROUTE_MODE` 仍 `static`（保留 home/演示路由）。

## 权限门控约定（2026-07-16 用户明确，2026-07-19 修订）
- **新增功能先不加 `hasAuth` 权限判断**，功能直接对所有登录用户可见；用户后续会统一要求加权限。
- 背景：后端 `/user/info` 给 admin 返回的权限**没有 `system:menu:sort` / `system:dept:sort` / `system:role:sort` / `system:post:sort` 这几个码**（但有 add/edit/delete/editStatus），拖拽排序列对 admin 也不可见（符合预期）。
- **排序权限最终门控（2026-07-19）**：菜单/角色/部门/岗位四个模块的拖拽排序，现在**完整由 `hasAuth('system:*xx*:sort')` 控制**——有码 → 显示拖拽列 + 可拖拽；无码 → 拖拽列不占位、整行不可拖拽（即"列表不要占位、也不能拖拽"）。实现：
  - `columns` 计算属性里 `drag` 列用 `...(hasAuth('...:sort') ? [拖拽列] : [])` 条件加入（无码不渲染列、不占宽）；
  - `watch(tableData/expandedKeys)` 回调里 `if (hasAuth('...:sort')) nextTick(initSortable) else nextTick(destroySortable)`（无码不初始化 Sortable、销毁已有实例）；
  - 菜单/部门树形表格 `:expand-icon-column-index` 改为 `hasAuth('...:sort') ? 1 : 0`（拖拽列在→箭头 index1=名称列；缺失→回退 index0=名称列，箭头始终在名称列）；
  - 菜单整行 `cursor: grab` 改为 `.menu-drag-wrap.can-drag :deep(...)`，wrap 加 `:class="{'can-drag': hasAuth('system:menu:sort')}"`；角色/部门/岗位手柄 grab 光标本就只在 `v-if` 门控手柄上，无需改。

## 拖拽排序实现要点（菜单/角色，2026-07-16 定稿 = SortableJS）
- **结论：antd-vue 表格行拖拽用 `sortablejs`（基于 pointer 事件），不要用 HTML5 `draggable`/`customRow`。** 本机已 `pnpm add sortablejs`（依赖已登记 package.json）。
- 失败教训（已验证）：① `customRow` 给整行 `<tr>` 设 `draggable`；② 手柄 `draggable + 容器 @drop` 委托——在 antd-vue 4.2.6 树形/普通表格下**都拖不动**（用户多次反馈"不能拖拽排序"）。Playwright 合成的 DragEvent 会**假阳性**通过，必须用真实鼠标（`page.mouse.down/move/up`）才能验出失败。
- 正确做法（menu + role 已落地，真实浏览器验证通过）：
  1. `import Sortable from 'sortablejs'`；外层 `<div ref="tableWrapRef">` 包住 `<ATable>`。
  2. `initSortable()` 从 `tableWrapRef.value.querySelector('.ant-table-tbody')` 取真实 tbody（**不能**在 `<ATable>` 上直接 `ref`，那拿到的是组件实例而非 tbody），`new Sortable(tbody, {...})`。
  3. 配置：`filter: '.ant-btn, .ant-switch, .ant-table-row-expand-icon, input, a'` + `preventOnFilter:false` → **整行可拖**，按钮/开关/展开箭头除外；`animation:150`；`ghostClass/chosenClass/dragClass` 配 `<style scoped> :deep(...)` 高亮。
  4. `onMove(evt)` 用 `data-row-key` 取 `findNode` 比对 `parentId` 实现**同级约束**（菜单）；返回 `false` 阻止跨级。
  5. `onEnd(evt)`：`oldIndex===newIndex` 视为未移动（跨级被拦或原地点击）；否则按 DOM 顺序重排 `tableData` 并调 `fetchMenuSort({parentId, ids})` / `fetchRoleSort({startOrder, ids})`，成功后 `getData()` 同步后端顺序。
  6. `watch(tableData/expandedKeys, () => { if (hasAuth('...:sort')) nextTick(initSortable) else nextTick(destroySortable) })` 在 DOM 更新后按需重建/销毁实例（tbody 会被 Vue 重建；无排序权限时彻底不拖拽）。
- 菜单跨级拦截提示：用普通变量 `dragTargetParentId` 在 `onMove` 里记录目标 parentId，`onEnd` 位置未变且 `dragTargetParentId !== dragged.parentId` 时 `message.warning('仅支持同级菜单排序')`（`onEnd.evt.related` 在完全拦截时为 null，不可靠，故用 onMove 记录）。
- 菜单/部门「拖拽」列 `:expand-icon-column-index="hasAuth('...:sort') ? 1 : 0"`：拖拽列存在→箭头 index1（菜单名称列）、列缺失→回退 index0（仍菜单名称列），箭头始终落在名称列；拖拽列（第0列）存在时显示在最左。

## 脚手架品牌名（2026-07-20 用户拍板）
- 中文：**星河 Admin**；英文：**Galaxy Admin**。
- 展示层落地：`src/locales/langs/zh-cn.ts` / `en-us.ts` 的 `system.title`（侧边栏 Logo + 登录页共用，跟随语言切换）；`about.introduction` 模板介绍；`src/layouts/modules/theme-drawer/modules/page-fun.vue` 水印占位；`.env` 的 `VITE_APP_TITLE` / `VITE_APP_DESC`。
- 未动：`package.json` 的 `name: "soybean-admin-antd"`（改名需同步 workspace `link:` 引用，风险高）；`SystemLogo` SVG 图形字母；`CHANGELOG.md`/`LICENSE`/`@soybeanjs/*` 依赖（第三方/历史）。
