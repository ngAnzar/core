import { Component, Inject, Input, Output, QueryList, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, OnInit, AfterViewInit } from "@angular/core"
import { Observable, Subject } from "rxjs"

import { TabComponent } from "./tab.component"
import { RectMutationService } from "../../layout.module"
import { FastDOM, Destructible } from "../../util"
import { ScrollerComponent } from "../scroller/scroller.component"

// TODO: Scroll into viewport

@Component({
    selector: ".nz-tab-labels",
    templateUrl: "./tab-labels.component.pug",
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabLabelsComponent extends Destructible implements OnInit, AfterViewInit {
    @Input() public readonly tabs: QueryList<TabComponent>

    @Input()
    public set selectedIndex(val: number) {
        if (this._selectedIndex !== val) {
            (this.changes as Subject<number>).next(this._selectedIndex = val)

            if (this.scroller) {
                const label = this.el.nativeElement.querySelector(`td:nth-child(${val + 1})`) as HTMLElement
                label && this.scroller.service.scrollIntoViewport(label)
            }
            this._updateUnderline()
            this.cdr.markForCheck()
        }
    }
    public get selectedIndex(): number { return this._selectedIndex }
    public _selectedIndex: number

    @Output() public readonly changes: Observable<number> = new Subject<number>()
    @ViewChild("underline", { static: true, read: ElementRef }) public readonly underline: ElementRef<HTMLElement>
    @ViewChild("scroller", { static: true, read: ScrollerComponent }) public readonly scroller: ScrollerComponent

    public set minWidth(val: number) {
        if (this._minWidth !== val) {
            this._minWidth = val
            this.cdr.markForCheck()
        }
    }
    public get minWidth(): number { return this._minWidth }
    public _minWidth: number

    private labelSizes: Array<{ width: number, left: number }> = []

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef,
        @Inject(RectMutationService) mutation: RectMutationService) {
        super()

        this.destruct.subscription(mutation.watchDimension(el)).subscribe(size => {
            this.minWidth = size.width
        })
    }

    public ngOnInit() {
        this.destruct.subscription(this.tabs.changes).subscribe(this.cdr.markForCheck.bind(this))
    }

    public ngAfterViewInit() {
        this.destruct.subscription(this.scroller.service.vpImmediate.scroll).subscribe(this._updateUnderline.bind(this))
    }

    public updateLabelSize(index: number, width: number) {
        if (index == null || width == null) {
            return
        }

        this.labelSizes[index] = { width, left: 0 }

        let left = 0
        for (const ls of this.labelSizes) {
            if (ls) {
                ls.left = left
                left += ls.width
            }
        }

        this._updateUnderline()
    }

    public onLabelTap(event: Event, index: number) {
        event.preventDefault()
        this.selectedIndex = index
    }

    private _underlineLeft: number
    private _underlineWidth: number
    private _updateUnderline() {
        const underline = this.underline?.nativeElement
        if (underline) {
            const size = this.labelSizes[this._selectedIndex]
            const left = size ? size.left - (this.scroller?.service.scrollPosition.left || 0) : 0
            if (size && (this._underlineLeft !== left || this._underlineWidth !== size.width)) {
                this._underlineLeft = left
                this._underlineWidth = size.width
                FastDOM.mutate(() => {
                    underline.style.transform = `translateX(${left}px) scaleX(${size.width})`
                })
            }
        }
    }
}
