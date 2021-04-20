import { UP_ARROW, DOWN_ARROW, ENTER, SPACE } from "@angular/cdk/keycodes"

import { Model } from "../../data.module"

import { Destruct, IDisposable, NzRange } from "../../util"
import { ISelectionModel, ISelectable, Update, SelectOrigin } from "./abstract"


const enum SelectMode {
    SINGLE = 1,
    SINGLE_APPEND = 2,
    FOCUS = 3,
    RANGE = 4,
    APPEND = 5
}


export class SelectionKeyboardHandler<T extends Model = Model> implements IDisposable {
    public instantSelection: boolean = false
    public alwaysAppend: boolean = false
    public disableMouse: boolean = false

    private els: HTMLElement[] = []
    private _keyboardFocused: number = -1

    public readonly destruct = new Destruct(() => {
        while (this.els.length) {
            this.disconnect(this.els[0])
        }
        delete this.els
        delete (this as any).selection
    })


    public constructor(public readonly selection: ISelectionModel<T>) {
    }

    public connect(el: HTMLElement) {
        let idx = this.els.indexOf(el)
        if (idx === -1) {
            this.els.push(el)
            el.addEventListener("keydown", this._handleKeyDown)
            el.addEventListener("keyup", this._handleKeyUp)
        }
    }

    public disconnect(el: HTMLElement) {
        let idx = this.els.indexOf(el)
        if (idx !== -1) {
            this.els.splice(idx, 1)
            el.removeEventListener("keydown", this._handleKeyDown)
            el.removeEventListener("keyup", this._handleKeyUp)
        }
    }

    public reset() {
        this.selection.setFocused(null, null)
        this._keyboardFocused = -1
    }

    protected _handleKeyDown = (event: KeyboardEvent): boolean => {
        switch (event.keyCode) {
            case UP_ARROW:
                this.moveSelection(-1, event.shiftKey, event.ctrlKey)
                break

            case DOWN_ARROW:
                this.moveSelection(1, event.shiftKey, event.ctrlKey)
                break

            case SPACE:
                if (!event.ctrlKey || !event.shiftKey) {
                    return false
                }
            case ENTER:
                const focused = this.selection.focused
                if (focused) {
                    this._keyboardFocused = focused.selectionIndex
                    this.moveSelection(0, event.shiftKey, event.ctrlKey)
                }
                break

            default:
                return false
        }
        event.preventDefault()
        event.stopPropagation()
        return true
    }

    protected _handleKeyUp = (event: KeyboardEvent): boolean => {
        return false
    }

    public handleKeyEvent = (event: KeyboardEvent): boolean => {
        if (event.type === "keydown") {
            return this._handleKeyDown(event)
        } else {
            return this._handleKeyUp(event)
        }
    }

    public handleMouse = (event: PointerEvent, selectable: ISelectable) => {
        if (this.disableMouse) {
            return
        }

        let mode = this.determineMode(event.ctrlKey, event.shiftKey, true)
        this.addToSelection(selectable, mode, true)
    }

    protected moveSelection(direction: number, shift: boolean, ctrl: boolean) {
        let selectables = this.selection.getSelectables().sort((a, b) => a.selectionIndex - b.selectionIndex)
        let nextIdx: number = -1
        if (selectables.length === 0) {
            return
        }

        if (this._keyboardFocused === -1) {
            let focused = this.selection.focused
            if (focused) {
                this._keyboardFocused = focused.selectionIndex
            } else {
                let selected = selectables.filter(s => s.selected)
                if (selected.length) {
                    this._keyboardFocused = direction > 0 ? selected[selected.length - 1].selectionIndex : selected[0].selectionIndex
                }
            }
        }

        if (this._keyboardFocused === -1) {
            let selected = selectables.filter(s => s.selected)
            if (selected.length) {
                nextIdx = direction > 0 ? selected[selected.length - 1].selectionIndex : selected[0].selectionIndex
            } else {
                nextIdx = selectables[0].selectionIndex
            }
        } else if (direction < 0) {
            nextIdx = Math.max(this._keyboardFocused + direction, selectables[0].selectionIndex)
        } else if (direction > 0) {
            nextIdx = Math.min(this._keyboardFocused + direction, selectables[selectables.length - 1].selectionIndex)
        } else {
            nextIdx = this._keyboardFocused
        }

        this._keyboardFocused = nextIdx
        if (nextIdx !== -1) {
            let selectable = this.selection.getSelectables(new NzRange(nextIdx, nextIdx))[0]
            if (selectable) {
                let mode = this.determineMode(shift, ctrl, false)
                if (direction === 0 && mode === SelectMode.FOCUS) {
                    if (this.alwaysAppend) {
                        mode = SelectMode.SINGLE_APPEND
                    } else {
                        mode = SelectMode.SINGLE
                    }
                }
                this.addToSelection(selectable, mode, false)
            }
        }
    }

    protected addToSelection(selectable: ISelectable, mode: SelectMode, isMouse: boolean) {
        if (this.selection.type === "none") {
            return
        }

        let origin: SelectOrigin = isMouse ? "mouse" : "keyboard"
        switch (mode) {
            case SelectMode.SINGLE:
                if (this.alwaysAppend) {
                    this.selection.setSelected(selectable.model.pk, origin)
                } else {
                    this.selection.selected.set([selectable.model as T], origin)
                }
                break

            case SelectMode.SINGLE_APPEND:
                this.selection.setSelected(selectable.model.pk, origin)
                break

            case SelectMode.APPEND:
                let update: Update = {}
                for (const s of this.getNextRangeItems(selectable)) {
                    update[s.model.pk] = origin
                }
                this.selection.update(update)
                break

            case SelectMode.RANGE:
                if (this.alwaysAppend) {
                    let update: Update = {}
                    for (const s of this.getNextRangeItems(selectable)) {
                        update[s.model.pk] = origin
                    }
                    this.selection.update(update)
                } else {
                    this.selection.selected.set(this.getNextRangeItems(selectable).map(s => s.model as T), origin)
                }
                break

            case SelectMode.FOCUS:
                this.selection.setFocused(selectable.model.pk, origin)
                break
        }

        if (mode !== SelectMode.FOCUS) {
            this._keyboardFocused = -1
        }
    }

    protected determineMode(ctrl: boolean, shift: boolean, isMouse: boolean): SelectMode {
        if (ctrl) {
            if (shift) {
                return SelectMode.APPEND
            } else {
                return isMouse ? SelectMode.SINGLE_APPEND : SelectMode.FOCUS
            }
        } else if (shift) {
            return SelectMode.RANGE
        }
        return isMouse || this.instantSelection ? SelectMode.SINGLE : SelectMode.FOCUS
    }

    protected getNextRangeItems(to: ISelectable): ISelectable[] {
        let selectables = this.selection.getSelectables()
        let begin = this._keyboardFocused

        if (begin === -1) {
            begin = selectables[0].selectionIndex
        }

        return selectables.filter(selectable => {
            return selectable.selectionIndex >= begin && selectable.selectionIndex <= to.selectionIndex
        })
    }

    public dispose() {
        this.destruct.run()
    }
}
