import { Component, Inject, ElementRef, Host, ViewChild } from "@angular/core"

import { Destruct } from "../../util"
import { DataSourceDirective } from "../../data.module"
import { PointerEventService } from "../../common.module"
import { AutocompleteComponent } from "../../list.module"


@Component({
    selector: ".nz-navbar-search",
    templateUrl: "./navbar-search.template.pug",
    host: {
        "[attr.focused]": "focused ? '' : null",
        "[attr.opened]": "opened ? '' : null",
    }
})
export class NavbarSearchComponent {
    public readonly destruct = new Destruct()

    @ViewChild("select", { read: ElementRef }) public readonly select: ElementRef<HTMLElement>

    public empty: boolean = true

    public set opened(val: boolean) {
        if (this._opened !== val) {
            this._opened = val
        }
    }
    public get opened(): boolean { return this._opened }
    private _opened: boolean

    public set focused(val: boolean) {
        if (this._focused !== val) {
            this._focused = val
        }
    }
    public get focused(): boolean { return this._focused }
    private _focused: boolean

    public readonly AutocompleteComponent = AutocompleteComponent

    public constructor(
        @Inject(ElementRef) el: ElementRef<any>,
        @Inject(DataSourceDirective) @Host() public readonly source: DataSourceDirective<any>,
        @Inject(PointerEventService) pointerEvents: PointerEventService) {

        this.destruct.subscription(pointerEvents.up(el.nativeElement)).subscribe(event => {
            if (this.select
                && this.select.nativeElement !== event.target
                && !this.select.nativeElement.contains(event.target as any)) {
                const input = this.select.nativeElement.querySelector("input[type='text']") as HTMLElement
                if (input) {
                    input.focus()
                }
            }
        })
    }
}
