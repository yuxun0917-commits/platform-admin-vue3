---
name: platform-dev-playbook
description: Personal development playbook / habits for the platform-admin-vue3 frontend. Use it alongside platform-scaffold-conventions and platform-scaffold-ui when actually building or modifying a business module here. It captures the hard-won, repeated patterns: probe the backend contract with a real logged-in browser before coding; treat displayOrder as the single source of truth for ordering (sort after fetch AND after every write/drag); do table row drag-sort with SortableJS (NOT HTML5 draggable/customRow); unwrap @sa/axios flat responses with `const { data } = await fetchXxx()`; keep the view directory aligned to the backend menu `component` segment; verify every change in a real browser via Playwright (admin / Yx20011102! / captcha YXLB / button "确 认"); and — critically — survive the pre-commit lint/typecheck gauntlet (pnpm typecheck + lint-staged = vue-tsc then eslint --fix). Trigger when starting a new module, adding a drag-sort table, debugging "data not showing" / "drag doesn't work" / "table looks ugly", fixing eslint/vue-tsc errors blocking commit, or before committing.
agent_created: true
---

# Platform Frontend Development Playbook (个人开发习惯/模式)

This is the *how I actually build here* companion to the scaffold-reference skills. The conventions skill tells you the stack and API contract; this skill tells you the recurring habits and pitfalls discovered across real sessions. Read it before starting a module and before debugging.

## Overall Development Loop (总体习惯)
1. **Probe the contract** with a real logged-in browser (never guess field names).
2. **Build types + service API** from the probed shape.
3. **Build the view** (list page / dashboard / drawer) following the scaffold UI skeleton.
4. **Verify in a real browser** (Playwright + system Chrome).
5. **Polish** (alignment, consistent centering, dark-theme-safe styling).
6. **Clean temp files** and summarize for commit.

---

## 1. Probe the backend contract FIRST (探查习惯)
Never guess backend field names or response shapes. Use Playwright to log in as admin, then fire `fetch` from inside the page (so sa-token cookie is included):
```js
const r = await page.evaluate(async () => {
  const res = await fetch('http://localhost:8080/<endpoint>?page=1&pageSize=10', { credentials: 'include' });
  return res.json();
});
console.log(JSON.stringify(r, null, 2));
```
- **Login**: username `admin`, password `Yx20011102!`, captcha universal code `YXLB`, submit button text is **「确 认」** (contains a space — match with `button:has-text("确")`).
- Confirm these per endpoint: is it **paginated** `{records,total,page,pageSize}` or a **single object**? Is `/enums` an **array** `[{code,desc}]` or an **object** `{group:[{code,desc}]}`? Are params `page/pageSize` (not `pageNum`)? Is delete/clean `@JsonCoverParam` (→ body) or plain (→ query)?

---

## 2. displayOrder is the single source of truth for ordering (核心习惯)
The backend sorts by `id` or insertion order; the frontend MUST render by `displayOrder` ascending.

- **Sidebar menus**: `sortMenuTree(menus)` recursively sorts by `displayOrder` (undefined/empty → `0` fallback) before `transformMenusToGlobalMenus`/`transformMenusToRoutes` in `initBackendMenu()`.
- **Any list/table**: after fetching, `list.sort((a,b)=>(a.displayOrder||0)-(b.displayOrder||0))`.
- **After a write or drag operation**: call the backend sort API → on success **re-fetch `getData()`** (backend returns displayOrder-ordered) → re-render. Optionally re-sort client-side too as a safety net.
- Always default a missing `displayOrder` to `0` so sorting never produces `NaN`.

---

## 3. Table row drag-sort = SortableJS (NOT HTML5) (拖拽习惯)
❌ Do **not** use `customRow` to set `draggable` on `<tr>`, and do **not** use HTML5 `dragstart/drop` delegation. In `ant-design-vue` 4.2.6 both fail — the row won't drag (user reported "不能拖拽排序" repeatedly).

