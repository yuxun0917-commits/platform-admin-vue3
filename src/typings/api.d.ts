/**
 * Namespace Api
 *
 * All backend api type
 */
declare namespace Api {
  namespace Common {
    /** common params of paginating */
    interface PaginatingCommonParams {
      /** current page number */
      current: number;
      /** page size */
      size: number;
      /** total count */
      total: number;
    }

    /** common params of paginating query list data */
    interface PaginatingQueryRecord<T = any> extends PaginatingCommonParams {
      records: T[];
    }

    /**
     * backend paging result shape
     *
     * Backend `Paging<T>` serializes as `{ records, total, page, pageSize }`
     */
    interface BackendPagingResult<T = any> {
      /** record list */
      records: T[];
      /** current page number (1-based) */
      page: number;
      /** page size */
      pageSize: number;
      /** total count */
      total: number;
    }

    /** common search params of table */
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    /**
     * enable status
     *
     * aligned with backend status enums: 0 disabled, 1 normal
     */
    type EnableStatus = 0 | 1;

    /** 通用枚举选项（/enums 接口返回） */
    interface EnumOption {
      /** 枚举 code */
      code: number;
      /** 枚举描述 */
      desc: string;
    }

    /** common record */
    type CommonRecord<T = any> = {
      /** record id */
      id: number;
      /** record creator */
      createBy: string;
      /** record create time */
      createTime: string;
      /** record updater */
      updateBy: string;
      /** record update time */
      updateTime: string;
      /** record status */
      status: EnableStatus;
    } & T;
  }

  /**
   * Namespace Auth
   *
   * Backend api module: "auth"
   */
  namespace Auth {
    /** Backend login returns a single Sa-Token value (plain string) */
    type LoginToken = string;

    /** Graphical captcha returned by `GET /captcha/get` */
    interface Captcha {
      /** Unique captcha key, must be sent back on login */
      captchaKey: string;
      /** Base64 encoded image, can be assigned directly to <img src> */
      base64Image: string;
    }

    /**
     * Backend `UserInfoVO` returned by `GET /user/info`
     *
     * Contains the current user's profile, role list, permission identifiers,
     * and the backend-driven menu tree used to build sidebar routes.
     */
    interface UserInfo {
      /** Current user profile (no password) */
      user: Api.User.UserVO;
      /** Role list */
      roles: Api.Role.RoleVO[];
      /** Permission identifiers derived from role menus */
      permissions: string[];
      /** Backend menu tree */
      menus: MenuTree[];
    }

    /** Backend menu tree node returned by `GET /user/info` (MenuTreeVO) */
    interface MenuTree {
      /** menu id */
      id?: number;
      /** menu display name */
      menuName: string;
      /** 1 directory, 2 menu, 3 button */
      menuType: number;
      /** vue-router path, relative to parent */
      path: string;
      /** view path relative to src/views, e.g. "system/user/index" */
      component?: string;
      /** iconify icon name, e.g. "ep:user" */
      icon?: string;
      /** redirect path relative to parent (for directories) */
      redirect?: string;
      /** 0 shown, 1 hidden */
      isHidden: number;
      /** 1 cache, 0 not */
      isCache: number;
      /** 1 external link, 0 internal */
      isExternal: number;
      /** display order */
      displayOrder?: number;
      /** children menu nodes */
      children?: MenuTree[];
    }
  }

  /**
   * Namespace Route
   *
   * Backend api module: "route"
   */
  namespace Route {
    type ElegantConstRoute = import('@elegant-router/types').ElegantConstRoute;

    interface MenuRoute extends ElegantConstRoute {
      id: string;
    }

    interface UserRoute {
      routes: MenuRoute[];
      home: import('@elegant-router/types').LastLevelRouteKey;
    }
  }

  /**
   * namespace SystemManage
   *
   * backend api module: "systemManage"
   */
  namespace SystemManage {
    /** role */
    type Role = Common.CommonRecord<{
      /** role name */
      roleName: string;
      /** role code */
      roleCode: string;
      /** role description */
      roleDesc: string;
    }>;

