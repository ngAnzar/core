import { Component, Directive, Inject, TemplateRef, ViewContainerRef, Input, ViewChild, OnDestroy } from "@angular/core"
import { take } from "rxjs/operators"

import { Anchor } from "../levitate/levitate-compute"
import { HAlign, VAlign } from "../rect-mutation.service"
import { LayerRef } from "./layer-ref"
import { LayerService } from "./layer.service"
import { MenuLayer } from "./layer-behavior"
import { DropdownLayerOptions, BackdropOptions } from "./layer-options"


@Component({
    selector: ".nz-layer",
    template: "<ng-template #layer><ng-content></ng-content></ng-template>"
})
export class LayerComponent<T> implements OnDestroy {
    @ViewChild("layer", { read: TemplateRef }) protected readonly tpl: TemplateRef<T>

    @Input("self-halign") public selfHAlign: HAlign = "left"
    @Input("self-valign") public selfVAlign: VAlign = "top"
    @Input("offset-x") public offsetX: number
    @Input("offset-y") public offsetY: number
    @Input("backdrop") public backdrop: BackdropOptions
    @Input("anchor") public anchor: LayerAnchorDirective

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
                align: this.selfHAlign,
                valign: this.selfVAlign,
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


@Directive({
    selector: "[nzAnchor]",
    exportAs: "nzAnchor"
})
export class LayerAnchorDirective {
    @Input()
    public set nzAnchor(val: string) {
        if (val) {
            let parts = val.split(/-/)
            let halign = parts.filter(v => v === "left" || v === "right")[0]
            let valign = parts.filter(v => v === "top" || v === "bottom")[0]

        } else {

        }
    }

    public get nzAnchor(): string {
        return `${this.valign}-${this.halign}`
    }

    public readonly halign: HAlign = "left"
    public readonly valign: VAlign = "top"

    @Input() public offsetX: number
    @Input() public offsetY: number
}
