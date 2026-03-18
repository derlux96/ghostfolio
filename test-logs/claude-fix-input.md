=== BUILD ERRORS ===

## API Build Errors
```

> nx run api:build

[1m[31mERROR[39m[22m in [1m./apps/api/src/app/allocation/allocation.controller.ts:[32m[1m9:1[22m[39m[1m[39m[22m
[90mTS6133: [39m'permissions' is declared but its value is never read.
  [0m [90m  7 |[39m   [33mSetAllocationTargetsDto[39m
   [90m  8 |[39m } [36mfrom[39m [32m'@ghostfolio/common/dtos'[39m[33m;[39m
  [31m[1m>[22m[39m[90m  9 |[39m [36mimport[39m { permissions } [36mfrom[39m [32m'@ghostfolio/common/permissions'[39m[33m;[39m
   [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
   [90m 10 |[39m [36mimport[39m type { [33mRequestWithUser[39m } [36mfrom[39m [32m'@ghostfolio/common/types'[39m[33m;[39m
   [90m 11 |[39m
   [90m 12 |[39m [36mimport[39m {[0m
[1m[31mERROR[39m[22m in [1m./apps/api/src/app/allocation/allocation.service.ts:[32m[1m6:1[22m[39m[1m[39m[22m
[90mTS6133: [39m'PortfolioPosition' is declared but its value is never read.
  [0m [90m 4 |[39m   [33mRebalancingAction[39m
   [90m 5 |[39m } [36mfrom[39m [32m'@ghostfolio/common/dtos'[39m[33m;[39m
  [31m[1m>[22m[39m[90m 6 |[39m [36mimport[39m { [33mPortfolioPosition[39m } [36mfrom[39m [32m'@ghostfolio/common/interfaces'[39m[33m;[39m
   [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
   [90m 7 |[39m
   [90m 8 |[39m [36mimport[39m { [33mInjectable[39m } [36mfrom[39m [32m'@nestjs/common'[39m[33m;[39m
   [90m 9 |[39m [36mimport[39m { [33mAssetClass[39m[33m,[39m [33mAssetSubClass[39m[33m,[39m [33mDataSource[39m[33m,[39m [33mPrisma[39m } [36mfrom[39m [32m'@prisma/client'[39m[33m;[39m[0m
[1m[31mERROR[39m[22m in [1m./apps/api/src/app/allocation/allocation.service.ts:[32m[1m9:10[22m[39m[1m[39m[22m
[90mTS6133: [39m'AssetClass' is declared but its value is never read.
  [0m [90m  7 |[39m
   [90m  8 |[39m [36mimport[39m { [33mInjectable[39m } [36mfrom[39m [32m'@nestjs/common'[39m[33m;[39m
  [31m[1m>[22m[39m[90m  9 |[39m [36mimport[39m { [33mAssetClass[39m[33m,[39m [33mAssetSubClass[39m[33m,[39m [33mDataSource[39m[33m,[39m [33mPrisma[39m } [36mfrom[39m [32m'@prisma/client'[39m[33m;[39m
   [90m    |[39m          [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
   [90m 10 |[39m
   [90m 11 |[39m [33m@[39m[33mInjectable[39m()
   [90m 12 |[39m [36mexport[39m [36mclass[39m [33mAllocationService[39m {[0m
[1m[31mERROR[39m[22m in [1m./apps/api/src/app/allocation/allocation.service.ts:[32m[1m9:22[22m[39m[1m[39m[22m
[90mTS6133: [39m'AssetSubClass' is declared but its value is never read.
  [0m [90m  7 |[39m
   [90m  8 |[39m [36mimport[39m { [33mInjectable[39m } [36mfrom[39m [32m'@nestjs/common'[39m[33m;[39m
  [31m[1m>[22m[39m[90m  9 |[39m [36mimport[39m { [33mAssetClass[39m[33m,[39m [33mAssetSubClass[39m[33m,[39m [33mDataSource[39m[33m,[39m [33mPrisma[39m } [36mfrom[39m [32m'@prisma/client'[39m[33m;[39m
   [90m    |[39m                      [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
   [90m 10 |[39m
   [90m 11 |[39m [33m@[39m[33mInjectable[39m()
   [90m 12 |[39m [36mexport[39m [36mclass[39m [33mAllocationService[39m {[0m
[1m[31mERROR[39m[22m in [1m./apps/api/src/app/allocation/allocation.service.ts:[32m[1m9:49[22m[39m[1m[39m[22m
[90mTS6133: [39m'Prisma' is declared but its value is never read.
  [0m [90m  7 |[39m
   [90m  8 |[39m [36mimport[39m { [33mInjectable[39m } [36mfrom[39m [32m'@nestjs/common'[39m[33m;[39m
  [31m[1m>[22m[39m[90m  9 |[39m [36mimport[39m { [33mAssetClass[39m[33m,[39m [33mAssetSubClass[39m[33m,[39m [33mDataSource[39m[33m,[39m [33mPrisma[39m } [36mfrom[39m [32m'@prisma/client'[39m[33m;[39m
   [90m    |[39m                                                 [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
   [90m 10 |[39m
   [90m 11 |[39m [33m@[39m[33mInjectable[39m()
   [90m 12 |[39m [36mexport[39m [36mclass[39m [33mAllocationService[39m {[0m
[1m[31mERROR[39m[22m in [1m./apps/api/src/app/allocation/allocation.service.ts:[32m[1m207:5[22m[39m[1m[39m[22m
[90mTS6133: [39m'userId' is declared but its value is never read.
  [0m [90m 205 |[39m   [36mpublic[39m [36masync[39m setAllocationTargets({
   [90m 206 |[39m     targets[33m,[39m
  [31m[1m>[22m[39m[90m 207 |[39m     userId
   [90m     |[39m     [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
   [90m 208 |[39m   }[33m:[39m {
   [90m 209 |[39m     targets[33m:[39m [33mAllocationTargetDto[39m[][33m;[39m
   [90m 210 |[39m     userId[33m:[39m string[33m;[39m[0m
[1m[31mERROR[39m[22m in [1m./apps/api/src/app/export/export.service.ts:[32m[1m212:7[22m[39m[1m[39m[22m
[90mTS2322: [39mType '{ id: string; name: string; }[]' is not assignable to type 'Omit<{ userId: string; targetAllocation: number; color: string; name: string; id: string; }, "userId">[]'.
  Type '{ id: string; name: string; }' is missing the following properties from type 'Omit<{ userId: string; targetAllocation: number; color: string; name: string; id: string; }, "userId">': targetAllocation, color
  [0m [90m 210 |[39m       )[33m,[39m
   [90m 211 |[39m       platforms[33m:[39m [33mObject[39m[33m.[39mvalues(platformsMap)[33m,[39m
  [31m[1m>[22m[39m[90m 212 |[39m       tags[33m,[39m
   [90m     |[39m       [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
   [90m 213 |[39m       activities[33m:[39m activities[33m.[39mmap(
   [90m 214 |[39m         ({
   [90m 215 |[39m           accountId[33m,[39m[0m
[1m[31mERROR[39m[22m in [1m./apps/api/src/app/user/user.service.ts:[32m[1m170:7[22m[39m[1m[39m[22m
[90mTS2322: [39mType '{ id: string; name: string; userId: string; isUsed: boolean; }[]' is not assignable to type '({ userId: string; targetAllocation: number; color: string; name: string; id: string; } & { isUsed: boolean; })[]'.
  Type '{ id: string; name: string; userId: string; isUsed: boolean; }' is not assignable to type '{ userId: string; targetAllocation: number; color: string; name: string; id: string; } & { isUsed: boolean; }'.
    Type '{ id: string; name: string; userId: string; isUsed: boolean; }' is missing the following properties from type '{ userId: string; targetAllocation: number; color: string; name: string; id: string; }': targetAllocation, color
  [0m [90m 168 |[39m       subscription[33m,[39m
   [90m 169 |[39m       systemMessage[33m,[39m
  [31m[1m>[22m[39m[90m 170 |[39m       tags[33m,[39m
   [90m     |[39m       [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
   [90m 171 |[39m       access[33m:[39m access[33m.[39mmap((accessItem) [33m=>[39m {
   [90m 172 |[39m         [36mreturn[39m {
   [90m 173 |[39m           alias[33m:[39m accessItem[33m.[39malias[33m,[39m[0m
webpack compiled with [1m[31m8 errors[39m[22m (873a3db467da2894)



 NX   Running target build for project api failed

Failed tasks:

- api:build

Hint: run the command with --verbose for more details.
```

