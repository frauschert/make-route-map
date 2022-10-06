export type RoutesType = {
  [name: string]: {
    path: string;
    // Params contained in this path's URL
    params?: {
      [paramName: string]: true;
    };
    search?: {
      // Is this field required or not?
      [paramName: string]: boolean;
    };
  };
};

type ParamKeys<R extends RoutesType, K extends keyof R> = keyof R[K]['params'];
type SearchKeys<R extends RoutesType, K extends keyof R> = keyof R[K]['search'];

type ReturnParams<R extends RoutesType, K extends keyof R> = {
  params: { [PK in ParamKeys<R, K>]: string | number };
};

type ReturnSearch<R extends RoutesType, K extends keyof R> = {
  search?: { [PK in SearchKeys<R, K>]: string | number };
};

export type RoutesReturn<R extends RoutesType> = {
  [K in keyof R]: [ParamKeys<R, K>, SearchKeys<R, K>] extends [
    undefined,
    undefined
  ]
    ? () => string
    : [ParamKeys<R, K>, SearchKeys<R, K>] extends [any, undefined]
    ? (params: ReturnParams<R, K>) => string
    : [ParamKeys<R, K>, SearchKeys<R, K>] extends [undefined, any]
    ? (params?: ReturnSearch<R, K>) => string
    : [ParamKeys<R, K>, SearchKeys<R, K>] extends [any, any]
    ? (params: ReturnParams<R, K> & ReturnSearch<R, K>) => string
    : never;
};

export type UseNavigateReturn<R extends RoutesType> = {
  [K in keyof RoutesReturn<R>]: Parameters<
    RoutesReturn<R>[K]
  >[0] extends undefined
    ? () => void
    : (params: Parameters<RoutesReturn<R>[K]>[0]) => void;
};

export interface MakeRouteMapOptions {
  /**
   * By default, we match path parameters using the `:id` pattern.
   * You can change this by passing an alternative regex from
   * the result of this function.
   */
  paramMatcher?: (paramName: string) => RegExp;
}

/**
 * Use this function to create a single source of truth
 * for all routes in your app
 */
export const makeRouteMap = <R extends RoutesType>(
  routes: R,
  options?: MakeRouteMapOptions
): RoutesReturn<R> => {
  let obj: Record<string, unknown> = {};
  Object.entries(routes).forEach(([_key, { path }]) => {
    const key = _key;

    const func = (params?: {
      params?: {
        [paramName: string]: string | number;
      };
      search?: {
        [paramName: string]: string | number;
      };
    }) => {
      let newPath = String(path);

      if (params?.params) {
        Object.entries(params.params).forEach(([paramName, value]) => {
          newPath = newPath.replace(
            options?.paramMatcher?.(paramName) || new RegExp(':' + paramName),
            String(value)
          );
        });
      }
      if (!params?.search) {
        return newPath;
      } else {
        return `${newPath}?${new URLSearchParams(
          params.search as any
        ).toString()}`;
      }
    };

    obj[key] = func;
  });
  return obj as RoutesReturn<R>;
};

/**
 * Creates a navigate function which you can use to
 * navigate type-safely between all routes in your app
 */
export const makeNavigate = <R extends RoutesType>(
  routeMap: RoutesReturn<R>,
  goToRoute: (route: string) => void
): UseNavigateReturn<R> => {
  const toReturn: Record<string, unknown> = {};
  Object.keys(routeMap).forEach(_routeName => {
    const routeName = _routeName;
    toReturn[routeName] = (params?: any) => {
      goToRoute(routeMap[routeName](params));
    };
  });
  return toReturn as UseNavigateReturn<R>;
};

export default makeRouteMap;
