import { Injectable, InjectionToken, Inject, Optional } from "@angular/core"


export interface RichtextStaticFactory {
    readonly id: string
    readonly component: any
}


export const RICHTEXT_COMPONENT = new InjectionToken<RichtextStaticFactory>("nzRichtextComponent")


@Injectable({ providedIn: "root" })
export class RichtextService {
    public constructor(
        @Inject(RICHTEXT_COMPONENT) @Optional() protected readonly components: RichtextStaticFactory[]) {
        console.log({ components })
    }
}
