import {
    Component, Inject, ContentChildren, QueryList, AfterContentInit,
    ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Output, ElementRef, ViewChild, Input
} from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Subject } from "rxjs"
import { startWith } from "rxjs/operators"

import { Destruct } from "../../util"
import { StackComponent } from "../../layout.module/stack/stack.component"
import { NzTouchEvent } from "../../common.module"
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

    public set swipeChanging(val: number) {
        if (this._swipeChanging !== val) {
            this._swipeChanging = val
            this.cdr.markForCheck()
        }
    }
    public _swipeChanging: number = 0

    @Output() public readonly changes = new Subject<number>()

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
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

    private _panBeginWidth: number
    public onPan(event: NzTouchEvent) {
        if (event.orient !== "horizontal" || event.defaultPrevented || event.pointerType === "mouse") {
            return
        }
        event.preventDefault()

        if (this._panBeginWidth == null) {
            this._panBeginWidth = this.el.nativeElement.offsetWidth
        }

        let swipeChanging = Math.min(Math.max(Math.abs(event.distanceX / this._panBeginWidth), 0.0), 1.0)
        if (event.distanceX < 0) {
            swipeChanging *= -1
        }
        this.swipeChanging = swipeChanging

        if (event.isFinal) {
            this._swipeChanging = 0

            if (Math.abs(swipeChanging) >= 0.6 || event.velocityX >= 0.5) {
                this.selectedIndex = this.selectedIndex + (swipeChanging < 0 ? 1 : -1)
            }

            delete this._panBeginWidth
            this.cdr.markForCheck()
        }
    }
}
