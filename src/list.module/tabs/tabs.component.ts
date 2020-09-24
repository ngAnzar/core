import {
    Component, Inject, ContentChildren, QueryList, AfterContentInit,
    ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Output, ElementRef, ViewChild, Input
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Subject } from "rxjs"
import { startWith } from "rxjs/operators"

import { Destruct } from "../../util"
import { RectMutationService } from "../../layout.module"
import { StackComponent } from "../../layout.module/stack/stack.component"
import { ScrollerComponent } from "../scroller/scroller.component"
import { TabComponent } from "./tab.component"


@Component({
    selector: ".nz-tabs",
    exportAs: "nzTabs",
    templateUrl: "./tabs.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent implements AfterContentInit, OnDestroy {
    public readonly destruct = new Destruct()

    @ContentChildren(TabComponent) public readonly tabs: QueryList<TabComponent>
    public readonly _tabsAsArray: TabComponent[]

    @ViewChild("stack", { static: true }) public readonly stack: StackComponent

    @Input()
    public set selectedIndex(val: number) {
        if (this.stack) {
            this.stack.selectedIndex = val
        } else {
            this._pendingIndex = val
        }
    }
    public get selectedIndex(): number { return this.stack ? this.stack.selectedIndex : -1 }
    private _pendingIndex: number = null

    @Input()
    public set dynamicHeight(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._dynamicHeight !== val) {
            this._dynamicHeight = val
            this.cdr.markForCheck()
        }
    }
    public get dynamicHeight(): boolean { return this._dynamicHeight }
    public _dynamicHeight: boolean = false

    @Output() public readonly changes = new Subject<number>()

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {
    }

    public ngAfterContentInit() {
        this.destruct.subscription(this.tabs.changes)
            .pipe(startWith(null))
            .subscribe(() => {
                (this as any)._tabsAsArray = this.tabs.toArray()
                if (this._pendingIndex != null) {
                    this.stack.selectedIndex = this._pendingIndex
                    delete this._pendingIndex
                }
                this.cdr.markForCheck()
            })
    }

    public ngOnDestroy() {
        this.destruct.run()
    }

    public onSelectedIndexChanged(index: number) {
        this.changes.next(index)
        this.cdr.markForCheck()
    }
}
