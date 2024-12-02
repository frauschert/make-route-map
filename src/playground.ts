type RouteMap = {
  [name: string]: Route;
};

type Route = {
  path: string;
  subRoutes?: RouteMap;
};

const routeMap = {
  home: {
    path: '/home',
  },
  app: {
    path: '/app',
    subRoutes: {
      test: {
        path: '/mhs',
        subRoutes: {
          device: {
            path: '/:deviceId',
          },
        },
      },
    },
  },
} as const satisfies RouteMap;

type RoutePaths<
  T extends RouteMap,
  RootPath extends string = ''
> = T extends Record<string, infer U extends Route>
  ? U extends {
      path: infer Path extends string;
      subRoutes: infer SubRoute extends RouteMap;
    }
    ? Concat<RootPath, Path> | RoutePaths<SubRoute, Concat<RootPath, Path>>
    : U extends { path: infer Path extends string }
    ? Concat<RootPath, Path>
    : never
  : never;

type Concat<T extends string, U extends string> = `${T}${U}`;

type Routes = RoutePaths<typeof routeMap>;
