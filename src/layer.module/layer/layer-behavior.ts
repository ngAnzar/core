import { AnimationBuilder, AnimationOptions, AnimationPlayer, AnimationMetadata } from "@angular/animations"
import { take } from "rxjs/operators"

import { IDisposable } from "../../util"
import { LevitateRef } from "../levitate/levitate-ref"
import { LayerOptions, DropdownLayerOptions, ClosingGuarded } from "./layer-options"
import { LayerRef, ComponentLayerRef } from "./layer-ref"
import { fallAnimation, ddAnimation } from "./layer-animations"


export abstract class LayerBehavior<O extends LayerOptions = LayerOptions> implements IDisposable {
    public readonly levitate: LevitateRef

    protected readonly animationBuilder: AnimationBuilder
    protected currentAnimation: AnimationPlayer

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
        if (this.options.rounded) {
            layer.container.style.borderRadius = `${this.options.rounded}px`
            layer.container.style.overflow = "hidden"
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
        if (layer instanceof ComponentLayerRef) {
            const cmp = layer.component.instance as ClosingGuarded
            if (cmp.canClose) {
                return new Promise(resolve => {
                    cmp.canClose(layer).pipe(take(1)).subscribe(resolve)
                })
            }
        }

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

    public dispose(): void {
        this.levitate.dispose()
    }
}


export class ModalLayer extends LayerBehavior {
    public constructor(options: LayerOptions = {} as any) {
        super(options)
        if (!this.options.backdrop) {
            this.options.backdrop = { type: "filled", hideOnClick: false }
        } else {
            // this.options.backdrop.hideOnClick = false
        }

        if (options.closeable == null) {
            options.closeable = true
        }

        if (options.trapFocus == null) {
            options.trapFocus = true
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
            finalHeight: `${layer.container.offsetHeight}px`,
            origin: `${this.levitate.position.origin.vertical} center`
        }
        return this.playAnimation(layer, ddAnimation.show, { params })
            .then(() => super.animateShow(layer))
    }

    public animateHide(layer: LayerRef): Promise<void> {
        return this.playAnimation(layer, ddAnimation.hide)
            .then(() => super.animateHide(layer))
    }
}


