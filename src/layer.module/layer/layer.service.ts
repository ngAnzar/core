import { Inject, InjectFlags, Optional, SkipSelf, Injector, StaticProvider, TemplateRef, ViewContainerRef, Injectable } from "@angular/core"
import { AnimationBuilder } from "@angular/animations"
import { ComponentType } from "@angular/cdk/portal"
import { ConfigurableFocusTrapFactory } from "@angular/cdk/a11y"

import { ShortcutService } from "../../common.module"

import { LevitateService } from "../levitate/levitate.service"
import { LevitateRef } from "../levitate/levitate-ref"
import type { Levitating } from "../levitate/levitate-options"

import { MaskService } from "../mask/mask.service"

import { LayerRef, TemplateLayerRef, ComponentLayerRef } from "./layer-ref"
import { LayerContainer } from "./layer-container"
import { LayerBackdropRef } from "./layer-backdrop"
import type { LayerBehavior } from "./layer-behavior"
import type { LevitateOptions, BackdropOptions, LayerOptions } from "./layer-options"


@Injectable()
export class LayerService {
    protected backdrops: { [key: string]: LayerBackdropRef } = {}
    // public readonly parent: LayerService

    public constructor(
        @Inject(LayerService) @SkipSelf() @Optional() public readonly parent: LayerService,
        @Inject(LayerContainer) public readonly container: LayerContainer,
        @Inject(Injector) protected readonly injector: Injector,
        @Inject(LayerRef) @Optional() protected readonly layer: LayerRef,
        @Inject(AnimationBuilder) protected readonly animation: AnimationBuilder,
        @Inject(LevitateService) protected readonly levitateSvc: LevitateService,
        @Inject(MaskService) protected readonly maskSvc: MaskService,
        @Inject(ShortcutService) protected readonly shortcutSvc: ShortcutService,
        @Inject(ConfigurableFocusTrapFactory) protected readonly focusTrap: ConfigurableFocusTrapFactory) {
        // this.parent = injector.get(LayerService, null, InjectFlags.Optional | InjectFlags.SkipSelf)
    }

    public createFromTemplate<T>(tpl: TemplateRef<T>, vcr: ViewContainerRef, behavior: LayerBehavior, opener?: LayerRef, context?: T): TemplateLayerRef<T> {
        let outlet = this.container.getNewOutlet(behavior.options.alwaysOnTop || false)
        return this._finalizeRef(new TemplateLayerRef(behavior, outlet, this.shortcutSvc, this.focusTrap, opener || this.layer, vcr, tpl, context), behavior, [])
    }

    public createFromComponent<T>(cmp: ComponentType<T>, behavior: LayerBehavior, opener?: LayerRef, provides?: StaticProvider[], vcr?: ViewContainerRef, injector?: Injector): ComponentLayerRef<T> {
        let outlet = this.container.getNewOutlet(behavior.options.alwaysOnTop || false)
        return this._finalizeRef(new ComponentLayerRef(behavior, outlet, this.shortcutSvc, this.focusTrap, opener || this.layer, vcr, cmp), behavior, provides, injector)
    }

    protected _finalizeRef<T extends LayerRef>(ref: T, behavior: LayerBehavior, provides: StaticProvider[], injector?: Injector): T {
        let levitate: LevitateRef = this._createLevitateRef(ref as any, behavior.options)
        let backdrop: StaticProvider[] = []
        const baseInjector = injector || this.injector

        if (behavior.options.backdrop) {
            let br = this._getBackdrop(behavior.options.backdrop)
            br.attach(ref)
            backdrop = [
                { provide: LayerBackdropRef, useValue: br }
            ]
        }

        (ref as any).injector = Injector.create([
            { provide: LayerRef, useValue: ref },
            { provide: LevitateRef, useValue: levitate },
            {
                provide: LayerService,
                deps: [],
                useFactory: () => {
                    return new LayerService(this, this.container, baseInjector, ref as any, this.animation, this.levitateSvc, this.maskSvc, this.shortcutSvc, this.focusTrap)
                }
            },
            ...backdrop,
            ...(provides || [])
        ], baseInjector);

        (behavior as any).animationBuilder = this.animation;
        (behavior as any).levitate = levitate

        return ref
    }

    protected _createLevitateRef(ref: LayerRef<any>, opt?: LayerOptions): LevitateRef {
        opt = opt || {}
        const position = opt.position || {}

        let base: Levitating = {
            ref: ref.container,
            align: position.align || "center",
            margin: position.margin,
            maxWidth: opt.maxWidth,
            maxHeight: opt.maxHeight,
        }

        if (!position.constraint) {
            position.constraint = { ref: "viewport" }
        }

        return this.levitateSvc.levitate(base, position.anchor, position.constraint)
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

        let backdrop = new LayerBackdropRef(mask)
        if (!options.crop) {
            this.backdrops[options.type] = backdrop
            backdrop.mask.destruct.on.subscribe(event => {
                delete this.backdrops[options.type]
            })
        }
        return backdrop
    }
}
