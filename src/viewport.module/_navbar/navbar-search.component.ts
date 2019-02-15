import {
    Component, Output, EventEmitter, Inject, OnDestroy, ChangeDetectorRef, HostBinding, ContentChild,
    AfterContentInit,
    ChangeDetectionStrategy
} from "@angular/core"
import { Observable } from "rxjs"

import { Model } from "../../data.module"
import { SelectComponent } from "../../form.module"
import { Destruct } from "../../util"


@Component({
    selector: ".nz-navbar-search",
    template: `<ng-content></ng-content>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarSearchComponent<T extends Model> implements AfterContentInit, OnDestroy {
    @Output()
    public action: Observable<T> = new EventEmitter()

    @ContentChild(SelectComponent)
    public readonly select: SelectComponent<T>

    @HostBinding("attr.focused")
    public get focused(): string { return this.select && this.select.focused ? "" : null }

    public readonly destruct = new Destruct()

    public constructor(
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterContentInit() {
        this.destruct.subscription(this.select.statusChanges).subscribe(() => {
            this.cdr.markForCheck()
        })

        this.select.layerFactory.targetAnchor.margin = { top: 10, bottom: 10 }

        // this.destruct.subscription(this.select.selection.changes).subscribe(selected => {
        //     if (selected.length > 0) {
        //         (this.action as EventEmitter<T>).emit(selected[0])
        //         this.select.selection.clear()
        //         this.select.opened = false
        //     }
        // })
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
