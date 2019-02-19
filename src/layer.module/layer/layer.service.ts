import { Inject, SkipSelf, Optional, Injector, StaticProvider, TemplateRef, ViewContainerRef } from "@angular/core"
import { AnimationBuilder } from "@angular/animations"
import { ComponentType } from "@angular/cdk/portal"

import { LevitateRef } from "../levitate/levitate-ref"
import { Levitating } from "../levitate/levitate-options"
import { LevitateService } from "../levitate/levitate.service"

import { MaskService } from "../mask/mask.service"

import { LayerRef, TemplateLayerRef, ComponentLayerRef } from "./layer-ref"
import { LayerBehavior } from "./layer-behavior"
import { LayerContainer } from "./layer-container"
import { LevitateOptions, BackdropOptions } from "./layer-options"
import { LayerBackdropRef } from "./layer-backdrop"


export class LayerService {
    protected backdrops: { [key: string]: LayerBackdropRef } = {}

    public constructor(
        @Inject(LayerService) @SkipSelf() @Optional() public readonly parent: LayerService,
        @Inject(LayerContainer) public readonly container: LayerContainer,
        @Inject(Injector) protected readonly injector: Injector,
        @Inject(LayerRef) @Optional() protected readonly layer: LayerRef,
        @Inject(AnimationBuilder) protected readonly animation: AnimationBuilder,
        @Inject(LevitateService) protected readonly levitateSvc: LevitateService,
        @Inject(MaskService) protected readonly maskSvc: MaskService) {
    }

    public createFromTemplate<T>(tpl: TemplateRef<T>, vcr: ViewContainerRef, behavior: LayerBehavior, opener?: LayerRef, context?: T): TemplateLayerRef<T> {
        let outlet = this.container.getNewOutlet()
        return this._finalizeRef(new TemplateLayerRef(behavior, outlet, opener || this.layer, vcr, tpl, context), behavior, [])
    }

    public createFromComponent<T>(cmp: ComponentType<T>, behavior: LayerBehavior, opener?: LayerRef, provides?: StaticProvider[], vcr?: ViewContainerRef): ComponentLayerRef<T> {
        let outlet = this.container.getNewOutlet()
        return this._finalizeRef(new ComponentLayerRef(behavior, outlet, opener || this.layer, vcr, cmp), behavior, provides)
    }

    protected _finalizeRef<T extends LayerRef>(ref: T, behavior: LayerBehavior, provides: StaticProvider[]): T {
        let levitate: LevitateRef = this._createLevitateRef(ref as any, behavior.options ? behavior.options.position : null)
        let backdrop: StaticProvider[] = []

        if (behavior.options.backdrop) {
            let br = this._getBackdrop(behavior.options.backdrop)
            br.attach(ref)
            backdrop = [
                { provide: LayerBackdropRef, useValue: br }
            ]
        }

        let injector = (ref as any).injector = Injector.create([
            { provide: LayerRef, useValue: ref },
            { provide: LevitateRef, useValue: levitate },
            {
                provide: LayerService,
                deps: [
                    LayerContainer
                ],
                useFactory: (container?: LayerContainer) => {
                    return new LayerService(this, container || this.container, this.injector, ref as any, this.animation, this.levitateSvc, this.maskSvc)
                }
            },
            ...backdrop,
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
            margin: opt.margin
        }

        if (!opt.constraint) {
            opt.constraint = { ref: "viewport" }
        }

        return this.levitateSvc.levitate(base, opt.anchor, opt.constraint)
    }

    protected _getBackdrop(options: BackdropOptions): LayerBackdropRef {
        if (!options.crop) {
            if (this.backdrops[options.type]) {
                return this.backdrops[options.type]
            }
        }

        let mask = this.maskSvc.show(window,
            options.type === "empty" ? { backgroundColor: "rgba(0, 0, 0, 0.0001)" } : { backgroundColor: "rgba(0, 0, 0, 0.3)" },
            options.crop)

        let backdrop = new LayerBackdropRef(mask, this.animation)
        if (!options.crop) {
            this.backdrops[options.type] = backdrop
            let sub = backdrop.mask.container.destruct.on.subscribe(event => {
                sub.unsubscribe()
                delete this.backdrops[options.type]
            })
        }
        return backdrop
    }

    // public createRef<T>(target: TemplateRef<T> | ComponentType<T>, behavior: LayerBehavior, opener?: LayerRef, provides?: StaticProvider[]): LayerRef {
    //     let outlet = this.container.getNewOutlet()
    //     let ref = new LayerRef(this, behavior, outlet, opener || this.layer);



    //     return ref
    // }

}
