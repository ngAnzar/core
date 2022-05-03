import { Injectable, Inject, OnDestroy, Injector, ApplicationRef, ComponentFactoryResolver, ElementRef } from "@angular/core"
import { DOCUMENT } from "@angular/common"
import { DomPortalOutlet } from "@angular/cdk/portal"
import { Observable, share, Subject } from "rxjs"

// import { Renderer } from "../../common.module"
import { Destruct, IDisposable, Destructible } from "../../util"
import "./layer.styl"


@Injectable({ providedIn: "root" })
export class LayerContainer implements OnDestroy {
    public readonly zIndexBegin = 1000000
    private _containers: LayerContainerRef[] = []

    public constructor(
        @Inject(DOCUMENT) protected doc: Document,
        @Inject(Injector) protected injector: Injector,
        @Inject(ApplicationRef) protected appRef: ApplicationRef,
        @Inject(ComponentFactoryResolver) protected cmpResolver: ComponentFactoryResolver) {
    }

    public addLayerContainer(container: LayerContainerRef) {
        this._addContainer(container)
    }

    public getNewOutlet(alwaysOnTop?: boolean): LayerOutletRef {
        const container = new LayerOutletRef(this.cmpResolver, this.appRef, this.injector)
        if (alwaysOnTop != null) {
            container.alwaysOnTop = alwaysOnTop
        }
        this._addContainer(container)
        // const el = this.doc.createElement("div")
        // el.classList.add("nz-layer-container")

        // const portal = new DomPortalOutlet(el, this.cmpResolver, this.appRef, this.injector)
        // const container = new LayerOutletRef(el, portal, () => {
        //     this._removeContainer(container)
        // })
        // this._addContainer(container, alwaysOnTop)
        return container
    }

    // public getCommonContainer(alwaysOnTop?: boolean): LayerContainerRef {
    //     const el = this.doc.createElement("div")
    //     const container = new LayerContainerRef(el, () => {
    //         this._removeContainer(container)
    //     })
    //     this._addContainer(container, alwaysOnTop)
    //     return container
    // }

    public ngOnDestroy() {
        for (const containers of this._containers) {
            containers.dispose()
        }
    }

    protected _addContainer(container: LayerContainerRef) {
        this._containers.push(container)
        this._updateZIndex()
        container.append(this.doc.body)

        container.destruct.on.subscribe(() => {
            this._removeContainer(container)
        })

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
        // TODO: manage opener
        this._containers
            // .sort((a, b) => a.alwaysOnTop ? b.alwaysOnTop ? 0 : 1 : -1)
            .forEach((c, i) => {
                if (!c.skipZIndexManagement) {
                    c.zIndex = this.zIndexBegin + i
                }
            })
    }
}


export abstract class LayerContainerRef extends Destructible {
    public readonly onPropertyChange: Subject<string> = this.destruct.subject(new Subject())

    public set zIndex(val: number) {
        if (this._zIndex !== val) {
            this._zIndex = val
            this.applyZIndex(val)
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

    public skipZIndexManagement: boolean
    private _listeners: { [key: string]: Observable<Event> } = {}

    public on(eventName: string): Observable<Event> {
        if (eventName in this._listeners) {
            return this._listeners[eventName]
        } else {
            return this._listeners[eventName] = new Observable<Event>(subscriber => {
                this.destruct.any(() => {
                    subscriber.complete()
                    subscriber.unsubscribe()
                })
                return this.addEventListener(eventName, event => {
                    subscriber.next(event)
                })
            }).pipe(share())
        }
    }

    public abstract readonly firstElement: HTMLElement
    public abstract append(container: HTMLElement): void
    public abstract insertBefore(target: HTMLElement): void
    protected abstract applyZIndex(index: number): void
    protected abstract addEventListener(eventName: string, handler: (event: Event) => void): () => void
}


export class LayerOutletRef extends LayerContainerRef {
    public readonly firstElement: HTMLElement
    public readonly portal: DomPortalOutlet

    public constructor(cmpResolver: ComponentFactoryResolver, appRef: ApplicationRef, injector: Injector) {
        super()
        this.firstElement = document.createElement("div")
        this.firstElement.classList.add("nz-layer-container")
        this.portal = new DomPortalOutlet(this.firstElement, cmpResolver, appRef, injector)
        this.destruct.element(this.firstElement)
        this.destruct.any(this.portal.dispose.bind(this.portal))
    }

    public append(container: HTMLElement): void {
        container.appendChild(this.firstElement)
    }

    public insertBefore(target: HTMLElement): void {
        target.parentNode.insertBefore(this.firstElement, target)
    }

    protected applyZIndex(index: number): void {
        this.firstElement.style.zIndex = `${index}`
    }

    protected addEventListener(eventName: string, handler: (event: Event) => void): () => void {
        this.firstElement.addEventListener(eventName, handler)
        return () => {
            this.firstElement.removeEventListener(eventName, handler)
        }
    }
}



// export class _LayerContainerRef extends ElementRef<HTMLElement> implements IDisposable {
//     public set zIndex(val: number) {
//         if (this._zIndex !== val) {
//             this._zIndex = val
//             this.nativeElement.style.zIndex = `${val}`
//             this.onPropertyChange.next("zIndex")
//         }
//     }
//     public get zIndex(): number { return this._zIndex }
//     protected _zIndex: number

//     public set alwaysOnTop(val: boolean) {
//         if (this._alwaysOnTop !== val) {
//             this._alwaysOnTop = val
//             this.onPropertyChange.next("alwaysOnTop")
//         }
//     }
//     public get alwaysOnTop(): boolean { return this._alwaysOnTop }
//     protected _alwaysOnTop: boolean = false

//     // public readonly onDestroy: Subject<void> = new Subject()
//     public readonly destruct: Destruct = new Destruct()
//     public readonly onPropertyChange: Subject<string> = this.destruct.subject(new Subject())
//     public skipZIndexManagement: boolean

//     public constructor(el: HTMLElement, destroy: () => void) {
//         super(el)
//         this.destruct.any(destroy)
//         this.destruct.element(el)
//     }

//     public dispose() {
//         this.destruct.run()
//     }
// }


// export class _LayerOutletRef extends LayerContainerRef {
//     public constructor(
//         el: HTMLElement,
//         public readonly portal: DomPortalOutlet,
//         onDestroy: () => void) {
//         super(el, onDestroy)
//     }

//     public dispose() {
//         if (this.portal) {
//             this.portal.dispose()
//             delete (this as any).portal
//         }
//         super.dispose()
//     }
// }
