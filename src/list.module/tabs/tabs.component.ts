import {
    Component, Inject, ContentChildren, QueryList, AfterContentInit,
    ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Output, ElementRef, ViewChild, Input
} from "@angular/core"
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
    @ViewChild("tabScroller", { static: false }) public readonly tabScroller: ScrollerComponent
    @ViewChild("labelContainer", { read: ElementRef, static: false }) public readonly labelContainer: ElementRef<HTMLElement>

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

    public set tableMinWidth(val: string) {
        if (this._tableMinWidth !== val) {
            this._tableMinWidth = val
            this.cdr.markForCheck()
        }
    }
    public get tableMinWidth(): string { return this._tableMinWidth }
    private _tableMinWidth: string

    @Output() public readonly changes = new Subject<number>()

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(RectMutationService) mutation: RectMutationService) {

        this.destruct.subscription(mutation.watchDimension(el)).subscribe(size => {
            this.tableMinWidth = `${size.width}px`
        })
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

    public onLabelTap(event: Event, index: number) {
        if (event.defaultPrevented) {
            return
        }
        this.selectedIndex = index
    }

    public onSelectedIndexChanged(index: number) {
        this.changes.next(index)
        if (this.tabScroller && this.labelContainer) {
            const label = this.labelContainer.nativeElement.querySelector(`td:nth-child(${index + 1})`) as HTMLElement
            label && this.tabScroller.service.scrollIntoViewport(label)
        }
        this.cdr.markForCheck()
    }
}
