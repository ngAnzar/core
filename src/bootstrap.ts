import { ApplicationRef, enableProdMode, ViewEncapsulation } from "@angular/core"
import { enableDebugTools, platformBrowser } from "@angular/platform-browser"
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic"
// import { hmrModule } from "@angularclass/hmr"


if (__ENV__ === "production") {
    enableProdMode()
}


function initModule(modRef: any): any {
    if (__DEBUG__) {
        const appRef = modRef.injector.get(ApplicationRef)
        const cmpRef = appRef.components[0]
        enableDebugTools(cmpRef)
    }

    // return __HMR__ ? hmrModule(modRef, module) : modRef
    return modRef
}


function _bootstrap(moduleClass: any) {
    if (__AOT__) {
        return platformBrowser().bootstrapModuleFactory(moduleClass)
    } else {
        return platformBrowserDynamic().bootstrapModule(moduleClass, {
            defaultEncapsulation: ViewEncapsulation.None
        })
    }
}


export function bootstrap(moduleClass: any) {
    const main = () => {
        _bootstrap(moduleClass)
            .then(initModule)
            .catch((err: any) => console.error(err))
    }

    if (__HMR__) {
        const contentLoaded = () => {
            document.removeEventListener("DOMContentLoaded", contentLoaded, false)
            main()
        }

        switch (document.readyState) {
            case "loading":
                document.addEventListener("DOMContentLoaded", contentLoaded, false)
                break

            case "interactive":
            case "complete":
            default:
                main()
        }
    } else {
        if (typeof (window as any).cordova !== "undefined") {
            console.log("bootstrap device")
            document.addEventListener("deviceready", main, false)
        } else {
            console.log("bootstrap normal")
            main()
        }
    }
}
