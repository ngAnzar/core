import { Component, ContentChildren, QueryList, TemplateRef, OnInit, AfterContentInit } from "@angular/core"
import { startWith } from "rxjs/operators"

import { LayerComponent } from "../../layer.module"
import { MenuItemDirective } from "./menu-item.directive"
import { Anchor } from "../../levitate/levitate-compute"
import { Subscriptions } from "../../util"


export interface MenuPanelContext {

}


@Component({
    selector: ".nz-menu",
    templateUrl: "./menu.template.pug"
})
export class MenuComponent extends LayerComponent<MenuPanelContext> implements OnInit {
    @ContentChildren(MenuItemDirective) protected menuItems: QueryList<MenuItemDirective>

    // protected s = new Subscriptions()
    // public ngAfterContentInit() {
    //     console.log(this)
    // }

    public ngOnInit() {
        if (!this.backdrop) {
            this.backdrop = {
                type: "empty",
                hideOnClick: true
            }
        }
    }

    // public ngAfterContentInit() {
    //     this.s.add(this.menuItems.changes).pipe(startWith(this.menuItems)).subscribe(items => {
    //         for (const item of items as MenuItemDirective[]) {
    //             if (!item._initedByMenu) {
    //                 item._initedByMenu = true
    //                 // this.s.add(item.action).subscribe(this.hide)
    //             }
    //         }
    //     })
    // }

    public show(anchor?: Anchor) {
        return super.show(anchor, {
            minWidth: anchor.ref && anchor.ref instanceof HTMLElement ? anchor.ref.offsetWidth : 0
        })
    }

    protected newContext(): MenuPanelContext {
        return {} as MenuPanelContext
    }
}
