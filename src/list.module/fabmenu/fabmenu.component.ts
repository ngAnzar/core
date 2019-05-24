import { Component, Inject, ContentChildren, ContentChild, TemplateRef, QueryList, ViewContainerRef, ViewChild, HostListener, ElementRef } from "@angular/core"

import { ButtonComponent } from "../../common.module"
import { MenuItemDirective } from "../menu/menu-item.directive"
import { FabmenuTriggerDirective } from "./fabmenu-trigger.directive"
import { LayerService, LayerRef, DropdownLayer } from "../../layer.module"


@Component({
    selector: ".nz-fabmenu",
    templateUrl: "./fabmenu.component.pug"
})
export class FabmenuComponent {
    @ContentChild(FabmenuTriggerDirective) protected trigger: FabmenuTriggerDirective
    @ContentChildren(MenuItemDirective) protected buttons: QueryList<MenuItemDirective>
    @ViewChild("layer", { read: TemplateRef }) protected readonly layerTpl: TemplateRef<any>

    protected layerRef: LayerRef

    public constructor(
        @Inject(LayerService) protected readonly layerSvc: LayerService,
        @Inject(ViewContainerRef) protected readonly vcr: ViewContainerRef,
        @Inject(ElementRef) protected readonly el: ElementRef) {

    }

    @HostListener("tap", ["$event"])
    protected onTap(event: any) {
        if (event.srcEvent && (event.srcEvent as Event).defaultPrevented) {
            return
        }

        this.toggle()
    }

    @HostListener("press", ["$event"])
    protected onPress(event: any) {
        if (event.srcEvent && (event.srcEvent as Event).defaultPrevented) {
            return
        }

        this.toggle()
    }

    protected toggle() {
        if (!this.layerRef || !this.layerRef.isVisible) {
            let behavior = new DropdownLayer({
                backdrop: { type: "empty", hideOnClick: true },
                position: {
                    anchor: {
                        ref: this.el.nativeElement,
                        align: "top center"
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
}
