import { AnimationBuilder, AnimationOptions, AnimationPlayer, AnimationMetadata } from "@angular/animations"
import { take } from "rxjs/operators"

import { IDisposable, Rect, rawSetTimeout } from "../../util"
import { LevitateRef } from "../levitate/levitate-ref"
import { LayerOptions, DropdownLayerOptions, ClosingGuarded } from "./layer-options"
import { LayerRef, ComponentLayerRef } from "./layer-ref"
import { fallAnimation, ddAnimation, fsAnimation } from "./layer-animations"


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
        if (this.options.trapFocus) {
            layer.container.setAttribute("tabindex", "-1")
        }
        if (this.options.preventFocus) {
            layer.container.addEventListener("mousedown", preventDefault, { capture: true })
            layer.container.addEventListener("mouseup", preventDefault, { capture: true })
        }
    }

    public animateShow(layer: LayerRef): Promise<void> {
        layer.container.style.visibility = "visible"
        return Promise.resolve()
    }

    public initHide(layer: LayerRef): void {
        if (this.options.preventFocus) {
            layer.container.removeEventListener("mousedown", preventDefault, { capture: true })
            layer.container.removeEventListener("mouseup", preventDefault, { capture: true })
        }
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

    protected playAnimation(layer: LayerRef, animation: AnimationMetadata[], options?: AnimationOptions, willChange?: string): Promise<void> {
        if (this.currentAnimation) {
            this.currentAnimation.finish()
            this.currentAnimation = null
        }

        if (willChange) {
            layer.container.style.willChange = willChange
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

                layer.container.style.willChange = null
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
        if (this.options.backdrop === undefined) {
            this.options.backdrop = { type: "filled", hideOnClick: false }
        }

        if (options.closeable == null) {
            options.closeable = true
        }

        if (options.trapFocus == null) {
            options.trapFocus = true
        }
    }

    public animateShow(layer: LayerRef): Promise<void> {
        return this.playAnimation(layer, fallAnimation.show, null, "opacity, transform")
            .then(() => super.animateShow(layer))
    }

    public animateHide(layer: LayerRef): Promise<void> {
        return this.playAnimation(layer, fallAnimation.hide, null, "opacity, transform")
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
            origin: this.levitate.position.transformOrigin,
            scaleXStart: 0,
            scaleYStart: 0,
            translateX: "0px",
            translateY: "0px",
        }

        if (this.options.menuLike) {
            params.origin = this.levitate.position.transformOrigin
            params.scaleXStart = 0.5
            params.scaleYStart = 0.5
        } else {
            params.origin = `${this.levitate.position.origin.vertical} center`
            params.scaleXStart = 1
            params.scaleYStart = 0.8
            // params.translateY = "-40px"
        }

        return this.playAnimation(layer, ddAnimation.show, { params }, "opacity, transform")
            .then(() => super.animateShow(layer))
    }

    public animateHide(layer: LayerRef): Promise<void> {
        return this.playAnimation(layer, ddAnimation.hide, null, "opacity, transform")
            .then(() => super.animateHide(layer))
    }
}


export class FullscreenLayer extends LayerBehavior<DropdownLayerOptions> {
    public constructor(options: LayerOptions = {} as any) {
        super(options)
        delete options.backdrop
        delete options.elevation
        delete options.rounded
        delete options.position
        delete options.minWidth
        delete options.minHeight
        options.closeable = true
        options.trapFocus = true
        options.position = {
            anchor: {
                ref: "viewport",
                align: "stretch"
            }
        }
    }

    public animateShow(layer: LayerRef): Promise<void> {
        return this.playAnimation(layer, fsAnimation.show, null, "opacity, transform")
            .then(() => super.animateShow(layer))
    }

    public animateHide(layer: LayerRef): Promise<void> {
        return this.playAnimation(layer, fsAnimation.hide, null, "opacity, transform")
            .then(() => super.animateHide(layer))
    }
}


function preventDefault(event: Event) {
    event.preventDefault()
}
