import {
    Directive, Inject, TemplateRef, ViewContainerRef, Input, Optional, StaticProvider,
    ElementRef, OnDestroy, Attribute, Host, Output, EventEmitter
} from "@angular/core"
import { ComponentType } from "@angular/cdk/portal"


import { Align, AlignInput, Margin, parseAlign } from "../../util"
import { LayerRef } from "./layer-ref"
import { LayerService } from "./layer.service"
import { LayerBehavior } from "./layer-behavior"
import { Constraint } from "../levitate/levitate-options"


@Directive({
    selector: "[nzTargetAnchor]",
    exportAs: "nzTargetAnchor"
})
export class TargetAnchorDirective {
    @Input()
    public set nzTargetAnchor(val: AlignInput | Align) {
        (this as any).align = val ? parseAlign(val) : null
    }

    public readonly align: Align = { horizontal: "left", vertical: "top" }

    @Input("nzTargetMargin")
    public margin: Margin

    @Input("nzTargetEl")
    public set targetEl(val: ElementRef<HTMLElement>) {
        if (val && val.nativeElement == null && val instanceof HTMLElement) {
            val = { nativeElement: val }
        }

        if (!this._targetEl || !val || this._targetEl.nativeElement !== val.nativeElement) {
            this._targetEl = val
        }
    }
    public get targetEl(): ElementRef<HTMLElement> { return this._targetEl }
    private _targetEl: ElementRef<HTMLElement>

    public constructor(@Attribute("nzTargetAnchor") @Optional() align?: AlignInput | Align) {
        if (align) {
            this.nzTargetAnchor = align
        }
    }
}


@Directive({
    selector: "[nzLevitateAnchor]",
    exportAs: "nzLevitateAnchor"
})
export class LevitateAnchorDirective {
    @Input()
    public set nzLevitateAnchor(val: AlignInput | Align) {
        (this as any).align = val ? parseAlign(val) : null
    }

    public readonly align: Align = { horizontal: "left", vertical: "top" }

    @Input("nzLevitateMargin") public margin: Margin

    public constructor(@Attribute("nzLevitateAnchor") @Optional() align?: AlignInput | Align) {
        if (align) {
            this.nzLevitateAnchor = align
        }
    }
}


@Directive({
    selector: "[nzLayerFactory]",
    exportAs: "nzLayerFactory"
})
export class LayerFactoryDirective implements OnDestroy {
    public static create(
        levitateAlign: Align | AlignInput,
        targetAlign: Align | AlignInput,
        layerSvc: LayerService,
        vcr: ViewContainerRef,
        targetEl: ElementRef<HTMLElement>) {

        let levitate = new LevitateAnchorDirective(levitateAlign)
        let target = new TargetAnchorDirective(targetAlign)
        return new LayerFactoryDirective(levitate, target, layerSvc, vcr, targetEl)
    }

    @Input()
    public set nzLayerFactory(val: TemplateRef<any> | ComponentType<any>) {
        if (val instanceof TemplateRef) {
            this.tpl = val
            this.cmp = null
        } else {
            this.cmp = val
            this.tpl = null
        }
    }

    @Output() public readonly layerShowing = new EventEmitter<LayerRef>()
    @Output() public readonly layerShow = new EventEmitter<LayerRef>()
    @Output() public readonly layerHide = new EventEmitter<LayerRef>()

    public get isVisible(): boolean { return !!this.visibleRef && this.visibleRef.isVisible }

    public get targetEl(): ElementRef<HTMLElement> {
        return this.targetAnchor ? this.targetAnchor.targetEl || this.el : this.el
    }

    protected cmp: ComponentType<any>
    protected tpl: TemplateRef<any>
    protected visibleRef: LayerRef

    public constructor(
        @Inject(LevitateAnchorDirective) @Optional() @Host() public readonly levitateAnchor: LevitateAnchorDirective,
        @Inject(TargetAnchorDirective) @Optional() @Host() public readonly targetAnchor: TargetAnchorDirective,
        @Inject(LayerService) protected readonly layerSvc: LayerService,
        @Inject(ViewContainerRef) protected readonly vcr: ViewContainerRef,
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>) {

        if (!levitateAnchor) {
            this.levitateAnchor = new LevitateAnchorDirective()
        }
        if (!targetAnchor) {
            this.targetAnchor = new TargetAnchorDirective()
        }
    }

    public show(behavior: LayerBehavior, context?: any, provides?: StaticProvider[], constraint?: Constraint): LayerRef {
        if (this.isVisible) {
            return this.visibleRef
        }

        behavior.options.position = {
            align: this.levitateAnchor.align,
            margin: this.levitateAnchor.margin,
            anchor: {
                ref: this.targetEl.nativeElement,
                align: this.targetAnchor.align,
                margin: this.targetAnchor.margin
            },
            constraint
        }

        let layerRef: LayerRef
        if (this.cmp) {
            layerRef = this.layerSvc.createFromComponent(this.cmp, behavior, null, provides, this.vcr)
        } else {
            layerRef = this.layerSvc.createFromTemplate(this.tpl, this.vcr, behavior, null, context)
        }

        let subscription = layerRef.subscribe((event) => {
            if (event.type === "hiding") {
                if (this.visibleRef === layerRef) {
                    delete this.visibleRef
                }
                subscription.unsubscribe()
                this.layerHide.next(layerRef)
            } else if (event.type === "showing") {
                this.layerShow.next(layerRef)
            }
        })

        this.visibleRef = layerRef
        this.layerShowing.next(layerRef)
        layerRef.show()
        return layerRef
    }

    public hide() {
        if (this.visibleRef) {
            this.visibleRef.hide()
        }
    }

    public ngOnDestroy() {
        this.hide()
        delete this.cmp
        delete this.tpl
    }
}
