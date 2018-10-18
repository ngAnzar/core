import {
    Component, Inject, InjectionToken, TemplateRef, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy,
    ViewChild
} from "@angular/core"
import { SafeStyle, DomSanitizer } from "@angular/platform-browser"

import { DataStorage, Model } from "../../data"
import { ListDirective } from "../list/list.directive"


export const DROPDOWN_ITEM_TPL = new InjectionToken<TemplateRef<any>>("dropdown.itemTpl")


export class DDContext<T> {
    $implicit: T
}


@Component({
    selector: ".nz-dropdown",
    templateUrl: "./dropdown.template.pug",
    styles: [
        `.nz-dropdown {
            background: #FFF;
            overflow: hidden;
            max-height: inherit;
            max-width: inherit;
            display: inline-grid;
            grid-template: 1fr / 1fr;
            justify-content: stretch;
            align-content: stretch;
        }`
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownComponent<T extends Model> implements OnDestroy {
    @ViewChild("list", { read: ListDirective }) protected readonly list: ListDirective

    public get gridTemplateRows(): SafeStyle {
        return this.sanitizer.bypassSecurityTrustStyle(`repeat(${this.storage.lastIndex}, 48px)`)
    }

    public get focusedModel(): T {
        let item = this.list.focusedItem
        if (item && item.selectable) {
            return item.selectable.model as T
        }
        return null
    }


    public constructor(
        @Inject(DataStorage) public readonly storage: DataStorage<T>,
        @Inject(DROPDOWN_ITEM_TPL) public readonly itemTpl: TemplateRef<DDContext<T>>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected sanitizer: DomSanitizer) {
        storage.items.subscribe(event => {
            this.cdr.markForCheck()
        })
    }

    public focusNext() {
        this.list.moveFocus(1)
    }

    public focusPrev() {
        this.list.moveFocus(-1)
    }

    public ngOnDestroy() {
        console.log("dd.destroy")
    }
}
