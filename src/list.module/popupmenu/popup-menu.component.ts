import { Component, ContentChildren, QueryList, ViewChild, TemplateRef, HostListener } from "@angular/core"


import { LayerRef } from "../../layer.module"
import { MenuItemDirective } from "../menu/menu-item.directive"


export interface MenuPanelContext {

}


@Component({
    selector: ".nz-popup-menu",
    templateUrl: "./popup-menu.template.pug"
})
export class PopupMenuComponent {
    @ViewChild("layer", { read: TemplateRef, static: true }) public readonly layer: TemplateRef<any>
    @ContentChildren(MenuItemDirective) protected menuItems: QueryList<MenuItemDirective>

    public _layerRef: LayerRef

    public hide() {
        if (this._layerRef) {
            this._layerRef.hide()
            delete this._layerRef
        }
    }
}
