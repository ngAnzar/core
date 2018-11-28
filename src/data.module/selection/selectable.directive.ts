import { Directive, Input, Output, EventEmitter, Inject, OnDestroy, OnInit, ChangeDetectorRef, HostListener, HostBinding } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { Model, ID } from "../model"
import { SelectionModel, ISelectable, SelectOrigin } from "./abstract"



let UID_COUNTER = 0

@Directive({
    selector: "[selectable]"
})
export class SelectableDirective<T extends Model = Model> implements ISelectable<T>, OnDestroy, OnInit {
    @Input("selectable")
    public set model(val: T) {
        if (!Model.isEq(this._model, val)) {
            let old = this._model
            this._model = val
            this._selectionId = val ? val.id : null
            this._selected = this.selection.getSelectOrigin(this.selectionId)
            this.selection._handleModelChange(this, old, val)
        }
    }
    public get model(): T { return this._model }
    protected _model: T

    public get selectionId(): ID {
        return this._selectionId
            ? this._selectionId
            : this._uid ? this._uid : (this._uid = `nz-selectable-${++UID_COUNTER}`)
    }
    protected _selectionId: ID
    protected _uid?: string

    @Input()
    public set selectionIndex(val: number) {
        if (this._selectionIndex !== val) {
            this._selectionIndex = val
        }
    }
    public get selectionIndex(): number { return this._selectionIndex }
    private _selectionIndex: number

    @Input()
    @HostBinding("attr.selected")
    public set selected(value: SelectOrigin) {
        // value = coerceBooleanProperty(value)
        if (this._selected !== value) {
            this.selection.setSelected(this.selectionId, value)
        }
    }
    public get selected(): SelectOrigin {
        return this._selected
    }
    protected _selected?: SelectOrigin

    @Output("selected")
    public readonly selectedChange: Observable<SelectOrigin> = new EventEmitter()

    public constructor(
        @Inject(SelectionModel) public readonly selection: SelectionModel<T>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef) {
    }

    public ngOnInit() {
        if (this._selected == null) {
            this._selected = this.selection.getSelectOrigin(this.selectionId)
            if (this._selected) {
                this.cdr.markForCheck()
            }
        }
    }

    public ngOnDestroy() {
        this.selection._handleOnDestroy(this)
    }

    @HostListener("click")
    public _handleClick(event: MouseEvent) {
        this.selected = "mouse"
    }

    public _changeSelected(newValue: SelectOrigin) {
        this._selected = newValue;
        (this.selectedChange as EventEmitter<SelectOrigin>).emit(newValue)
        this.cdr.markForCheck()
    }

    public _canChangeSelected(newValue: SelectOrigin): boolean {
        return true
    }
}