    /** role search params */
    type RoleSearchParams = Partial<
      Pick<Api.SystemManage.Role, 'roleName' | 'roleCode' | 'status'> & Common.CommonSearchParams
    >;

    /** role list */
    type RoleList = Common.PaginatingQueryRecord<Role>;

    /** all role */
    type AllRole = Pick<Role, 'id' | 'roleName' | 'roleCode'>;

    /**
     * user gender
     *
     * - "1": "male"
     * - "2": "female"
     */
    type UserGender = '1' | '2';

    /** user (fields aligned with backend UserVO: username/nickname/gender/phone/email/status) */
    type User = Common.CommonRecord<{
      /** user name */
      username: string;
      /** user nick name */
      nickname: string;
      /** user gender (0 unknown, 1 male, 2 female) */
      gender: UserGender;
      /** user phone */
      phone: string;
      /** user email */
      email: string;
      /** user role code collection (front-end form extension; not present in list VO) */
      userRoles?: string[];
      /** status (1 normal, 2 disabled) */
      status: Api.Common.EnableStatus;
    }>;

    /** user search params (aligned with backend GET /user/page: keyword + status + gender) */
    type UserSearchParams = Partial<
      { keyword?: string } & Pick<Api.SystemManage.User, 'status' | 'gender'> & Common.CommonSearchParams
    >;

    /** user list */
    type UserList = Common.PaginatingQueryRecord<User>;

    /** backend paging result shape: { records, page, pageSize, total } */
    interface BackendPagingResult<T> {
      /** record list */
      records: T[];
      /** current page number (1-based) */
      page: number;
      /** page size */
      pageSize: number;
      /** total count */
      total: number;
    }

    /** enum option returned by `GET /{module}/enums` */
    interface EnumVO {
      /** enum code */
      code: number;
      /** enum description */
      desc: string;
    }

    /** user add payload (POST /user/add) — fields aligned with backend UserSaveVO */
    type UserSaveVO = Pick<User, 'username' | 'nickname' | 'gender' | 'phone' | 'email' | 'userRoles' | 'status'> & {
      /** initial password, must contain "!" per password policy */
      password: string;
    };

    /** user edit payload (POST /user/edit) — fields aligned with backend UserEditVO */
    type UserEditVO = Pick<
      User,
      'id' | 'username' | 'nickname' | 'gender' | 'phone' | 'email' | 'userRoles' | 'status'
    >;

    /** change password payload (POST /user/changePassword) */
    interface UserPasswordVO {
      /** target user id */
      userId: number;
      /** new password, must contain "!" per password policy */
      password: string;
    }

    /** user select option (GET /user/select-list) */
    type UserSelectVO = Pick<User, 'id' | 'username'>;

    /**
     * menu type
     *
     * - "1": directory
     * - "2": menu
     */
    type MenuType = '1' | '2';

    type MenuButton = {
      /**
       * button code
       *
       * it can be used to control the button permission
       */
      code: string;
      /** button description */
      desc: string;
    };

    /**
     * icon type
     *
     * - "1": iconify icon
     * - "2": local icon
     */
    type IconType = '1' | '2';

    type MenuPropsOfRoute = Pick<
      import('vue-router').RouteMeta,
      | 'i18nKey'
      | 'keepAlive'
      | 'constant'
      | 'order'
      | 'href'
      | 'hideInMenu'
      | 'activeMenu'
      | 'multiTab'
      | 'fixedIndexInTab'
      | 'query'
    >;

    type Menu = Common.CommonRecord<{
      /** parent menu id */
      parentId: number;
      /** menu type */
      menuType: MenuType;
      /** menu name */
      menuName: string;
      /** route name */
      routeName: string;
      /** route path */
      routePath: string;
      /** component */
      component?: string;
      /** iconify icon name or local icon name */
      icon: string;
      /** icon type */
      iconType: IconType;
      /** buttons */
      buttons?: MenuButton[] | null;
      /** children menu */
      children?: Menu[];
    }> &
      MenuPropsOfRoute;

    /** menu list */
    type MenuList = Common.PaginatingQueryRecord<Menu>;

    type MenuTree = {
      id: number;
      label: string;
      pId: number;
      children?: MenuTree[];
    };
  }
}
