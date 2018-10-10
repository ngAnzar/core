import { Component, Inject, InjectionToken, TemplateRef, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"
import { SafeStyle, DomSanitizer } from "@angular/platform-browser"

import { DataStorage, Model } from "../../data"


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
export class DropdownComponent<T extends Model> {
    public get gridTemplateRows(): SafeStyle {
        return this.sanitizer.bypassSecurityTrustStyle(`repeat(${this.storage.lastIndex}, 48px)`)
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
}
