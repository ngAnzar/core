import { Directive, Input, Output, EventEmitter, Inject, OnDestroy, OnInit, ChangeDetectorRef, HostListener, HostBinding } from "@angular/core"
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

    _changeSelected(newValue: boolean): void
    _canChangeSelected(newValue: boolean): boolean
    // selectionData: any
}


let UID_COUNTER = 0

@Directive({
    selector: "[selectable]"
})
export class SelectableDirective<T extends Model = Model> implements Selectable<T>, OnDestroy, OnInit {
    @Input()
    public set model(val: T) {
        if (!Model.isEq(this._model, val)) {
            let old = this._model
            this._model = val
            this._selectionId = val ? val.id : null
            this._selected = this.selection.isSelected(this.selectionId)
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
        if (this._selected !== value) {
            this.selection.setSelected(this.selectionId, value)
        }
    }
    public get selected(): boolean {
        return this._selected
    }
    protected _selected?: boolean

    @Output("selected")
    public readonly selectedChange: Observable<boolean> = new EventEmitter()

    @HostBinding("attr.selected")
    protected get selectedAttr(): string { return this.selected ? "" : null }

    public constructor(
        @Inject(SelectionModel) public readonly selection: SelectionModel<T>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef) {
    }

    public ngOnInit() {
        if (this._selected == null) {
            this._selected = this.selection.isSelected(this.selectionId)
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
        this.selected = true
    }

    public _changeSelected(newValue: boolean) {
        this._selected = newValue;
        (this.selectedChange as EventEmitter<boolean>).emit(newValue)
        this.cdr.markForCheck()
    }

    public _canChangeSelected(newValue: boolean): boolean {
        return true
    }
}
