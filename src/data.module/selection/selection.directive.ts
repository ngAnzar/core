import { Directive, Input } from "@angular/core"
import { FocusOrigin } from "@angular/cdk/a11y"
import { Observable } from "rxjs"

import { NzRange } from "../../util"
import { Model, PrimaryKey } from "../model"
import { SelectionModel, ISelectionModel, ISelectable, Update, SelectionEvent, SelectOrigin, SelectionItems } from "./abstract"
import { SelectionKeyboardHandler } from "./keyboard-handler"


@Directive({
    selector: "[selection=single]",
    exportAs: "selection",
    providers: [
        { provide: SelectionModel, useExisting: SingleSelection },
    ]
})
export class SingleSelection<T extends Model = Model> extends SelectionModel<T> {
    public readonly type = "single"

    protected selectedId: PrimaryKey

    public update(update: Update): void {
        let up: Update = {}
        for (const k in this.selected.byId) {
            up[k] = null
        }
        for (const k in update) {
            if (up[k] = update[k]) {
                break
            }
        }
        return super.update(up)
    }
}


@Directive({
    selector: "[selection=multi]",
    exportAs: "selection",
    providers: [
        { provide: SelectionModel, useExisting: MultiSelection },
    ]
})
export class MultiSelection<T extends Model = Model> extends SelectionModel<T> {
    public readonly type = "multi"
}


@Directive({
    selector: "[selection=none]",
    exportAs: "selection",
    providers: [
        { provide: SelectionModel, useExisting: NoneSelection },
    ]
})
export class NoneSelection<T extends Model = Model> extends SelectionModel<T> {
    public readonly type = "none"

    public update(update: Update): void {
        this.selected.update({})
    }

    public getSelectables(range?: NzRange, onlySelected?: boolean): ISelectable[] {
        return []
    }
}


const SELECTION = Symbol("selection")


@Directive({
    selector: "[selectionModel]",
    exportAs: "selection",
    providers: [
        { provide: SelectionModel, useExisting: PropagateSelection }
    ]
})
export class PropagateSelection<T extends Model = Model> implements ISelectionModel<T> {
    @Input("selectionModel")
    public set selection(val: ISelectionModel<T>) {
        this[SELECTION] = val
    }
    private [SELECTION]: ISelectionModel<T>

    public get items(): T[] { return this[SELECTION].items }
    public set items(val: T[]) { this[SELECTION].items = val }

    public get maintainSelection(): boolean { return this[SELECTION].maintainSelection }
    public set maintainSelection(val: boolean) { this[SELECTION].maintainSelection = val }

    public get type(): string { return this[SELECTION].type }
    public get changes(): Observable<SelectionEvent<T>> { return this[SELECTION].changes }
    public get keyboard(): SelectionKeyboardHandler<T> { return this[SELECTION].keyboard }
    public get selected(): SelectionItems<T> { return this[SELECTION].selected }
    public get focused(): ISelectable { return this[SELECTION].focused }

    public update(update: Update): void { this[SELECTION].update(update) }
    public clear(): void { this[SELECTION].clear() }
    public getSelectOrigin(what: PrimaryKey): SelectOrigin { return this[SELECTION].getSelectOrigin(what) }
    public setSelected(what: PrimaryKey, selected: SelectOrigin): void { this[SELECTION].setSelected(what, selected) }
    public getSelectables(range?: NzRange, onlySelected?: boolean): ISelectable[] { return this[SELECTION].getSelectables(range, onlySelected) }
    public setFocused(what: PrimaryKey, origin: FocusOrigin): void { this[SELECTION].setFocused(what, origin) }
    public _handleOnDestroy(cmp: ISelectable<T>): void { this[SELECTION]._handleOnDestroy(cmp) }
    public _handleModelChange(cmp: ISelectable<T>, oldModel: T, newModel: T): void { this[SELECTION]._handleModelChange(cmp, oldModel, newModel) }
}
