import { Inject, SkipSelf, Optional, Injector, StaticProvider, TemplateRef, ViewContainerRef } from "@angular/core"
import { AnimationBuilder } from "@angular/animations"
import { ComponentType } from "@angular/cdk/portal"

import { LevitateRef } from "../levitate/levitate-ref"
import { Levitating } from "../levitate/levitate-compute"
import { LayerRef, TemplateLayerRef, ComponentLayerRef } from "./layer-ref"
import { LayerBehavior } from "./layer-behavior"
import { LayerContainer } from "./layer-container"
import { LevitateOptions } from "./layer-options"

export class LayerService {
    public constructor(
        @Inject(LayerService) @SkipSelf() @Optional() public readonly parent: LayerService,
        @Inject(LayerContainer) public readonly container: LayerContainer,
        @Inject(Injector) protected readonly injector: Injector,
        @Inject(LayerRef) @Optional() protected readonly layer: LayerRef,
        @Inject(AnimationBuilder) protected readonly animation: AnimationBuilder) {
    }

    public createFromTemplate<T>(tpl: TemplateRef<T>, vcr: ViewContainerRef, behavior: LayerBehavior, opener?: LayerRef, context?: T): TemplateLayerRef<T> {
        let outlet = this.container.getNewOutlet()
        return this._finalizeRef(new TemplateLayerRef(this, behavior, outlet, opener || this.layer, vcr, tpl, context), behavior, [])
    }

    public createFromComponent<T>(cmp: ComponentType<T>, behavior: LayerBehavior, opener?: LayerRef, provides?: StaticProvider[], vcr?: ViewContainerRef): ComponentLayerRef<T> {
        let outlet = this.container.getNewOutlet()
        return this._finalizeRef(new ComponentLayerRef(this, behavior, outlet, opener || this.layer, vcr, cmp), behavior, provides)
    }

    protected _finalizeRef<T>(ref: T, behavior: LayerBehavior, provides: StaticProvider[]): T {
        let levitate: LevitateRef = this._createLevitateRef(ref as any, behavior.options ? behavior.options.position : null)

        let injector = (ref as any).injector = Injector.create([
            { provide: LayerRef, useValue: ref },
            { provide: LevitateRef, useValue: levitate },
            {
                provide: LayerService,
                deps: [
                    LayerContainer
                ],
                useFactory: (container?: LayerContainer) => {
                    return new LayerService(this, container || this.container, this.injector, ref as any, this.animation)
                }
            },
            ...provides
        ], this.injector);

        (behavior as any).animationBuilder = this.animation;
        (behavior as any).levitate = levitate;

        return ref
    }

    protected _createLevitateRef(ref: LayerRef<any>, opt?: LevitateOptions): LevitateRef {
        opt = opt || {}

        let base: Levitating = {
            ref: ref.container,
            align: opt.align || "center",
            valign: opt.valign || "center",
            margin: opt.margin
        }

        if (!opt.constraint) {
            opt.constraint = {
                ref: "viewport",
                margin: 16
            }
        }

        return new LevitateRef(base, opt.connect, opt.constraint)
    }

    // public createRef<T>(target: TemplateRef<T> | ComponentType<T>, behavior: LayerBehavior, opener?: LayerRef, provides?: StaticProvider[]): LayerRef {
    //     let outlet = this.container.getNewOutlet()
    //     let ref = new LayerRef(this, behavior, outlet, opener || this.layer);



    //     return ref
    // }

}
