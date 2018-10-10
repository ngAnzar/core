import { AnimationBuilder, AnimationOptions, AnimationPlayer, AnimationMetadata } from "@angular/animations"

import { LevitateRef } from "../levitate/levitate-ref"
import { LayerOptions, DropdownLayerOptions } from "./layer-options"
import { LayerRef } from "./layer-ref"
import { fallAnimation, ddAnimation } from "./layer-animations"
import { BackdropRef } from "./layer-container"


export abstract class LayerBehavior<O extends LayerOptions = LayerOptions> {
    public readonly levitate: LevitateRef

    protected readonly animationBuilder: AnimationBuilder
    protected currentAnimation: AnimationPlayer
    protected backdrop: BackdropRef

    public constructor(public readonly options: O = {} as any) {
    }

    public initShow(layer: LayerRef): void {
        if (this.options.minWidth) {
            layer.container.style.minWidth = `${this.options.minWidth}px`
        }
        if (this.options.minHeight) {
            layer.container.style.minHeight = `${this.options.minHeight}px`
        }
        if (this.options.elevation) {
            layer.container.setAttribute("elevation", String(this.options.elevation))
        }
    }

    public animateShow(layer: LayerRef): Promise<void> {
        layer.container.style.visibility = "visible"
        return Promise.resolve()
    }

    public initHide(layer: LayerRef): void {

    }

    public animateHide(layer: LayerRef): Promise<void> {
        layer.container.style.visibility = "hidden"
        return Promise.resolve()
    }

    public canClose(layer: LayerRef): Promise<boolean> {
        return Promise.resolve(true)
    }

    protected playAnimation(layer: LayerRef, animation: AnimationMetadata[], options?: AnimationOptions): Promise<void> {
        if (this.currentAnimation) {
            this.currentAnimation.finish()
            this.currentAnimation = null
        }

        return new Promise((resolve, reject) => {
            let animationFactory = this.animationBuilder.build(animation)
            let player = this.currentAnimation = animationFactory.create(layer.container, options)

            player.onDestroy(() => {
                // maybe bug, but this functions is not invoked...
                this.currentAnimation = null
            })

            player.onDone(() => {
                player.destroy()
                this.currentAnimation = null
                resolve()
            })

            player.play()
        })
    }

    // TODO: refactor a backdrop kezelje az eseményeket
    private _backdropListeners: any[] = []
    public showBackdrop(layer: LayerRef): Promise<void> {
        if (this.options.backdrop) {
            if (!this.backdrop || !this.backdrop.nativeElement) {
                this.backdrop = layer.service.container.getBackdrop(this.options.backdrop.type)
            }
            if (this.options.backdrop.hideOnClick) {
                let listener = this.onBackdropClick.bind(this, layer)
                this._backdropListeners.push(listener)
                this.backdrop.nativeElement.addEventListener("click", listener)
            }
            return this.backdrop.show(layer.outlet, this.animationBuilder)
        }
        return Promise.resolve()
    }

    public hideBackdrop(layer: LayerRef): Promise<void> {
        if (this.backdrop) {
            if (this.backdrop.nativeElement) {
                for (let l of this._backdropListeners) {
                    this.backdrop.nativeElement.removeEventListener("click", l)
                }
            }
            return this.backdrop.hide(this.animationBuilder)
        }
        return Promise.resolve()
    }

    protected onBackdropClick(layer: LayerRef) {
        if (this.options.backdrop) {
            if (this.options.backdrop.hideOnClick) {
                layer.hide()
            }
        }
    }

    public dispose(): void {
        this.levitate.dispose()
        if (this.backdrop && this.backdrop.nativeElement) {
            for (let l of this._backdropListeners) {
                this.backdrop.nativeElement.removeEventListener("click", l)
            }
        }
    }
}


export class ModalLayer extends LayerBehavior {
    public constructor(options: LayerOptions = {} as any) {
        super(options)
        if (!this.options.backdrop) {
            this.options.backdrop = { type: "filled", hideOnClick: false }
        } else {
            this.options.backdrop.hideOnClick = false
        }

    }

    public animateShow(layer: LayerRef): Promise<void> {
        return this.playAnimation(layer, fallAnimation.show)
            .then(() => super.animateShow(layer))
    }

    public animateHide(layer: LayerRef): Promise<void> {
        return this.playAnimation(layer, fallAnimation.hide)
            .then(() => super.animateHide(layer))
    }
}

export class MenuLayer extends LayerBehavior {

}

export class TooltipLayer extends LayerBehavior {

}


export class DropdownLayer extends LayerBehavior<DropdownLayerOptions> {
    public animateShow(layer: LayerRef): Promise<void> {
        // if (this.options.initialWidth) {
        //     layer.container.style.width = `${this.options.initialWidth}px`
        // }
        // if (this.options.initialHeight) {
        //     layer.container.style.height = `${this.options.initialHeight}px`
        // }
        let params = {
            initialWidth: `${this.options.initialWidth || 0}px`,
            initialHeight: `${this.options.initialHeight || 0}px`,
            finalWidth: `${layer.container.offsetWidth}px`,
            finalHeight: `${layer.container.offsetHeight}px`
        }
        return this.playAnimation(layer, ddAnimation.show, { params })
            .then(() => super.animateShow(layer))
    }

    public animateHide(layer: LayerRef): Promise<void> {
        return this.playAnimation(layer, ddAnimation.hide)
            .then(() => super.animateHide(layer))
    }
}
