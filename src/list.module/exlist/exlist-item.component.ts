import {
    Component, Inject, Input, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef,
    EventEmitter, OnDestroy, NgZone, ViewChild, HostBinding, HostListener
} from "@angular/core"
import { EventManager } from "@angular/platform-browser"
import { FocusOrigin } from "@angular/cdk/a11y"
import { Observable, Subscription } from "rxjs"
import { startWith } from "rxjs/operators"

import { ISelectable, Model, SelectOrigin } from "../../data.module"
import { ScrollerService } from "../scroller/scroller.service"
import { ExlistComponent, RowTplContext } from "./exlist.component"



@Component({
    selector: ".nz-exlist-item",
    templateUrl: "./exlist-item.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[style.margin-left.px]": "_selected ? -(list.paddingLeft / 2) : 0",
        "[style.margin-right.px]": "_selected ? -(list.paddingLeft / 2) : 0",
        "[style.margin-top.px]": "_selected && selectionIndex !== 0 ? 48 : 0",
        "[style.margin-bottom.px]": "_selected ? 48 : 0",
        "[style.height.px]": "_selected ? null : 48",
    }
})
export class ExlistItemComponent<T extends Model = Model> implements RowTplContext<T>, ISelectable<T>, OnDestroy {
    @ViewChild("header", { read: ElementRef, static: false })
    public set elHeader(val: HTMLElement) {
        if (!this._elHeader || !val || this._elHeader !== (val as any).nativeElement) {
            this._elHeader = val ? (val as any).nativeElement : null
            this._elHeader && this._updateByScroll()
        }
    }
    public get elHeader(): HTMLElement { return this._elHeader }
    private _elHeader: HTMLElement

    @ViewChild("content", { read: ElementRef, static: false })
    public set elContent(val: HTMLElement) {
        if (!this._elContent || !val || this._elContent !== (val as any).nativeElement) {
            this._elContent = val ? (val as any).nativeElement : null
            this._elContent && this._updateByScroll()
        }
    }
    public get elContent(): HTMLElement { return this._elContent }
    private _elContent: HTMLElement

    @ViewChild("footer", { read: ElementRef, static: false })
    public set elFooter(val: HTMLElement) {
        if (!this._elFooter || !val || this._elFooter !== (val as any).nativeElement) {
            this._elFooter = val ? (val as any).nativeElement : null
            this._elFooter && this._updateByScroll()
        }
    }
    public get elFooter(): HTMLElement { return this._elFooter }
    private _elFooter: HTMLElement

    @Input("data")
    public set model(val: T) {
        if (this.$implicit !== val) {
            let old = this.$implicit;
            (this as any).$implicit = val
            this._selected = val ? this.list.opened.origin[val.pk] : null
            this.list._handleModelChange(this, old, val)
            this.cdr && this.cdr.markForCheck()
        }
    }
    public get model(): T { return this.$implicit }
    public readonly $implicit: T

    @Input("index") public selectionIndex: number
    public get index(): number { return this.selectionIndex }
    public get row(): this { return this }


    public set selected(val: SelectOrigin) {
        if (this._selected !== val) {
            this.list.setOpened(this.model, val)
        }
    }
    public get selected(): SelectOrigin { return this._selected }
    private _selected: SelectOrigin = null
    public readonly selectedChange: Observable<SelectOrigin> = new EventEmitter<SelectOrigin>();

    @HostBinding("attr.focused")
    public set focused(val: FocusOrigin) {
        if (this._focused !== val) {
            this._focused = val
            this.cdr && this.cdr.markForCheck()
        }
    }
    public get focused(): FocusOrigin { return this._focused }
    private _focused: FocusOrigin

    public get isAccessible(): boolean { return true }

    private _scroll: Subscription
    // private _rebindAfterCheck: boolean = false

    public constructor(
        @Inject(NgZone) protected readonly zone: NgZone,
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ExlistComponent) protected readonly list: ExlistComponent,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(ScrollerService) protected readonly scroller: ScrollerService,
        @Inject(EventManager) protected readonly eventManager: EventManager) {
    }

    public onHeaderTap(event: Event) {
        if (event.defaultPrevented || !this.list.tplExContent) {
            return
        }
        // event.preventDefault()
        this.selected = this.selected ? null : "mouse"
    }

    public _changeSelected(newValue: SelectOrigin): void {
        this._selected = newValue
        if (this._scroll) {
            this._scroll.unsubscribe()
            delete this._scroll
        }

        if (newValue) {
            this._scroll = this.zone.runOutsideAngular(() => this.scroller.vpRender.scroll
                .pipe(startWith(null))
                .subscribe(this._updateByScroll))
            setTimeout(this._updateByScroll, 210)
        }

        (this.selectedChange as EventEmitter<SelectOrigin>).emit(newValue);
        this.cdr.markForCheck()
        // this._rebindAfterCheck = true
    }

    public _canChangeSelected(newValue: SelectOrigin): boolean {
        return !!this.list.tplExContent
    }

    private _updateByScroll = () => {
        let visible = this.scroller.vpRender.visible
        let elRect = this.scroller.getElementRenderedRect(this.el.nativeElement)

        if (this._elHeader) {
            let top = elRect.top - visible.top
            if (top < 0) {
                let maxTop = this.el.nativeElement.offsetHeight - this._elHeader.offsetHeight
                this._elHeader.style.top = `${Math.min(maxTop, -top)}px`
                this._elHeader.setAttribute("elevation", "2")
            } else {
                this._elHeader.style.top = `0px`
                this._elHeader.removeAttribute("elevation")
            }
        }

        if (this._elFooter) {
            let bottom = visible.bottom - elRect.bottom
            if (bottom < 0) {
                let maxBottom = this._elContent.offsetTop + this._elContent.offsetHeight - this._elFooter.offsetHeight - Math.min(this._elContent.offsetHeight, 56)
                this._elFooter.style.bottom = `${Math.min(maxBottom, -bottom)}px`
            } else {
                this._elFooter.style.bottom = `0px`
            }
        }
    }

    public ngOnDestroy() {
        this.list._handleOnDestroy(this)
        if (this._scroll) {
            this._scroll.unsubscribe()
            delete this._scroll
        }
    }
}
