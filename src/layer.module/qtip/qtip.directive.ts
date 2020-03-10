import { Directive, Input, Inject, ChangeDetectorRef, ElementRef, OnDestroy, Optional } from "@angular/core"

import { LayerService } from "../layer/layer.service"
import { LayerRef, ComponentLayerRef } from "../layer/layer-ref"
import { Destruct } from "../../util"
import { Align } from "../../layout.module"

import { QtipComponent } from "./qtip.component"
import { QtipBehavior } from "./qtip.behavior"
import { QtipAlignDirective } from "./qtip-align.directive"
import { QtipManager } from "./qtip.manager"


@Directive({
    selector: "[nzQtip]"
})
export class QtipDirective implements OnDestroy {
    public readonly destruct = new Destruct(this.hide.bind(this))

    @Input("nzQtip")
    public set text(val: string) {
        if (this._text !== val) {
            this._text = val
            if (this._layerRef) {
                if (val && val.length) {
                    this._layerRef.component.instance.text = val
                } else {
                    this.hide()
                }
            }
        }
    }
    public get text(): string { return this._text }
    private _text: string

    private _layerRef: ComponentLayerRef<QtipComponent>

    public constructor(
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(QtipManager) protected readonly qtipMgr: QtipManager,
        @Inject(LayerService) protected readonly layerSvc: LayerService,
        @Inject(QtipAlignDirective) @Optional() protected readonly align: QtipAlignDirective,
        @Inject(LayerRef) @Optional() protected readonly parentlayer: LayerRef) {

        this.destruct.subscription(qtipMgr.watch(el.nativeElement, 200))
            .subscribe(visible => {
                if (visible) {
                    this.show()
                } else {
                    this.hide()
                }
            })

    }

    public show() {
        if (this.destruct.done || !this._text || this._text.length === 0) {
            return
        }

        if (!this._layerRef || !this._layerRef.isVisible) {
            let tAlign: Align
            let lAlign: Align
            if (this.align) {
                tAlign = this.align.targetAlign
                lAlign = this.align.levitateAlign
            } else {
                tAlign = { horizontal: "center", vertical: "bottom" }
                lAlign = { horizontal: "center", vertical: "top" }
            }

            let behavior = new QtipBehavior({
                elevation: 7,
                rounded: 4,
                position: {
                    align: lAlign,
                    anchor: {
                        ref: this.el.nativeElement,
                        align: tAlign,
                        margin: 16
                    }
                }
            })
            this._layerRef = this.layerSvc.createFromComponent(QtipComponent, behavior, this.parentlayer)
            this._layerRef.show()
            this._layerRef.component.instance.text = this.text
        }
    }

    public hide() {
        if (this._layerRef) {
            this._layerRef.hide()
            delete this._layerRef
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
