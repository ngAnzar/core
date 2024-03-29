import { AnimationBuilder } from "@angular/animations"

import { MaskRef } from "../mask/mask-ref"
import { Destruct, IDisposable } from "../../util"

import { LayerContainerRef } from "./layer-container"
import { fadeAnimation } from "./layer-animations"
import { LayerRef } from "./layer-ref"


export class LayerBackdropRef implements IDisposable {
    public readonly isVisible: boolean

    public set currentLayer(val: LayerRef) {
        if (this._visibleUnder !== val) {
            this._visibleUnder = val
            if (val) {
                let idx = this.attached.indexOf(val)
                if (idx === -1) {
                    this.attached.push(val)
                } else if (idx !== this.attached.length - 1) {
                    this.attached.splice(idx, 1)
                    this.attached.push(val)
                }
                this.show(val.outlet)
            }
        }
    }
    public get currentLayer(): LayerRef { return this._visibleUnder }

    protected _visibleUnder: LayerRef
    protected attached: LayerRef[] = []

    public readonly destruct = new Destruct(() => {
        delete (this as any).mask
        delete (this as any).animationBuilder
        delete (this as any).attached
        delete (this as any)._visibleUnder
    })

    public constructor(
        public readonly mask: MaskRef) {
        mask.skipZIndexManagement = true
        mask.on("click").subscribe(this.onClick)

        // TODO
        // mask.container.nativeElement.addEventListener("click", this.onClick)
        // this.destruct.any(() => {
        //     mask.container.nativeElement.removeEventListener("click", this.onClick)
        // })

        this.destruct.disposable(mask)
    }

    public attach(layer: LayerRef) {
        this.destruct.subscription(layer.output).subscribe(event => {
            if (event.type === "showing") {
                this.currentLayer = layer
            } else if (event.type === "hiding") {
                let idx = this.attached.indexOf(layer)
                if (idx !== -1) {
                    this.attached.splice(idx, 1)
                }

                if (this.attached.length === 0) {
                    this.hide().then(() => this.dispose())
                } else {
                    this.currentLayer = this.attached[this.attached.length - 1]
                }
            }
        })

        this.destruct.subscription(layer.outlet.onPropertyChange).subscribe(prop => {
            if (prop === "zIndex" && this._visibleUnder === layer) {
                this._updateZIndex(layer.outlet)
            }
        })
    }

    public show(under: LayerContainerRef): Promise<void> {
        this._updateZIndex(under)
        // const animation = this.animationBuilder.build()
        return this.mask.show(fadeAnimation.show)

        // if (!this.isVisible) {
        //     (this as any).isVisible = true
        //     const el = this.mask.container.nativeElement
        //     el.style.pointerEvents = "auto"
        //     el.style.touchAction = "auto"
        //     el.style.display = "block"

        //     return new Promise(resolve => {
        //         let animationFactory = this.animationBuilder.build(fadeAnimation.show)
        //         let player = animationFactory.create(el)
        //         player.onDone(() => {
        //             // el.style.opacity = "1"
        //             player.destroy()
        //             resolve()
        //         })
        //         player.play()
        //     })
        // }

        // return Promise.resolve()
    }

    public hide(): Promise<void> {
        // const animation = this.animationBuilder.build(fadeAnimation.hide)
        return this.mask.hide(fadeAnimation.hide)
        // if (this.isVisible) {
        //     (this as any).isVisible = false
        //     // TODO
        //     // const el = this.mask.container.nativeElement
        //     // el.style.pointerEvents = "none"
        //     // el.style.touchAction = "none"

        //     return new Promise(resolve => {
        //         let animationFactory = this.animationBuilder.build(fadeAnimation.hide)
        //         let player = animationFactory.create(el)
        //         player.onDone(() => {
        //             el.style.display = "none"
        //             player.destroy()
        //             resolve()
        //         })
        //         player.play()
        //     })
        // }
        // return Promise.resolve()
    }

    public dispose() {
        this.destruct.run()
    }

    protected onClick = (event: MouseEvent) => {
        if (this.currentLayer.behavior) {
            let options = this.currentLayer.behavior.options
            if (options.backdrop && options.backdrop.hideOnClick === true) {
                this.currentLayer.close()
            }
        } else {
            this.hide()
        }
    }

    protected _updateZIndex(under: LayerContainerRef) {
        this.mask.zIndex = under.zIndex
        this.mask.insertBefore(under.firstElement)
        // TODO
        // let parentEl = under.nativeElement.parentElement
        // this.mask.container.zIndex = under.zIndex
        // parentEl.insertBefore(this.mask.container.nativeElement, under.nativeElement)
    }
}
