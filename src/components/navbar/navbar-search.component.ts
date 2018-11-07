import {
    Component, Input, Output, EventEmitter, ViewChild, Inject, AfterViewInit, OnDestroy,
    ChangeDetectionStrategy, ChangeDetectorRef
} from "@angular/core"
import { Observable } from "rxjs"

import { DataSource, Model } from "../../data.module"
import { SelectComponent } from "../select/select.component"
import { Subscriptions } from "../../util"


@Component({
    selector: ".nz-navbar-search",
    host: {
        "[attr.focused]": "select && select.focused ? '' : null"
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: "./navbar-search.template.pug"
})
export class NavbarSearchComponent<T extends Model> implements AfterViewInit, OnDestroy {
    @Input() public dataSource: DataSource<T>
    @Output() public action: Observable<T> = new EventEmitter()

    @ViewChild("select") public readonly select: SelectComponent<T>

    protected s = new Subscriptions()

    public constructor(
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterViewInit() {
        this.s.add(this.select.statusChanges).subscribe(() => {
            this.cdr.markForCheck()
        })

        this.s.add(this.select.selection.changes).subscribe(selected => {
            if (selected.length > 0) {
                (this.action as EventEmitter<T>).emit(selected[0])
                this.select.selection.clear()
            }
        })
    }

    public ngOnDestroy() {
        this.s.unsubscribe()
    }
}
