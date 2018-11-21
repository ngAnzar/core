import { Directive, Inject, Optional, Host, ContentChildren, QueryList, AfterContentInit } from "@angular/core"

import { SelectionModel } from "../../data.module"
import { ListItemComponent } from "./list-item.component"


@Directive({
    selector: ".nz-list"
})
export class ListDirective implements AfterContentInit {
    @ContentChildren(ListItemComponent) protected items: QueryList<ListItemComponent>

    public get focusedItem(): ListItemComponent {
        return this._focusedItem
    }

    public set focusedIndex(val: number) {
        if (this._focusedIndex !== val) {
            this._focusedIndex = val
            this.setFocused(val)
        }
    }
    public get focusedIndex(): number { return this._focusedIndex }
    protected _focusedIndex: number = -1

    protected _focusedItem: ListItemComponent

    public constructor(
        @Inject(SelectionModel) @Optional() @Host() public readonly selection?: SelectionModel<any>) {
    }

    public ngAfterContentInit() {
        this.items.changes.subscribe(items => {
            if (!this._focusedItem) {
                this.setFocused(this.focusedIndex)
            } else {
                let fidx = -1
                this.items.forEach((item, i) => {
                    if (item === this._focusedItem) {
                        fidx = i
                    }
                })
                this.focusedIndex = fidx
            }
        })

        // console.log("nz list", this.items)
    }

    public moveFocus(step: number) {
        this.focusedIndex = Math.min(Math.max(0, this.focusedIndex + step), this.items ? this.items.length : 0)
    }

    protected setFocused(setIndex: number) {
        if (this.items) {
            this.items.forEach((item, index) => {
                item.focused = index === setIndex
                if (item.focused) {
                    this._focusedItem = item
                }
            })
        }
    }
}
