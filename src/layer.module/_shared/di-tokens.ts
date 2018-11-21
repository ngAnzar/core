import { InjectionToken, StaticProvider, TemplateRef, Injector } from "@angular/core"
import { Portal, ComponentType, ComponentPortal, TemplatePortal } from "@angular/cdk/portal"


import { ButtonList } from "./buttons"


export const LAYER_TITLE = new InjectionToken<string>("layer.module/title")
export const LAYER_MESSAGE = new InjectionToken<string>("layer.module/message")
export const LAYER_BUTTONS = new InjectionToken<string>("layer.module/buttons")
export const LAYER_CONTENT = new InjectionToken<Portal<any>>("layer.module/content")
export const LAYER_OPTIONS = new InjectionToken<any>("layer.module/options")
// export const LAYER_TITLE = new InjectionToken<string>("layer.module/title")


export function getProviders(value: {
    title?: string,
    message?: string,
    buttons?: ButtonList,
    options?: any,
    content?: TemplateRef<any> | ComponentType<any>
}): StaticProvider[] {
    const result: StaticProvider[] = []

    if (value.title) {
        result.push({ provide: LAYER_TITLE, useValue: value.title })
    }

    if (value.message) {
        result.push({ provide: LAYER_MESSAGE, useValue: value.message })
    }

    if (value.buttons) {
        result.push({ provide: LAYER_BUTTONS, useValue: value.buttons })
    }

    if (value.options) {
        result.push({ provide: LAYER_OPTIONS, useValue: value.options })
    }

    if (value.content) {
        result.push({
            provide: LAYER_CONTENT,
            deps: [Injector],
            useFactory: value.content instanceof TemplateRef
                ? (injector: Injector) => {
                    return new TemplatePortal(value.content as TemplateRef<any>, null, injector)
                }
                : (injector: Injector) => {
                    return new ComponentPortal(value.content as ComponentType<any>, null, injector)
                }
        })
    }

    return result
}
