import { Directive, Input, Output, EventEmitter, Inject, OnDestroy, ChangeDetectorRef, HostListener, HostBinding, ElementRef, OnInit } from "@angular/core"
import { DOCUMENT } from "@angular/common"
import { FocusOrigin } from "@angular/cdk/a11y"
import { Observable } from "rxjs"

import { Model } from "../model"
import { SelectionModel, ISelectable, SelectOrigin } from "./abstract"


@Directive({
    selector: "[selectable]"
})
export class SelectableDirective<T extends Model = Model> implements ISelectable<T>, OnDestroy, OnInit {
    @Input("selectable")
    public set model(val: T) {
        if (!this._inited) {
            this._pendingModel = val
            return
        }

        if (this._model !== val) {
            let old = this._model
            this._model = val
            this._selected = val ? this.selection.getSelectOrigin(val.pk) : null
            this.selection._handleModelChange(this, old, val)
            this.cdr && this.cdr.markForCheck()
        }
    }
    public get model(): T { return this._model }
    protected _model: T

    @HostBinding("attr.focused")
    public set focused(val: FocusOrigin) {
        if (this._focused !== val) {
            this._focused = val
            this.cdr && this.cdr.markForCheck()
        }
    }
    public get focused(): FocusOrigin { return this._focused }
    private _focused: FocusOrigin

    @Input()
    public set selectionIndex(val: number) {
        if (this._selectionIndex !== val) {
            this._selectionIndex = val
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
        if (!this._inited) {
            this._pendingSelected = value
            return
        }
        // value = coerceBooleanProperty(value)
        if (this._selected !== value) {
            this.selection.setSelected(this.model.pk, value)
            this.cdr && this.cdr.markForCheck()
        }
    }
    public get selected(): SelectOrigin { return this._selected }
    protected _selected: SelectOrigin

    @Output("selected")
    public readonly selectedChange: Observable<SelectOrigin> = new EventEmitter()

    private _inited = false
    private _pendingSelected: SelectOrigin
    private _pendingModel: T

    public constructor(
        @Inject(SelectionModel) public readonly selection: SelectionModel<T>,
        @Inject(ElementRef) public readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DOCUMENT) protected doc: Document) {
    }

    public ngOnInit() {
        this._inited = true
        if (this._pendingModel != null) {
            this.model = this._pendingModel
        }
        if (this._pendingSelected != null) {
            this.selected = this._pendingSelected
        }
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

    @HostListener("tap", ["$event"])
    public onTap(event: any) {
        this.selection.keyboard.handleMouse(event, this)
    }

    public _changeSelected(newValue: SelectOrigin) {
        this._selected = newValue
        this.cdr && this.cdr.markForCheck();
        (this.selectedChange as EventEmitter<SelectOrigin>).emit(newValue)
    }

    public _canChangeSelected(newValue: SelectOrigin): boolean {
        return true
    }
}