✅ Use `sortablejs` (pointer-event based):
1. Wrap `<ATable>` in `<div ref="tableWrapRef">`.
2. `initSortable()` takes the **real tbody**: `tableWrapRef.value.querySelector('.ant-table-tbody')`. (You cannot `ref` the `<ATable>` component and get the tbody — you get a component instance.)
3. `new Sortable(tbody, { filter: '.ant-btn, .ant-switch, .ant-table-row-expand-icon, input, a', preventOnFilter: false, animation: 150, ghostClass, chosenClass, dragClass, onMove, onEnd })` → whole row draggable, but buttons/switches/expand-icons are excluded.
4. `onMove(evt)`: read `data-row-key` on both nodes, compare `parentId` to enforce **same-level constraint**; return `false` to block cross-level moves.
5. `onEnd(evt)`: if `oldIndex === newIndex` treat as no-op (covers blocked cross-level or a plain click). Otherwise reorder `tableData` by DOM order and call `fetchXxxSort({parentId, ids})` / `fetchXxxSort({startOrder, ids})`; on success `getData()` to sync with backend order.
6. `watch(tableData / expandedKeys, () => nextTick(initSortable))` — rebuild the instance after Vue re-creates the tbody on data change.

⚠️ **Verify drag with a REAL mouse** (`page.mouse.down/move/up`). A synthetic `dispatchEvent('dragstart')` gives a **false positive** — it looks like it works but the HTML5 approach actually fails. Only a real pointer trajectory reveals the failure.

---

## 4. Unwrap @sa/axios flat responses (取数习惯)
`request<T>()` returns `FlatResponseData<T> = { data, error, response }` — NOT the business payload directly.
```ts
const { data, error } = await fetchXxx();
data.value = data; // business object lives in `.data`
```
Mistake to avoid: `data.value = await fetchXxx()` assigns the whole `{data:{...}}` wrapper → `data.value.sys` is `undefined` → `Cannot read properties of undefined (reading '...')`.
Templates: use optional chaining defensively, e.g. `data.value?.sys?.computerName`.

---

## 5. View directory MUST match backend menu `component` (路由习惯)
`backend-menu.ts` resolves the view by **strictly** normalizing the menu `component` and looking it up in a `viewMap` built from `import.meta.glob('/src/views/**/*.vue')` (NO fuzzy / last-segment matching — see §11.1b for the glob-key landmine):
`monitor/job/index` → `src/views/monitor/job/index.vue`. Wrong/missing directory → `resolveViewComponent` returns `undefined` → route still registers & sidebar entry still shows, but the page area is **blank** (no coming-soon placeholder).

