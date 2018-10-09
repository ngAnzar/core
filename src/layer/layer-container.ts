import { Injectable, Inject, Renderer2, OnDestroy, Injector, ApplicationRef, ComponentFactoryResolver, ElementRef } from "@angular/core"
import { AnimationBuilder } from "@angular/animations"
import { DOCUMENT } from "@angular/platform-browser"
import { DomPortalOutlet } from "@angular/cdk/portal"

import "./layer.styl"
import { fadeAnimation } from "./layer-animations"



// export interface LayerOutlet {
//     portal: DomPortalOutlet
//     el: HTMLElement
//     dispose: () => void
// }


export type BackdropType = "filled" | "empty"


@Injectable()
export class LayerContainer implements OnDestroy {
    private _zIndex = 1000001
    private _backdrops: { [key in BackdropType]?: BackdropRef } = {}
    private _outlets: LayerOutlet[] = []

    public constructor(
        @Inject(DOCUMENT) protected doc: Document,
        @Inject(Injector) protected injector: Injector,
        @Inject(ApplicationRef) protected appRef: ApplicationRef,
        @Inject(ComponentFactoryResolver) protected cmpResolver: ComponentFactoryResolver) {
    }

    public getNewOutlet(): LayerOutlet {
        let el = this.doc.createElement("div")
        el.classList.add("nz-layer-container")
        el.setAttribute("elevation", "10")

        this.doc.body.appendChild(el)
        let portal = new DomPortalOutlet(el, this.cmpResolver, this.appRef, this.injector)
        let res = new LayerOutlet(el, portal, () => {
            let i = this._outlets.indexOf(res)
            if (i !== -1) {
                this._outlets.splice(i, 1)
            }
        })
        res.zIndex = this._zIndex++
        this._outlets.push(res)

        return res
    }

    public getBackdrop(type: BackdropType): BackdropRef {
        if (!this._backdrops[type]) {
            let el = this.doc.createElement("div")
            el.classList.add(`nz-layer-backdrop`)
            el.classList.add(`nz-layer-backdrop-${type}`)
            this._backdrops[type] = new BackdropRef(el, type, () => {
                delete this._backdrops[type]
            })
        }
        return this._backdrops[type]
    }

    public ngOnDestroy() {
        for (let k in this._backdrops) {
            this._backdrops[k as BackdropType].dispose()
        }

        for (let lo of this._outlets) {
            lo.dispose()
        }
    }
}


export class LayerOutlet extends ElementRef<HTMLElement> {
    public get zIndex(): number { return parseInt(this.nativeElement.style.zIndex, 10) }
    public set zIndex(val: number) { this.nativeElement.style.zIndex = `${val}` }

    public constructor(
        el: HTMLElement,
        public readonly portal: DomPortalOutlet,
        private onDestroy: () => void) {
        super(el)
    }

    public dispose() {
        if (this.onDestroy) {
            this.onDestroy()
            delete this.onDestroy

            this.portal.dispose()
            if (this.nativeElement.parentNode) {
                this.nativeElement.parentNode.removeChild(this.nativeElement)
            }
        }
    }
}


export class BackdropRef extends ElementRef<HTMLElement> {
    public readonly isVisible: boolean

    public constructor(
        el: HTMLElement,
        public readonly type: BackdropType,
        private onDestroy: () => void) {
        super(el)
    }

    public show(under: LayerOutlet, animationBuilder: AnimationBuilder): Promise<void> {
        let c = under.nativeElement.parentElement
        this.nativeElement.style.zIndex = `${under.zIndex}`
        c.insertBefore(this.nativeElement, under.nativeElement)

        if (!this.isVisible) {
            (this as any).isVisible = true

            this.nativeElement.style.display = "block"

            return new Promise(resolve => {
                let animationFactory = animationBuilder.build(fadeAnimation.show)
                let player = animationFactory.create(this.nativeElement)
                player.onDone(() => {
                    // this.nativeElement.style.opacity = "1"
                    player.destroy()
                    resolve()
                })
                player.play()
            })
        }

        return Promise.resolve()
    }

    public hide(animationBuilder: AnimationBuilder): Promise<void> {
        if (this.isVisible) {
            (this as any).isVisible = false

            return new Promise(resolve => {
                let animationFactory = animationBuilder.build(fadeAnimation.hide)
                let player = animationFactory.create(this.nativeElement)
                player.onDone(() => {
                    this.nativeElement.style.display = "none"
                    player.destroy()
                    resolve()
                })
                player.play()
            })
        }
        return Promise.resolve()
    }

    public dispose() {
        if (this.onDestroy) {
            this.onDestroy()

            if (this.nativeElement.parentNode) {
                this.nativeElement.parentNode.removeChild(this.nativeElement)
            }
        }
    }
}
