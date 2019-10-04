import { InjectionToken, Inject, Optional, Injector, ComponentFactoryResolver, ApplicationRef, ViewContainerRef, ElementRef } from "@angular/core"
import { ComponentType, DomPortalOutlet, ComponentPortal } from "@angular/cdk/portal"
import { Subject } from "rxjs"

import { IDisposable } from "../../../../util"
import { uuidv4 } from "../util"
import { RichtextComponentRef, RichtextComponent, RichtextComponentParams } from "./component-ref"
import { RichtextElement } from "./richtext-stream"


export interface RichtextComponentProvider {
    readonly id: string
    readonly component: ComponentType<RichtextComponent>
}


export const RICHTEXT_COMPONENT = new InjectionToken<RichtextComponentProvider>("nzRichtextComponent")
export const RICHTEXT_CMP_PORTAL_EL = new RichtextElement("nz-richtext-portal")

export class ComponentManager implements IDisposable {
    public readonly changes = new Subject()

    private _instances: { [key: string]: RichtextComponentRef<RichtextComponent> } = {}

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(RICHTEXT_COMPONENT) @Optional() protected readonly providers: RichtextComponentProvider[],
        @Inject(Injector) private readonly injector: Injector,
        @Inject(ComponentFactoryResolver) protected readonly cfr: ComponentFactoryResolver,
        @Inject(ApplicationRef) protected readonly appRef: ApplicationRef,
        @Inject(ViewContainerRef) protected readonly vcr: ViewContainerRef) {
    }

    public getComponentType(name: string): ComponentType<RichtextComponent> | null {
        for (const cmp of this.providers) {
            if (cmp.id === name) {
                return cmp.component
            }
        }
        return null
    }

    public createPortalEl(id: string, type: string, params: RichtextComponentParams): HTMLElement {
        let node = RICHTEXT_CMP_PORTAL_EL.create()
        node.setAttribute("contenteditable", "false")
        node.setAttribute("id", id)
        node.setAttribute("component", type)
        node.setAttribute("params", this.encodeParams(params))
        return node
    }

    public getRef(id: string | HTMLElement): RichtextComponentRef<RichtextComponent> | null {
        if (typeof id === "string") {
            if (this._instances[id]) {
                return this._instances[id]
            } else {
                const portalEl = this.el.nativeElement.querySelector(`[id="${id}"]`) as HTMLElement
                if (portalEl) {
                    return this._instances[id] = this._createRef(portalEl)
                }
            }
        } else {
            const portalEl = id
            id = portalEl.getAttribute("id")
            if (this._instances[id]) {
                return this._instances[id]
            } else {
                return this._instances[id] = this._createRef(portalEl)
            }
        }
    }

    private _createRef(portalEl: HTMLElement): RichtextComponentRef<RichtextComponent> {
        const id = portalEl.getAttribute("id") || uuidv4()
        portalEl.setAttribute("id", id)

        const cmpId = portalEl.getAttribute("component")
        const cmpType = this.getComponentType(cmpId)
        if (!cmpType) {
            throw new Error(`Runtime error: missing richtext component: ${cmpId}`)
        }

        let params = portalEl.getAttribute("params") as any
        if (params) {
            params = this.decodeParams(params)
        } else {
            params = null
        }

        const ref = new RichtextComponentRef(portalEl, params, this.onParamsChanged, this.onRefDispose) as { -readonly [K in keyof RichtextComponentRef]: RichtextComponentRef[K] }
        const injector = Injector.create([
            { provide: RichtextComponentRef, useValue: ref }
        ], this.injector)

        ref.outlet = new DomPortalOutlet(portalEl, this.cfr, this.appRef, injector)
        ref.portal = new ComponentPortal(cmpType, this.vcr, injector, this.cfr)
        ref.component = ref.outlet.attachComponentPortal(ref.portal)
        ref.component.changeDetectorRef.markForCheck()
        return ref as any
    }

    public encodeParams(params: RichtextComponentParams): string {
        return encodeURIComponent(JSON.stringify(params))
    }

    public decodeParams(params: string): RichtextComponentParams {
        return JSON.parse(decodeURIComponent(params))
    }

    public dispose() {
        for (const k in this._instances) {
            const cmp = this._instances[k]
            cmp.dispose()
        }
        delete this._instances
    }

    private onParamsChanged = () => {
        this.changes.next()
    }

    private onRefDispose = (ref: RichtextComponentRef<RichtextComponent>) => {
        delete this._instances[ref.el.getAttribute("id")]
    }
}