## Client Build Errors
```
[37m      3 │ @import [32m'apps/client/src/styles.scss'[37m;
        ╵         [32m~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m
[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mDeprecation[0m [1m[35m[plugin angular-sass][0m
    apps/client/src/styles.scss:22:6:
[37m      22 │     #{[32m[37mred($light-primary-text)}, #{green($light-primary-text)},
         ╵       [32m^[0m
  Global built-in functions are deprecated and will be removed in Dart Sass 3.0.0.
  Use color.red instead.
  
  More info and automated migrator: [4mhttps://sass-lang.com/d/import[0m
  The plugin "angular-sass" was triggered by this import
    angular:styles/global:styles:3:8:
[37m      3 │ @import [32m'apps/client/src/styles[39m[22m
[1m[33m.scss'[37m;
        ╵         [32m~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m
[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mDeprecation[0m [1m[35m[plugin angular-sass][0m
    apps/client/src/styles.scss:22:6:
[37m      22 │     #{[32m[37mred($light-primary-text)}, #{green($light-primary-text)},
         ╵       [32m^[0m
  red() is deprecated. Suggestion:
  
  color.channel($color, "red", $space: rgb)
  
  More info: [4mhttps://sass-lang.com/d/color-functions[0m
  The plugin "angular-sass" was triggered by this import
    angular:styles/global:styles:3:8:
[37m      3 │ @import [32m'apps/client/src/styles.scss'[37m;
        ╵         [32m~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m
[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mDeprecation[0m [1m[35m[plugin angular-sass][0m
    apps/client/src/styles.scss:22:35:
[37m      22 │     #{red($light-primary-text)}, #{[32m[37mgreen($light-primary-text)},
         ╵                                    [32m^[0m
  green() is deprecated. Suggestion:
  
  color.channel($color, "green", $space: rgb)
  
  More info: [4mhttps://sass-lang.com/d/color-functions[0m
  The plugin "angular-sass" was triggered by this import
    angular:styles/global:styles:3:8:
[37m      3 │ @import [32m'apps/client/src/styles.scss'[37m;
        ╵         [32m~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m
[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mDeprecation[0m [1m[35m[plugin angular-sass][0m
    apps/client/src/styles/bootstrap.scss:8:8:
[37m      8 │ @import [32m[37m'bootstrap/scss/functions';
        ╵         [32m^[0m
  Sass @import rules are deprecated and will be removed in Dart Sass 3.0.0.
  
  More info and automated migrator: [4mhttps://sass-lang.com/d/import[0m
  The plugin "angular-sass" was triggered by this import
    angular:styles/global:styles:3:8:
[37m      3 │ @import [32m'apps/client/src/styles.scss'[37m;
        ╵         [32m~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m
[33m▲ [43;33m[[43;30mWARNIN[39m[22m[1m[33mG[43;33m][0m [1m14 repetitive deprecation warnings omitted.
Run in verbose mode to see all warnings.[0m [1m[35m[plugin angular-sass][0m
    angular:styles/global:styles:3:8:
[37m      3 │ @import [32m'apps/client/src/styles.scss'[37m;
        ╵         [32m~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m
  null
[39m[22m
[1m[31m[31m✘ [41;31m[[41;97mERROR[41;31m][0m [1mTS6133: 'index' is declared but its value is never read.[0m [1m[35m[plugin angular-compiler][0m
    apps/client/src/app/pages/portfolio/custom-allocations/custom-allocations-page.component.ts:90:22:
[37m      90 │   public trackByIndex([32mindex[37m: number, item: RebalancingAction): str...
         ╵                       [32m~~~~~[0m
[31m✘ [41;31m[[41;97mERROR[41;31m][0m [1mTS6133: 'index' is declared but its value is never read.[0m [1m[35m[plugin angular-compiler][0m
    apps/client/src/app/pages/portfolio/custom-allocations/custom-allocations-page.component.ts:94:32:
[37m      94 │   public trackByIndexAllocation([32mindex[37m: number, item: any): string {
         ╵                                 [32m~~~~~[0m
[31m✘ [41;31m[[41;97mERROR[41;31m][0m [1mTS2724: '"ionicons/icons"' has no exported member named 'targetOutline'. Did you mean 'atOutline'?[0m [1m[35m[plugin angular-compiler][0m
    apps/client/src/app/pages/portfolio/portfolio-page.component.ts:21:2:
[37m      21 │   [32mtargetOutline[37m
         ╵   [32m~~~~~~~~~~~~~[0m
  'atOutline' is declared here.
    node_modules/ionicons/icons/index.d.ts:94:19:
[37m      94 │ export declare var [32matOutline[37m: string;
         ╵                    [32m~~~~~~~~~[0m
[31m✘ [41;31m[[41;97mERROR[41;31m][0m [1mTS2304: Cannot find name 'CustomAllocationResponse'.[0m [1m[35m[plugin angular-compiler][0m
    libs/ui/src/lib/services/data.service.ts:749:46:
[37m      749 │ ... fetchCustomAllocations(): Observable<[32mCustomAllocationResponse[37m> {
          ╵                                          [32m~~~~~~~~~~~~~~~~~~~~~~~~[0m
[31m✘ [41;31m[[41;97mERROR[41;31m][0m [1mTS2304: Cannot find name 'CustomAllocationResponse'.[0m [1m[35m[plugin angular-compiler][0m
    libs/ui/src/lib/services/data.service.ts:750:25:
[37m      750 │ ...turn this.http.get<[32mCustomAllocationResponse[37m>('/a[39m[22m[1m[31mpi/v1/allocati...
          ╵                       [32m~~~~~~~~~~~~~~~~~~~~~~~~[0m
[31m✘ [41;31m[[41;97mERROR[41;31m][0m [1mTS2322: Type '{ id: undefined; name: string; userId: null; }' is not assignable to type 'SelectedTag'.
  Type '{ id: undefined; name: string; userId: null; }' is missing the following properties from type 'NewTag': color, targetAllocation[0m [1m[35m[plugin angular-compiler][0m
    libs/ui/src/lib/tags-selector/tags-selector.component.ts:105:6:
[37m      105 │       [32mtag[37m = {
          ╵       [32m~~~[0m
[39m[22m



 NX   Running target build for project client failed

Failed tasks:

- client:build

Hint: run the command with --verbose for more details.
```

## Test Failures
```
--- api ---
    [
31m+     ],
[39m
   
 [31m+   
  "constr
uctor": [
Function B
ig],[39m
    [31
m+     "e
": -2,[39
m
    [
31m+     "s"
: 1,[39
m
    [31
m+   },[39
m
    [2
m    "gr
ossP
erformanceW
ithCurrenc
yEffect": "70",[22m
    [2m    "includeInTot
alAssetValue": false,[22m
 
   [2m    "in
vestment":
 "1820",
[22m
    [2m 
   "investmentWithCurrencyEffect": "1750",[22m
    [2m    "marketPrice": 1,[22m
    [33m@@ -37,9 +62,66 @@[39m
    [2m      "wtd": "-80",[22m
    [2m      "ytd": "



 NX   Running target test for project api failed

Failed tasks:

- api:test

Hint: run the command with --verbose for more details.
```

## API Startup Errors
```

```
