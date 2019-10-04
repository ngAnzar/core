import { Component, Inject, ContentChildren, TemplateRef, QueryList, ViewContainerRef, ViewChild, OnDestroy, ElementRef } from "@angular/core"

import { MenuItemDirective } from "../menu/menu-item.directive"
import { LayerService, LayerRef, DropdownLayer } from "../../layer.module"


@Component({
    selector: ".nz-fabmenu",
    templateUrl: "./fabmenu.component.pug"
})
export class FabmenuComponent implements OnDestroy {
    @ContentChildren(MenuItemDirective) protected buttons: QueryList<MenuItemDirective>
    @ViewChild("layer", { read: TemplateRef, static: true }) protected readonly layerTpl: TemplateRef<any>

    protected layerRef: LayerRef

    public constructor(
        @Inject(LayerService) protected readonly layerSvc: LayerService,
        @Inject(ViewContainerRef) protected readonly vcr: ViewContainerRef,
        @Inject(ElementRef) protected readonly el: ElementRef) {
    }

    public toggle() {
        if (!this.layerRef || !this.layerRef.isVisible) {
            let behavior = new DropdownLayer({
                backdrop: { type: "empty", hideOnClick: true },
                position: {
                    anchor: {
                        ref: this.el.nativeElement,
                        align: "top center",
                        margin: 16
                    },
                    align: "bottom center"
                }
            })
            this.layerRef = this.layerSvc.createFromTemplate(this.layerTpl, this.vcr, behavior)
            this.layerRef.show()
        } else {
            this.layerRef.hide()
            delete this.layerRef
        }
    }

    protected hide() {
        if (this.layerRef && this.layerRef.isVisible) {
            this.layerRef.hide()
            delete this.layerRef
        }
    }

    public ngOnDestroy() {
        this.hide()
    }
}
