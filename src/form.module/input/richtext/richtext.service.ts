import { Injectable, InjectionToken, Inject, Optional } from "@angular/core"
import { ComponentType } from "@angular/cdk/portal"

import { RichtextAcProvider } from "./richtext-ac.component"


export interface RichtextStaticFactory {
    readonly id: string
    readonly component: any
}


export const RICHTEXT_COMPONENT = new InjectionToken<RichtextStaticFactory>("nzRichtextComponent")
// export const RICHTEXT_COMPONENT_PARAMS = new InjectionToken<RichtextStaticFactory>("nzRichtextComponentParams")
export const RICHTEXT_AUTO_COMPLETE = new InjectionToken<RichtextStaticFactory>("nzRichtextAutoComplete")


export class RichtextService {
    public constructor(
        @Inject(RICHTEXT_COMPONENT) @Optional() protected readonly components: RichtextStaticFactory[],
        @Inject(RICHTEXT_AUTO_COMPLETE) @Optional() protected readonly acProviders: RichtextAcProvider[]) {
    }

    public getAcProviders(text: string): RichtextAcProvider[] {
        return this.acProviders.filter(ac => {
            return ac.trigger.test(text)
        })
    }

    public getComponentType(name: string): ComponentType<any> | null {
        for (const cmp of this.components) {
            if (cmp.id === name) {
                return cmp.component
            }
        }
        return null
    }
}


// export type RichtextComponentParamsData = { [key: string]: string | number | boolean | Date }


// export class RichtextComponentParams {
//     public constructor(
//         public readonly data: RichtextComponentParamsData,

//     ) {

//     }

//     public commit() {

//     }
// }
