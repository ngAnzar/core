import { Injectable, Inject, Renderer2, OnDestroy, Injector, ApplicationRef, ComponentFactoryResolver, ElementRef } from "@angular/core"
import { AnimationBuilder } from "@angular/animations"
import { DOCUMENT } from "@angular/platform-browser"
import { DomPortalOutlet } from "@angular/cdk/portal"
import { Subject } from "rxjs"


import "./layer.styl"


@Injectable()
export class LayerContainer implements OnDestroy {
    private _zIndex = 1000001
    private _containers: LayerContainerRef[] = []

    public constructor(
        @Inject(DOCUMENT) protected doc: Document,
        @Inject(Injector) protected injector: Injector,
        @Inject(ApplicationRef) protected appRef: ApplicationRef,
        @Inject(ComponentFactoryResolver) protected cmpResolver: ComponentFactoryResolver) {
    }

    public getNewOutlet(): LayerOutletRef {
        const el = this.doc.createElement("div")
        el.classList.add("nz-layer-container")

        this.doc.body.appendChild(el)
        const portal = new DomPortalOutlet(el, this.cmpResolver, this.appRef, this.injector)
        const res = new LayerOutletRef(el, portal, () => {
            const i = this._containers.indexOf(res)
            if (i !== -1) {
                this._containers.splice(i, 1)
            }
        })
        res.zIndex = this._zIndex++
        this._containers.push(res)

        return res
    }

    public getCommonContainer(): LayerContainerRef {
        const el = this.doc.createElement("div")
        const container = new LayerContainerRef(el, () => {
            const i = this._containers.indexOf(container)
            if (i !== -1) {
                this._containers.splice(i, 1)
            }
        })
        container.zIndex = this._zIndex++
        this.doc.body.appendChild(el)
        this._containers.push(container)
        return container
    }

    public ngOnDestroy() {
        for (const containers of this._containers) {
            containers.dispose()
        }
    }
}


export class LayerContainerRef extends ElementRef<HTMLElement> {
    public get zIndex(): number { return parseInt(this.nativeElement.style.zIndex, 10) }
    public set zIndex(val: number) { this.nativeElement.style.zIndex = `${val}` }

    public readonly onDestroy: Subject<void> = new Subject()

    public constructor(el: HTMLElement, private _onDestroy: () => void) {
        super(el)
    }

    public dispose() {
        if (this._onDestroy) {
            this._onDestroy()
            delete this._onDestroy
        }

        if (this.nativeElement.parentNode) {
            this.nativeElement.parentNode.removeChild(this.nativeElement)
        }
        this.onDestroy.next()
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
