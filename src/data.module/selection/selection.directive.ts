import { Directive, OnDestroy, EventEmitter, Input, Output, Attribute, SkipSelf, Self } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { Model, ID } from "../model"
import { SelectionModel, ISelectionModel, ISelectable, Update, SelectionEvent, SelectOrigin } from "./abstract"


@Directive({
    selector: "[selection=single]",
    exportAs: "selection",
    providers: [
        { provide: SelectionModel, useExisting: SingleSelection },
    ]
})
export class SingleSelection<T extends Model = Model> extends SelectionModel<T> {
    public readonly type = "single"

    protected selectedId: ID

    public update(update: Update): void {
        let newSid = this.selectedId
        let newOrigin: SelectOrigin
        for (let k in update) {
            if (update[k]) {
                newSid = k
                newOrigin = update[k]
                break
            } else if (k === newSid) {
                newSid = null
                newOrigin = null
            }
        }

        if (this.selectedId) {
            update[this.selectedId] = null
        }

        for (let k in update) {
            update[k] = k === newSid ? newOrigin : null
        }
        this.selectedId = newSid
        super.update(update)
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


const SELECTION = Symbol("selection")


@Directive({
    selector: "[selection]:not([selection=single]):not([selection=multi])",
    exportAs: "selection",
    providers: [
        { provide: SelectionModel, useExisting: PropagateSelection }
    ]
})
export class PropagateSelection<T extends Model = Model> implements ISelectionModel<T> {
    @Input("selection")
    protected set __selectionModel(val: SelectionModel<T>) {
        this[SELECTION] = val
    }
    private [SELECTION]: SelectionModel<T>


    public get items(): T[] { return this[SELECTION].items }
    public set items(val: T[]) { this[SELECTION].items = val }

    public get maintainSelection(): boolean { return this[SELECTION].maintainSelection }
    public set maintainSelection(val: boolean) { this[SELECTION].maintainSelection = val }

    public get type(): string { return this[SELECTION].type }
    public get changes(): Observable<SelectionEvent<T>> { return this[SELECTION].changes }

    public update(update: Update): void { this[SELECTION].update(update) }
    public clear(): void { this[SELECTION].clear() }
    public getSelectOrigin(what: ID): SelectOrigin { return this[SELECTION].getSelectOrigin(what) }
    public setSelected(what: ID, selected: SelectOrigin): void { this[SELECTION].setSelected(what, selected) }
    public _handleOnDestroy(cmp: ISelectable<T>): void { this[SELECTION]._handleOnDestroy(cmp) }
    public _handleModelChange(cmp: ISelectable<T>, oldModel: T, newModel: T): void { this[SELECTION]._handleModelChange(cmp, oldModel, newModel) }
}
