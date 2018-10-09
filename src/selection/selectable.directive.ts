import { Directive, Input, Output, EventEmitter, Inject, OnDestroy, OnInit, ChangeDetectorRef } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { SelectionModel } from "./selection.directive"
import { Model, ID } from "../data"


export interface SelectedEvent<T extends Model> {
    source: Selectable<T>
    selected: boolean
}


export interface Selectable<T extends Model = Model> {
    selected: boolean
    readonly selectedChange: Observable<boolean>

    // egyedi azonosító, lehetőleg mindig maradjon meg az eredeti egy adott elemhez
    model: T
    selectionId: ID
    // selectionData: any
}


let UID_COUNTER = 0

@Directive({
    selector: "[selectable]",
    host: {
        "[attr.selected]": "selected ? '' : null",
        "(click)": "_handleClick($event)"
    }
})
export class SelectableDirective<T extends Model = Model> implements Selectable<T>, OnDestroy, OnInit {
    @Input()
    public set model(val: T) {
        if (!Model.isEq(this._model, val)) {
            let old = this._model
            this._model = val
            this._selectionId = val ? val.id : null
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
    public set selected(value: boolean) {
        value = coerceBooleanProperty(value)
        if (this._selected !== value && this.selection._canChangeSelected(this, value)) {
            this._selected = value
            this.selection._handleSelectedChange(this);
            (this.selectedChange as EventEmitter<boolean>).emit(value)
            this.cdr.markForCheck()
        }
    }
    public get selected(): boolean {
        return this._selected
    }
    protected _selected?: boolean

    @Output("selected")
    public readonly selectedChange: Observable<boolean> = new EventEmitter()

    public constructor(
        @Inject(SelectionModel) protected selection: SelectionModel<T>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef) {
    }

    public ngOnInit() {
        if (this._selected == null) {
            this.selected = this.selection.isSelected(this.selectionId)
        }
    }

    public ngOnDestroy() {
        this.selection._handleOnDestroy(this)
    }

    public _handleClick(event: MouseEvent) {
        this.selected = true
    }
}
