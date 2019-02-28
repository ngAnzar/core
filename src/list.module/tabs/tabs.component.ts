import { Component, Inject, ContentChildren, QueryList, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, TemplateRef, ElementRef } from "@angular/core"
import { startWith } from "rxjs/operators"

import { Destruct } from "../../util"
import { RectMutationService } from "../../layout.module"
import { TabComponent } from "./tab.component"
import { AnimateSwitch } from "./tab.animation"


@Component({
    selector: ".nz-tabs",
    templateUrl: "./tabs.template.pug",
    animations: [AnimateSwitch],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent implements AfterContentInit, OnDestroy {
    public readonly destruct = new Destruct()
    public readonly tabSwitch: string[] = []

    @ContentChildren(TabComponent) public readonly tabs: QueryList<TabComponent>

    public set selectedIndex(val: number) {
        const old = isNaN(this._selectedIndex) ? 0 : this._selectedIndex
        val = isNaN(val) ? 0 : this.tabs ? Math.max(0, Math.min(val, this.tabs.length)) : 0

        if (this.tabs.toArray()[val].disabled) {
            return
        }

        if (this._selectedIndex !== val) {
            const dir = old > val ? "right" : "left"
            this.tabSwitch[old] = `${dir}-out`
            this.tabSwitch[val] = `${dir}-in`
            this._selectedIndex = val
            this.cdr.detectChanges()
        }
    }
    public get selectedIndex(): number { return this._selectedIndex }
    private _selectedIndex: number

    // protected readonly labels: Array<TemplateRef<any>> = []
    // protected readonly contents: Array<TemplateRef<any>> = []

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(RectMutationService) rect: RectMutationService) {

        this.destruct.subscription(rect.watchDimension(el)).subscribe(cdr.markForCheck.bind(cdr))
    }

    public ngAfterContentInit() {
        this.destruct.subscription(this.tabs.changes).pipe(startWith(null)).subscribe(() => {
            if (isNaN(this.selectedIndex)) {
                this.selectedIndex = 0
            }
        })

    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
