import { Directive, Input, Output, EventEmitter, Inject, OnDestroy, ChangeDetectorRef, HostListener, HostBinding, ElementRef } from "@angular/core"
import { DOCUMENT } from "@angular/platform-browser"
// import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { Model } from "../model"
import { SelectionModel, ISelectable, SelectOrigin } from "./abstract"


@Directive({
    selector: "[selectable]"
})
export class SelectableDirective<T extends Model = Model> implements ISelectable<T>, OnDestroy {
    @Input("selectable")
    public set model(val: T) {
        if (!Model.isEq(this._model, val)) {
            let old = this._model
            this._model = val
            this._selected = val ? this.selection.getSelectOrigin(val.id) : null
            this.selection._handleModelChange(this, old, val)
        }
    }
    public get model(): T { return this._model }
    protected _model: T

    @Input()
    // public selectionIndex: number
    public set selectionIndex(val: number) {
        if (this._selectionIndex !== val) {
            this._selectionIndex = val
            // console.log("selectionIndex", val)
        }
    }
    public get selectionIndex(): number { return this._selectionIndex }
    private _selectionIndex: number

    public get isAccessible(): boolean {
        return this.doc && this.doc.contains(this.el.nativeElement)
    }

    @Input()
    @HostBinding("attr.selected")
    public set selected(value: SelectOrigin) {
        // value = coerceBooleanProperty(value)
        if (this._selected !== value) {
            this.selection.setSelected(this.model.id, value)
        }
    }
    public get selected(): SelectOrigin { return this._selected }
    protected _selected: SelectOrigin

    @Output("selected")
    public readonly selectedChange: Observable<SelectOrigin> = new EventEmitter()

    public constructor(
        @Inject(SelectionModel) public readonly selection: SelectionModel<T>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(ElementRef) protected el: ElementRef<HTMLElement>,
        @Inject(DOCUMENT) protected doc: Document) {
    }

    public ngOnDestroy() {
        if (this.cdr) {
            this.cdr.detach()
            this.selection._handleOnDestroy(this)

            delete (this as any).cdr
            delete (this as any).selection
            delete (this as any).el
            delete (this as any).doc
        }
    }

    // prevent lose focusing on original element
    @HostListener("mousedown", ["$event"])
    public _onMouseDown(event: MouseEvent) {
        this.selection.keyboard.handleMouseDown(event, this)
    }

    @HostListener("mouseup", ["$event"])
    public _onMouseUp(event: MouseEvent) {
        this.selection.keyboard.handleMouseUp(event, this)
    }

    public _changeSelected(newValue: SelectOrigin) {
        this._selected = newValue;
        (this.selectedChange as EventEmitter<SelectOrigin>).emit(newValue)
        this.cdr && this.cdr.markForCheck()
    }

    public _canChangeSelected(newValue: SelectOrigin): boolean {
        return true
    }
}
