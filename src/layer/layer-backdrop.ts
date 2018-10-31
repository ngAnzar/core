import { AnimationBuilder } from "@angular/animations"

import { MaskRef } from "../mask.module"
import { Subscriptions } from "../util"

import { LayerContainerRef } from "./layer-container"
import { fadeAnimation } from "./layer-animations"
import { LayerRef } from "./layer-ref"


export class LayerBackdropRef {
    public readonly isVisible: boolean

    public set currentLayer(val: LayerRef) {
        if (this._visibleUnder !== val) {
            this._visibleUnder = val
            if (val) {
                let idx = this.attached.indexOf(val)
                if (idx !== this.attached.length - 1) {
                    if (idx !== -1) {
                        this.attached.splice(idx, 1)
                        this.attached.push(val)
                    } else {
                        this.attached.push(val)
                    }
                }

                this.show(val.outlet)
            }
        }
    }
    public get currentLayer(): LayerRef { return this._visibleUnder }

    protected _visibleUnder: LayerRef
    protected attached: LayerRef[] = []
    protected s = new Subscriptions()

    public constructor(
        public readonly mask: MaskRef,
        public readonly animationBuilder: AnimationBuilder) {

        mask.container.nativeElement.addEventListener("click", this.onClick)
    }

    public attach(layer: LayerRef) {
        let s = this.s.add(layer.output).subscribe(event => {
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
    }

    public show(under: LayerContainerRef): Promise<void> {
        let c = under.nativeElement.parentElement
        this.mask.container.zIndex = under.zIndex
        c.insertBefore(this.mask.container.nativeElement, under.nativeElement)

        if (!this.isVisible) {
            (this as any).isVisible = true

            this.mask.container.nativeElement.style.display = "block"

            return new Promise(resolve => {
                let animationFactory = this.animationBuilder.build(fadeAnimation.show)
                let player = animationFactory.create(this.mask.container.nativeElement)
                player.onDone(() => {
                    // this.mask.container.nativeElement.style.opacity = "1"
                    player.destroy()
                    resolve()
                })
                player.play()
            })
        }

        return Promise.resolve()
    }

    public hide(): Promise<void> {
        if (this.isVisible) {
            (this as any).isVisible = false

            return new Promise(resolve => {
                let animationFactory = this.animationBuilder.build(fadeAnimation.hide)
                let player = animationFactory.create(this.mask.container.nativeElement)
                player.onDone(() => {
                    this.mask.container.nativeElement.style.display = "none"
                    player.destroy()
                    resolve()
                })
                player.play()
            })
        }
        return Promise.resolve()
    }

    public dispose() {
        if (this.mask) {
            this.s.unsubscribe()
            this.mask.container.nativeElement.removeEventListener("click", this.onClick)
            this.mask.dispose()
            delete (this as any).mask
            delete (this as any).animationBuilder
        }
    }

    protected onClick = (event: MouseEvent) => {
        let options = this.currentLayer.behavior.options
        if (options.backdrop && options.backdrop.hideOnClick === true) {
            this.currentLayer.close()
        }
    }
}
