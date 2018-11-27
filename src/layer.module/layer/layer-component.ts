import { Directive, Inject, TemplateRef, ViewContainerRef, Input, Optional, Self, StaticProvider, ElementRef, OnDestroy } from "@angular/core"
import { ComponentType } from "@angular/cdk/portal"


import { Align, AlignInput, parseAlign } from "../../layout.module"
import { LayerRef } from "./layer-ref"
import { LayerService } from "./layer.service"
import { LayerBehavior } from "./layer-behavior"
import { Constraint } from "../levitate/levitate-options"
import { Subscription } from 'rxjs';


@Directive({
    selector: "[nzTargetAnchor]",
    exportAs: "nzTargetAnchor"
})
export class TargetAnchorDirective {
    @Input()
    public set nzTargetAnchor(val: AlignInput | Align) {
        (this as any).align = val ? parseAlign(val) : { horizontal: "left", vertical: "top" }
    }

    public readonly align: Align = { horizontal: "left", vertical: "top" }

    @Input("nzTargetAnchorX") public offsetX: number
    @Input("nzTargetAnchorY") public offsetY: number
}


@Directive({
    selector: "[nzLevitateAnchor]",
    exportAs: "nzLevitateAnchor"
})
export class LevitateAnchorDirective {
    @Input()
    public set nzLevitateAnchor(val: AlignInput | Align) {
        (this as any).align = val ? parseAlign(val) : { horizontal: "left", vertical: "top" }
    }

    public readonly align: Align = { horizontal: "left", vertical: "top" }

    @Input("nzLevitateAnchorX") public offsetX: number
    @Input("nzLevitateAnchorY") public offsetY: number
}


@Directive({
    selector: "[nzLayerFactory]"
})
export class LayerFactoryDirective implements OnDestroy {
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

    public get isVisible(): boolean { return !!this.visibleRef }

    protected cmp: ComponentType<any>
    protected tpl: TemplateRef<any>
    protected visibleRef: LayerRef

    public constructor(
        @Inject(LevitateAnchorDirective) @Optional() @Self() public readonly levitateAnchor: LevitateAnchorDirective,
        @Inject(TargetAnchorDirective) @Optional() @Self() public readonly targetAnchor: TargetAnchorDirective,
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
        if (this.visibleRef) {
            return this.visibleRef
        }

        behavior.options.position = {
            align: this.levitateAnchor.align,
            anchor: {
                ref: this.el.nativeElement,
                align: this.targetAnchor.align
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
            }
        })

        layerRef.show()
        return this.visibleRef = layerRef
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





/*
@Component({
    selector: ".nz-layer",
    template: "<ng-template #layer><ng-content></ng-content></ng-template>"
})
export class LayerComponent<T> implements OnDestroy {
    @ViewChild("layer", { read: TemplateRef }) protected readonly tpl: TemplateRef<T>

    @Input() public selfAlign: AlignInput = "left top"
    @Input() public offsetX: number
    @Input() public offsetY: number
    @Input() public backdrop: BackdropOptions
    @Input() public anchor: LevitateAnchorDirective

    public get isVisible(): boolean {
        return this.layerRef && this.layerRef.isVisible
    }

    protected layerRef: LayerRef

    public constructor(
        @Inject(LayerService) protected readonly layerSvc: LayerService,
        @Inject(ViewContainerRef) protected readonly vcr: ViewContainerRef) {
    }

    public show(anchor?: Anchor, options: DropdownLayerOptions = {}) {
        this.hide()

        const options_: DropdownLayerOptions = {
            position: {
                align: this.selfAlign,
                anchor
            },
            backdrop: this.backdrop,
            elevation: 6,
            ...options
        }

        this.layerRef = this.layerSvc.createFromTemplate(this.tpl, this.vcr, new MenuLayer(options_), null, this.newContext())
        this.layerRef.show()
        let s = this.layerRef.output.subscribe(event => {
            if (event.type === "destroy") {
                s.unsubscribe()
                delete this.layerRef
            }
        })

        return this.layerRef
    }

    public hide() {
        if (this.isVisible) {
            let layerRef = this.layerRef
            delete this.layerRef
            layerRef.close()
        }
    }

    public ngOnDestroy() {
        this.hide()
    }

    protected newContext(): T {
        return {} as T
    }
}
*/
