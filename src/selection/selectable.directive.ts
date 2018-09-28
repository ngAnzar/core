import { Directive, Input, Output, EventEmitter, Inject, OnDestroy, OnInit, ChangeDetectorRef } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { SelectionModel } from "./selection.directive"


export interface SelectedEvent {
    source: Selectable
    selected: boolean
}


export interface Selectable {
    selected: boolean
    readonly selectedChange: Observable<boolean>

    // egyedi azonosító, lehetőleg mindig maradjon meg az eredeti egy adott elemhez
    selectionId: string
    // selectionData: any
}


let UID_COUNTER = 0

@Directive({
    selector: "[selectable]",
    host: {
        "[attr.selection-id]": "selectionId",
        "[attr.selected]": "selected ? '' : null"
    }
})
export class SelectableDirective implements Selectable, OnDestroy, OnInit {
    @Input("selection-id")
    public set selectionId(value: string) {
        this._selectionId = value
    }
    public get selectionId() {
        return this._selectionId
            ? this._selectionId
            : (this._uid ? this._uid : this._uid = `nz-selectable-${++UID_COUNTER}`)
    }
    protected _selectionId?: string
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
        @Inject(SelectionModel) protected selection: SelectionModel<SelectableDirective>,
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
}
