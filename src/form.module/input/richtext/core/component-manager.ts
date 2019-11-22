import { InjectionToken, Inject, Optional, Injector, ComponentFactoryResolver, ApplicationRef, ViewContainerRef, ElementRef } from "@angular/core"
import { ComponentType, DomPortalOutlet, ComponentPortal } from "@angular/cdk/portal"
import { Subject, Observable, of } from "rxjs"
import { map, filter, tap } from "rxjs/operators"

import { IDisposable } from "../../../../util"
import { LayerService, DeleteConfirmDialogComponent, DropdownLayer, LAYER_MESSAGE, DialogEvent } from "../../../../layer.module"
import { uuidv4, removeNode } from "../util"
import { RichtextComponentRef, RichtextComponent, RichtextComponentParams } from "./component-ref"
import { RichtextElement } from "./richtext-el"
import { RichtextStream } from "./richtext-stream"


export interface RichtextComponentProvider {
    readonly id: string
    readonly component: ComponentType<RichtextComponent>
}


export const RICHTEXT_COMPONENT = new InjectionToken<RichtextComponentProvider>("nzRichtextComponent")
export const RICHTEXT_CMP_PORTAL_EL = new RichtextElement("nz-richtext-portal")


export class ComponentManager implements IDisposable {
    private _instances: { [key: string]: RichtextComponentRef<RichtextComponent> } = {}

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(RICHTEXT_COMPONENT) @Optional() protected readonly providers: RichtextComponentProvider[],
        @Inject(Injector) private readonly injector: Injector,
        @Inject(ComponentFactoryResolver) protected readonly cfr: ComponentFactoryResolver,
        @Inject(ApplicationRef) protected readonly appRef: ApplicationRef,
        @Inject(ViewContainerRef) protected readonly vcr: ViewContainerRef,
        @Inject(RichtextStream) private readonly stream: RichtextStream,
        @Inject(LayerService) private readonly layerSvc: LayerService) {
        stream.addElementHandler(RICHTEXT_CMP_PORTAL_EL, cleanupPortalEl)
    }

    public getComponentType(name: string): ComponentType<RichtextComponent> | null {
        for (const cmp of this.providers) {
            if (cmp.id === name) {
                return cmp.component
            }
        }
        return null
    }

    public createPortalEl(type: string, params: RichtextComponentParams): HTMLElement {
        let node = RICHTEXT_CMP_PORTAL_EL.create()
        node.setAttribute("contenteditable", "false")
        node.setAttribute("spellcheck", "false")
        node.setAttribute("id", uuidv4())
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
            if (!id || !id.length) {
                throw new Error("Missing portal element id")
            }
            if (this._instances[id]) {
                return this._instances[id]
            } else {
                return this._instances[id] = this._createRef(portalEl)
            }
        }
    }

    public handleKeyDown(event: KeyboardEvent, portalEl: HTMLElement) {
        event.preventDefault()
    }

    private _removing: boolean = false
    public remove(portalEl: HTMLElement): Observable<boolean> {
        if (this._removing) {
            return of(false)
        }
        this._removing = true
        portalEl.setAttribute("focused", "true")
        return this.deleteConfirm(portalEl).pipe(
            tap(result => {
                if (result) {
                    removeNode(portalEl)
                    this.stream.emitChanges()
                } else {
                    portalEl.removeAttribute("focused")
                }
                this._removing = false
            })
        )
    }

    private _createRef(portalEl: HTMLElement): RichtextComponentRef<RichtextComponent> {
        portalEl.setAttribute("contenteditable", "false")
        portalEl.setAttribute("spellcheck", "false")

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
        ref.component.changeDetectorRef.detectChanges()
        this.stream.emitChanges()
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
        this.stream.emitChanges()
    }

    private onRefDispose = (ref: RichtextComponentRef<RichtextComponent>) => {
        delete this._instances[ref.el.getAttribute("id")]
        this.stream.emitChanges()
    }

    private deleteConfirm(portalEl: HTMLElement): Observable<boolean> {
        const behavior = new DropdownLayer({
            position: {
                anchor: {
                    ref: portalEl,
                    align: "bottom center",
                    margin: 4
                },
                align: "top center"
            },
            backdrop: { hideOnClick: false, type: "filled" },
            closeable: true,
            trapFocus: true,
            elevation: 10,
            rounded: 3
        })
        const ref = this.layerSvc.createFromComponent(DeleteConfirmDialogComponent, behavior, null, [
            { provide: LAYER_MESSAGE, useValue: "Biztosan törlöd?" }
        ])
        ref.show()
        return ref.output.pipe(
            filter(event => event.type === "button"),
            map((event: DialogEvent) => event.button === "delete")
        )
    }
}


function cleanupPortalEl(el: HTMLElement) {
    el.innerHTML = ""
}
