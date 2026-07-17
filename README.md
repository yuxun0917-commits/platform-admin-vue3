<div align="center">
  <img src="./public/favicon.svg" width="160" />
  <h1>platform-admin-vue3</h1>
  <span>平台管理后台前端 · 基于 SoybeanAdmin Antd 脚手架改造</span>
</div>

---

> 本仓库是 **platform 脚手架** 的管理后台前端，在 SoybeanAdmin（Vue3 + Vite + ant-design-vue）基础上，按后端 `platform-parent` 的真实接口契约进行了深度适配：后端驱动菜单路由、统一 `Result<T>` 响应解包、验证码登录、以及用户/角色/菜单/部门/岗位/字典/通知/日志/定时任务/服务监控等业务模块。

## 技术栈

- **Vue 3.5** + **Vite 7** + **TypeScript**
- **ant-design-vue 4.2.6**
- **Pinia** 状态管理
- **UnoCSS** 原子化样式
- **@elegant-router** 自动文件路由（路由导入、声明、类型自动生成）
- **@sa/axios** 统一请求层（扁平 `Result` 解包、`code`/`msg`/`data` 契约对齐）
- `@iconify/vue` 运行时在线拉取图标（任意 iconify 集合：`ep:` / `ant-design:` / `mdi:` …）
- pnpm monorepo（`packages/*` 为 `@sa/*` 内部包）

## 环境要求

- **git**：克隆与管理版本
- **NodeJS**：>= 20.19.0（开发环境使用 22.x）
- **pnpm**：>= 10.5.0

> 本项目采用 pnpm monorepo，请勿使用 npm / yarn 安装依赖。

## 安装与启动

```bash
# 安装依赖（使用绝对路径 pnpm 以规避全局 shim 问题）
node "D:/Program Files/nodejs/node_global/node_modules/pnpm/bin/pnpm.cjs" install

# 开发模式（对齐后端 test 环境，默认走 .env）
pnpm dev
```

> 本机 dev 约定端口为 **8848**。注意：`pnpm dev --port 8848` 在 pnpm 11 下不会把 `--port` 透传给 Vite，需以后台常驻方式启动：
>
> ```bash
> BROWSER=none node node_modules/vite/bin/vite.js --mode test --port 8848 --host 0.0.0.0
> ```
>
> `vite.config.ts` 内置端口为 `9527`，实际端口以启动命令为准。

构建：

```bash
pnpm build          # 生产构建（--mode prod）
pnpm build:test     # 测试环境构建（--mode test）
```

## 后端契约对齐（重要）

前端 `src/service/request` 已对齐后端 `Result<T> = { code, msg, data }` 规范：

| 项 | 约定 |
| --- | --- |
| 成功码 | `code === 200`（`VITE_SERVICE_SUCCESS_CODE`） |
| 未登录/过期 | `code === 10003`（`VITE_SERVICE_LOGOUT_CODES`） |
| 业务数据 | 请求直接返回 `data` 内容，调用形如 `const { data } = await fetchXxx()` |
| 错误信息 | `onError` 取 `response.data.msg` |

> 前端通过 `VITE_SERVICE_BASE_URL`（`.env` / `.env.test` / `.env.prod`）直连后端 `http://localhost:8080`，**未走 Vite proxy**（`VITE_HTTP_PROXY=N`）。若遇跨域需后端开启 CORS。

### 登录与验证码

- `GET /captcha/get` → 图形验证码（`captchaKey` + `base64Image`）
- `POST /auth/login` → 入参 `{ username, password, captchaKey, captchaCode }`，成功返回**单个 token 字符串**（非对象）
- 登录页 `pwd-login.vue` 已集成图形验证码输入与刷新

### 菜单路由（后端驱动）

- `GET /user/info` 返回菜单树，登录成功后由 `src/store/modules/route/backend-menu.ts` 注册路由并渲染侧边栏
- 菜单字段：`menuType`(1目录/2菜单/3按钮)、`component`(相对 `src/views`，如 `system/user/index`)、`icon`(iconify 名)、`isHidden`、`isCache`、`isExternal` 等
- `VITE_AUTH_ROUTE_MODE=static`：保留首页与演示路由，业务路由由后端菜单覆盖

### 权限门控约定

- 新增功能默认**不加 `hasAuth` 权限判断**，对所有登录用户可见；后续统一加权限时，记得把 `system:*menu*:sort` / `system:*role*:sort` 等缺失的码补回门控

### 拖拽排序

- 表格行拖拽使用 **SortableJS**（基于 pointer 事件），**不使用** HTML5 `draggable` / `customRow`
- 拖拽结束后重新调用接口按 `displayOrder` 排序并重新渲染

## 目录结构（业务视图）

```
src/views/
├── _builtin/         # 登录、coming-soon 等内建页
├── home/             # 首页
├── system/           # 系统管理
│   ├── user/         # 用户管理
│   ├── role/         # 角色管理（含菜单权限分配）
│   ├── menu/         # 菜单管理（拖拽排序 + 图标选择）
│   ├── dept/         # 部门管理
│   ├── post/         # 岗位管理
│   ├── dict/         # 字典管理
│   ├── notice/       # 通知公告
│   └── config/       # 参数配置
├── log/              # 日志
│   ├── loginlog/     # 登录日志
│   └── operlog/      # 操作日志
└── monitor/          # 服务监控
    ├── job/          # 定时任务（任务日志抽屉）
    └── server/       # 服务器监控仪表盘（10s 自动刷新）
```

## 图标方案

项目未安装 `@ant-design/icons-vue`，统一通过 `@iconify/vue` 运行时在线拉取：

- 菜单 `icon` 字段当前为 `ep:` 前缀（Element 风格）
- 如需 ant-design 风格，将 icon 改为 `ant-design:xxx`，或在 `src/store/modules/route/backend-menu.ts` 增加 `ep: → ant-design:` 映射

## 脚本命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 开发模式（test 环境） |
| `pnpm build` | 生产构建 |
| `pnpm build:test` | 测试环境构建 |
| `pnpm lint` | eslint 修复（`eslint . --fix`） |
| `pnpm typecheck` | 类型检查（`vue-tsc --noEmit --skipLibCheck`） |
| `pnpm commit` | 规范提交（`sa git-commit`） |
| `pnpm gen-route` | 重新生成路由（elegant-router） |

> **提交注意**：pre-commit 钩子会跑 `typecheck` + `lint-staged`（eslint --fix）。
> - `prettier-plugin-json-sort` 已在 `devDependencies` 显式声明，确保 pnpm 上提插件到顶层 `node_modules`
> - `Api` 是 `src/typings/api.d.ts` 中的 ambient 全局命名空间（`declare namespace Api`），**不要** `import` 它；`src/typings/api/*.d.ts` 子文件也**不要**写顶层 `import`，否则会变成模块导致命名空间不合并
> - 修复 lint/type 错误后务必 `git add` 暂存，否则 IDE 提交前 stash 会跑旧代码

## 提交规范

使用内置命令生成符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范的提交信息：

```bash
pnpm commit
```

## 浏览器支持

推荐使用最新版 Chrome 进行开发。

| IE | Edge | Firefox | Chrome | Safari |
| --- | --- | --- | --- | --- |
| 不支持 | 最近 2 个版本 | 最近 2 个版本 | 最近 2 个版本 | 最近 2 个版本 |

---

> 本仓库基于 [SoybeanAdmin Antd](https://github.com/soybeanjs/soybean-admin-antd) 脚手架二次开发，适配自研 platform 后端。
