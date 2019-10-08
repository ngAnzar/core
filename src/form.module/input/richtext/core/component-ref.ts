import { ComponentRef } from "@angular/core"
import { DomPortalOutlet, ComponentPortal } from "@angular/cdk/portal"
import { Subject } from "rxjs"


import { IDisposable } from "../../../../util"
import { removeNode } from "../util"


export type RichtextComponentParams = { [key: string]: string | number | boolean | Date }


export abstract class RichtextComponent {

}


export class RichtextComponentRef<T = RichtextComponent> implements IDisposable {
    public readonly component: ComponentRef<T>
    public readonly outlet: DomPortalOutlet
    public readonly portal: ComponentPortal<T>
    public readonly paramsChange = new Subject<RichtextComponentParams>()


    public constructor(
        public readonly el: HTMLElement,
        public readonly params: RichtextComponentParams,
        private readonly onParamsChanged: () => void,
        private readonly onDispose: (ref: RichtextComponentRef<T>) => void) {
    }

    public updateParams(params: RichtextComponentParams) {
        Object.assign(this.params, params)
        this.el.setAttribute("params", encodeURIComponent(JSON.stringify(this.params)))
        this.paramsChange.next(this.params)
        this.component.changeDetectorRef.markForCheck()
        this.onParamsChanged()
    }

    public replaceParams(params: RichtextComponentParams) {
        (this as any).params = params
        this.el.setAttribute("params", encodeURIComponent(JSON.stringify(this.params)))
        this.paramsChange.next(this.params)
        this.component.changeDetectorRef.markForCheck()
        this.onParamsChanged()
    }

    public dispose() {
        this.onDispose(this)
        this.paramsChange.complete()
        delete (this as any).paramsChange
        if (this.outlet) {
            this.outlet.detach()
            delete (this as any).outlet
        }
        if (this.component) {
            this.component.destroy()
            delete (this as any).component
        }
        if (document.contains(this.el)) {
            removeNode(this.el)
        }
        delete (this as any).el
        delete (this as any).portal
        delete (this as any).params
    }
}
