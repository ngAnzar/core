import {
    Component, Inject, ContentChildren, QueryList, AfterContentInit,
    ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, TemplateRef, Output, ElementRef
} from "@angular/core"
import { Subject } from "rxjs"
import { startWith } from "rxjs/operators"

import { Destruct } from "../../util"
import { RectMutationService } from "../../layout.module"
import { TabComponent } from "./tab.component"



@Component({
    selector: ".nz-tabs",
    templateUrl: "./tabs.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent implements AfterContentInit, OnDestroy {
    public readonly destruct = new Destruct()

    @ContentChildren(TabComponent) public readonly tabs: QueryList<TabComponent>
    public readonly tabContents: Readonly<Array<TemplateRef<any>>>

    public set selectedIndex(val: number) {
        val = isNaN(val) ? 0 : this.tabs ? Math.max(0, Math.min(val, this.tabs.length)) : 0

        // TODO: find optimal solution
        if (this.tabs.toArray()[val].disabled) {
            return
        }

        if (this._selectedIndex !== val) {
            this._selectedIndex = val
            this.changes.next(val)
            this.cdr.markForCheck()
        }
    }
    public get selectedIndex(): number { return this._selectedIndex }
    private _selectedIndex: number = 0

    @Output() public readonly changes = new Subject<number>()

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(RectMutationService) mutation: RectMutationService) {

        this.destruct.subscription(mutation.watchDimension(el)).subscribe(_ => {
            cdr.detectChanges()
        })
    }

    public ngAfterContentInit() {
        this.destruct.subscription(this.tabs.changes)
            .pipe(startWith(null))
            .subscribe(() => {
                (this as any).tabContents = this.tabs.toArray().map(item => item.contentTpl)
                this.cdr.markForCheck()
            })
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    public onLabelTap(event: Event, index: number) {
        if (event.defaultPrevented) {
            return
        }
        this.selectedIndex = index
    }
}