- When a route changes, **move the whole directory**, don't just rename files.
- Moving files: use **PowerShell `Move-Item`** (Git Bash `mv` hits Vite's file-lock → `Permission denied`). After moving, the elegant-router Vite plugin auto-regenerates `routes.ts` / `imports.ts` / `transform.ts` / `elegant-router.d.ts`.
- Dead directories: move them out of the repo to a desktop backup (never `rm -rf` inside the workspace).

---

## 6. API contract quick-reference (复用坑位)
- `@JsonCoverParam` single-param endpoints (delete / clean / changeStatus / run): `request({ method: 'post', data: { id } })` → **body**. Using query `?id=` → "请求体格式错误".
- `/enums` shape **varies per module**: array `[{code,desc}]` (sysConfig, sysLog) vs object `{ group: [{code,desc}] }` (job, sysLoginLog). Always probe first; write typings accordingly.
- Pagination param names: `page` / `pageSize` (not `pageNum`/`pageSize`... actually `page`, not `pageNum`).
- Missing `/xxx/sort` or `/xxx/editStatus` (404) → that module has no drag and no status switch; show status as a `<ATag>` and edit it inside the modal.

---

## 7. Table / card polish habits (UI 一致性)
- **Tables**: set `align: 'center'` on every column (header + cell consistently centered). For progress/percent columns give enough `width` and add `:scroll="{ x: N }"` to prevent overflow. Show percent as `{{ usage }}%` next to the bar: `<AProgress :percent="usage" :show-info="false" />` shortened to ~65% width + a `{{ usage }}%` span beside it.
- **Dark theme**: do NOT hard-code a light background on antd table headers (it becomes a white bar on dark cards). Make it follow the card: `:deep(.ant-table-thead > tr > th) { background: transparent }` and the same for rows.
- **`ADescriptions`**: drop `bordered` (avoids a double-border "box-in-box" look); fix `label` width (e.g. `110px`), soften the label color `rgba(128,128,128,0.9)`, keep content color inherited.
- **Card layout**: `md:grid-cols-2` equal-width grid, cards `h-full` for equal height, full-width spans with `md:col-span-2`.

---

## 8. Real-browser verification habits (验证不能省)
- Login admin / `Yx20011102!`, captcha `YXLB`, click 「确 认」 (text has a space).
- Selectors: `page.locator('.ant-table-tbody tr.ant-table-row').first().locator('button:has-text("详情")')`. Note: `page.$()` / `page.$$()` use native CSS and **do NOT support** `:has-text`; antd's `fixed: 'right'` columns render buttons into a separate fixed tbody, so the first data row needs `.first()`.
- Verification checklist: column headers complete / row count / status tags / write-roundtrip (add → delete test data) / zero fatal console errors. `ERR_CONNECTION_CLOSED` during dev HMR is a normal false-positive — ignore it.
- Put scripts in `C:\Users\29141\.workbuddy\binaries\node\workspace\`, run with the workspace managed node + `playwright-core` + system Chrome, then `rm -f` so nothing leaks into git.

---

## 9. Pre-commit habits
- `git status` — remove any temp files (`_tmp_*`, screenshots) created during verification.
- For large changes (~30+ files), either split commits (scaffold cleanup / routing mechanism / each business module) or do one commit whose message states: backend-driven routing, each module, displayOrder sorting, SortableJS drag, @sa/axios unwrap, and the verification method.

---

## 10. ⚠️ Submit-time lint/typecheck landmines (提交前必读，最大坑)
The pre-commit hook is `pnpm typecheck && pnpm lint-staged`, i.e. `vue-tsc --noEmit` THEN `eslint --fix` on staged files. **Any error (not warning) fails the commit.** Debugging these late is painful — read this before committing.

### 10.1 pnpm + @soybeanjs/eslint-config: prettier plugin "Cannot find package"
If `eslint --fix` dies with `Cannot find package 'prettier-plugin-json-sort' imported from noop.js`:
- **Root cause**: `.npmrc` has `shamefully-hoist=true` but the current `node_modules` was installed WITHOUT it honored, so transitive deps of `@soybeanjs/eslint-config` (notably `prettier` + `prettier-plugin-json-sort`) are NOT in the top-level `node_modules`. Prettier resolves the plugin by **bare name** from the project root and can't find it.
- **Fix**: declare both as **direct** `devDependencies` (not just transitive) so pnpm symlinks them to top-level, then reinstall:
  ```json
  "devDependencies": { "prettier": "3.9.5", "prettier-plugin-json-sort": "^0.0.2" }
  ```
  Then `node "D:/Program Files/nodejs/node_global/node_modules/pnpm/bin/pnpm.cjs" install`. Verify `node_modules/prettier` and `node_modules/prettier-plugin-json-sort` exist as symlinks.

### 10.2 The 6 recurring eslint ERROR patterns (must fix — they block commit)
All from the Soybean ruleset (`@soybeanjs/eslint-config`). Fix patterns:

1. **`props` declared but unused** (`@typescript-eslint/no-unused-vars` in `<script setup>`):
   ```ts
   // ❌ const props = defineProps<Props>();   ← props unused in script
   // ✅ defineProps<Props>();                  ← props still auto-expose to <template>
   ```
   (Template still sees `visible`/`row` etc. because `defineProps` is a macro that registers them.)

2. **`max-params` = 3 exceeded**: bundle the extras into an options object.
   ```ts
   // ❌ function login(user, pwd, captchaKey?, captchaCode?, redirect=true)
   // ✅ function login(user, pwd, options?: { redirect?: boolean; captchaKey?: string; captchaCode?: string })
   ```
   Caller passes `login(u, p, { captchaKey, captchaCode })`. Same for `fetchLogin` service fn.

3. **`@typescript-eslint/no-shadow`** (a param/var shadows an outer `ref` of the same name, e.g. `captchaKey`): rename via destructuring alias so the name never collides:
   ```ts
   const { redirect = true, captchaKey: captchaKeyValue = '', captchaCode = '' } = options ?? {};
   ```

4. **`no-continue`** in a `for` loop: invert the guard, do NOT keep `continue`.
   ```ts
   // ❌ for (const v of variants) { if (!v) continue; keys.push(...); }
   // ✅ for (const v of variants) { if (v) { keys.push(...); } }
   ```

5. **`@typescript-eslint/no-empty-object-type`**: an interface that just extends another with no members.
   ```ts
   // ❌ interface MenuSaveVO extends MenuBaseVO {}
   // ✅ type MenuSaveVO = MenuBaseVO;
   ```

6. **`complexity` > 20** on a handler (e.g. `handleSubmit`): extract the branchy payload-building into a small helper so the handler drops under 20:
   ```ts
   function buildDeptPayload() { /* all the `??` / `||` fallbacks */ return {...}; }
   async function handleSubmit() { /* only validate + if-add/else-edit + emit */ }
   ```

7. **`no-nested-ternary`**: flatten with `if/return`.
   ```ts
   // ❌ return type === 1 ? '目录' : type === 2 ? '菜单' : '按钮';
   // ✅ if (type === 1) return '目录'; if (type === 2) return '菜单'; return '按钮';
   ```

8. **`vue/no-unused-vars`** in template slots / `v-for`: drop the unused destructured name.
   ```html
   <!-- ❌ <template #bodyCell="{ column, record, index }">  (index unused) -->
   <!-- ✅ <template #bodyCell="{ column, record }"> -->
   ```

### 10.3 Warnings that DO NOT block (don't chase them unless asked)
- **`'Api' is not defined` (`vue/no-undef-properties`)** — FALSE POSITIVE. `Api` is an ambient global `declare namespace Api` in `src/typings/api.d.ts`; the vue-eslint-parser doesn't see it. Harmless at runtime.
- **`no-static-inline-styles`** — you used `style="..."` in templates. Works fine; just a style warning.
- Project has **no `--max-warnings`**, so `eslint --fix` exits 0 with warnings and the hook passes. Only **errors** fail it.

### 10.4 vue-tsc landmines (typecheck, runs BEFORE lint)
- **typings `api/*.d.ts` must stay ambient (global script)**: a top-level `import` turns the file into a module and `declare namespace Api { ... }` inside it will NOT merge into the global `Api` → `Api.X is not defined` / not exported. Keep them as pure declarations; use fully-qualified `Api.Common.X` instead of importing `Common`.
- **`Api` is a global ambient namespace — never `import type { Api } from '@/typings'`**; just reference `Api.X` directly. (Same for `App`, `Common`.)
- After any typings/api change, re-run `vue-tsc --noEmit --skipLibCheck` to confirm exit 0 before committing.

### 10.5 The IDE "stash eats my fix" trap (重现过的幽灵错误)
An IDE commit runs `pre-commit` hooks on a **stash of unstaged changes**, NOT the working tree. If you fix files but DON'T `git add` them, the hook runs against the **old** (broken) code, you see the same errors again, and it looks like your fix "didn't take".
- **Always `git add` every file you just edited/fixed before the user commits.**
- After fixing lint/type errors, run `eslint --fix` + `vue-tsc` yourself to confirm `EXIT=0`, THEN `git add` the touched files so the staged snapshot is the corrected one.

### 10.6 Quick verification recipe (run before telling the user "it's ready to commit")
```bash
cd "C:/Users/29141/Desktop/platform/platform-admin-vue3"
node "D:/Program Files/nodejs/node_global/node_modules/pnpm/bin/pnpm.cjs" exec eslint --fix <changed-files...>
node "D:/Program Files/nodejs/node_global/node_modules/pnpm.cjs" exec vue-tsc --noEmit --skipLibCheck
# both must print EXIT=0 (eslint may print warnings — that's fine, only errors fail)
```


---

## 11. backend-menu 路由映射约定与 fuzzy 坑（菜单/component 解析）
`src/store/modules/route/backend-menu.ts` 把后端 `MenuTreeVO` 转成 vue-router 路由 + 侧边栏菜单。两条铁律：
- **路由（path/name）与页面（component）解耦**：path 不同 → 两条独立路由、两个侧边栏入口、不同 URL；但页面看 `component` 字段命中的 `.vue`。两个菜单想共享同一页，就让它们的 `component` 写成同一个值。
- **`component` 必须严格匹配真实视图文件**：`resolveViewComponent` 命中不到返回 `undefined` → 路由仍注册、侧边栏仍显示该菜单，但页面区域空白（不渲染具体页面，也**不**显示 coming-soon 占位页）。要显示内容，必须在 `src/views/<component>.vue` 或 `src/views/<component>/index.vue` 建好对应视图。

### 11.1 致命坑：fuzzy「按最后一段全局匹配」会跨模块误命中
早期 `buildComponentCandidates` 有一段「按 component 最后非 index 段名，全局找 `*/<seg>/index.vue`」的 fuzzy 兜底。后果：存储配置菜单 `component='storage/config/index'`，最后段是 `config`，竟然命中了 `src/views/system/config/index.vue`（参数设置页）——表现为「俩路由不一样却显示同一页」。
- **教训**：component 解析**只允许**精确匹配 + 常见顶层前缀剥离（system/ manage/ module(s)/ admin/ views/ web/），**绝不做**按段名的全局模糊匹配。
- 现在代码已删掉该 fuzzy 段（`viewKeys` 变量也随之删除）。改动后务必用真实 `src/views` 文件清单验证：缺失视图返回 `undefined`、存在的视图正常命中。

### 11.1b 致命坑：`import.meta.glob` 的 key 是 `/src/views/...`，不是 `@/views/...`
删掉 fuzzy 后曾出现「**全部菜单点击都空白**」。根因：`import.meta.glob('@/views/**/*.vue')` 返回对象的 **key 是 Vite 解析后的项目根绝对路径 `/src/views/system/user/index.vue`，而非别名 `@/views/...`**。代码却用 `viewModules['@/views/...']` 精确查 → 永远 `undefined`、从来没命中过；之前能显示纯靠 fuzzy 兜底，fuzzy 一删就全崩。
- **正解**：glob pattern 用 `import.meta.glob('/src/views/**/*.vue')`（与 `src/utils/icon.ts` 的 `/src/assets/...` 惯例一致）；再写 `normalizeViewPath()` 把「真实 key」与「后端 component」都归一化（剥 `@/views/`|`/src/views/`|前导 `/`、剥 `.vue`、剥尾 `/index`），启动时建 `viewMap: { 'system/user': loader }`，`resolveViewComponent` 归一化 component 后在 viewMap 精确查（含前缀剥离变体）。
- **铁律**：Vite `import.meta.glob` 的返回 key **一律是 `/src/...` 项目根绝对路径**。拿 `@/` 别名当查找 key 必错——要么 glob 用 `/src/...` 且用绝对 key 查，要么把 key 归一化后再比。

### 11.2 诊断「菜单显示不对 / 显示错页」的最低成本方法（无需 Playwright）
直接 curl 后端拿菜单树，比开浏览器快得多：
```bash
# 1) 登录拿 token（万能码 YXLB 作 captchaCode；后端无 token 校验但 /user/info 需登录态）
KEY=$(curl -s http://localhost:8080/captcha/get | grep -o '"captchaKey":"[^"]*"' | sed 's/.*:"//;s/"//')
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login -H 'Content-Type: application/json' \
  -d "{\"username\":\"admin\",\"password\":\"Yx20011102!\",\"captchaKey\":\"$KEY\",\"captchaCode\":\"YXLB\"}" \
  | grep -o '"data":"[^"]*"' | sed 's/.*:"//;s/"//')
# 2) 带 Bearer 调 /user/info（否则返回 66B 空 data「未登录或登录已过期」）
curl -s http://localhost:8080/user/info -H "Authorization: Bearer $TOKEN" | python -m json.tool
```
拿到菜单树后，定位目标菜单的 `component`，确认 `src/views/<component>.vue` 或 `src/views/<component>/index.vue` 是否真实存在。
