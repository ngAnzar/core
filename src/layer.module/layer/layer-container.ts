import { Injectable, Inject, Renderer2, OnDestroy, Injector, ApplicationRef, ComponentFactoryResolver, ElementRef } from "@angular/core"
import { AnimationBuilder } from "@angular/animations"
import { DOCUMENT } from "@angular/platform-browser"
import { DomPortalOutlet } from "@angular/cdk/portal"
import { Subject } from "rxjs"

import { Destruct, IDisposable } from "../util"
import "./layer.styl"


@Injectable()
export class LayerContainer implements OnDestroy {
    public readonly zIndexBegin = 1000000
    private _containers: LayerContainerRef[] = []

    public constructor(
        @Inject(DOCUMENT) protected doc: Document,
        @Inject(Injector) protected injector: Injector,
        @Inject(ApplicationRef) protected appRef: ApplicationRef,
        @Inject(ComponentFactoryResolver) protected cmpResolver: ComponentFactoryResolver) {
    }

    public getNewOutlet(alwaysOnTop?: boolean): LayerOutletRef {
        const el = this.doc.createElement("div")
        el.classList.add("nz-layer-container")

        const portal = new DomPortalOutlet(el, this.cmpResolver, this.appRef, this.injector)
        const container = new LayerOutletRef(el, portal, () => {
            this._removeContainer(container)
        })
        this._addContainer(container, alwaysOnTop)
        return container
    }

    public getCommonContainer(alwaysOnTop?: boolean): LayerContainerRef {
        const el = this.doc.createElement("div")
        const container = new LayerContainerRef(el, () => {
            this._removeContainer(container)
        })
        this._addContainer(container, alwaysOnTop)
        return container
    }

    public ngOnDestroy() {
        for (const containers of this._containers) {
            containers.dispose()
        }
    }

    protected _addContainer(container: LayerContainerRef, alwaysOnTop: boolean) {
        if (typeof alwaysOnTop === "boolean") {
            container.alwaysOnTop = alwaysOnTop
        }

        this._containers.push(container)
        this._updateZIndex()
        this.doc.body.appendChild(container.nativeElement)

        container.onPropertyChange.subscribe(prop => {
            if (prop === "alwaysOnTop") {
                this._updateZIndex()
            }
        })
    }

    protected _removeContainer(container: LayerContainerRef) {
        const i = this._containers.indexOf(container)
        if (i !== -1) {
            this._containers.splice(i, 1)
        }
    }

    protected _updateZIndex() {
        this._containers
            .sort((a, b) => a.alwaysOnTop ? b.alwaysOnTop ? 0 : 1 : -1)
            .forEach((c, i) => {
                if (!c.skipZIndexManagement) {
                    c.zIndex = this.zIndexBegin + i
                }
            })
    }
}


export class LayerContainerRef extends ElementRef<HTMLElement> implements IDisposable {
    public set zIndex(val: number) {
        if (this._zIndex !== val) {
            this._zIndex = val
            this.nativeElement.style.zIndex = `${val}`
            this.onPropertyChange.next("zIndex")
        }
    }
    public get zIndex(): number { return this._zIndex }
    protected _zIndex: number

    public set alwaysOnTop(val: boolean) {
        if (this._alwaysOnTop !== val) {
            this._alwaysOnTop = val
            this.onPropertyChange.next("alwaysOnTop")
        }
    }
    public get alwaysOnTop(): boolean { return this._alwaysOnTop }
    protected _alwaysOnTop: boolean = false

    // public readonly onDestroy: Subject<void> = new Subject()
    public readonly destruct: Destruct = new Destruct()
    public readonly onPropertyChange: Subject<string> = this.destruct.subject(new Subject())
    public skipZIndexManagement: boolean

    public constructor(el: HTMLElement, destroy: () => void) {
        super(el)
        this.destruct.any(destroy)
        this.destruct.element(el)
    }

    public dispose() {
        this.destruct.run()
    }
}


export class LayerOutletRef extends LayerContainerRef {
    public constructor(
        el: HTMLElement,
        public readonly portal: DomPortalOutlet,
        onDestroy: () => void) {
        super(el, onDestroy)
    }

    public dispose() {
        if (this.portal) {
            this.portal.dispose()
            delete (this as any).portal
        }
        super.dispose()
    }
}
