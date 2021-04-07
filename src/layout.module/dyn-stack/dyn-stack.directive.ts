import { ChangeDetectorRef, Directive, EmbeddedViewRef, Inject, TemplateRef, ViewContainerRef, ViewRef } from "@angular/core"

import { FastDOM } from "../../util"


export interface DynStackContext<T> {
    $implicit: T
    animating: boolean
}

type DynStackEVR<T> = EmbeddedViewRef<DynStackContext<T>>

const transition = "transform 400ms cubic-bezier(0.215, 0.61, 0.355, 1)"

const ANIMATIONS = {
    "right-in": {
        "init": {
            "transform": "translate(100%,0)",
            "position": "relative",
            "visibility": "visible",
        },
        "start": {
            "transform": "translate(0,0)",
        }
    },
    "right-out": {
        "init": {
            "position": "absolute"
        },
        "start": {
            "transform": "translate(-100%,0)",
        }
    },
    "left-in": {
        "init": {
            "transform": "translate(-100%,0)",
            "position": "relative",
            "visibility": "visible",
        },
        "start": {
            "transform": "translate(0,0)",
        }
    },
    "left-out": {
        "init": {
            "position": "absolute"
        },
        "start": {
            "transform": "translate(100%,0)",
        }
    },
}


@Directive({
    selector: "[nzDynStack]",
    exportAs: "nzDynStack"
})
export class DynStackDirective<T> {
    public constructor(
        @Inject(ViewContainerRef) private readonly _vcr: ViewContainerRef,
        @Inject(TemplateRef) private readonly _tpl: TemplateRef<DynStackContext<T>>,
        @Inject(ChangeDetectorRef) private readonly _cdr: ChangeDetectorRef) {
    }

    public next(item: T) {
        this._addNewItem(item, "last")

    }

    public prev(item: T) {
        this._addNewItem(item, "first")
    }

    private _createContext(item: T): DynStackContext<T> {
        return {
            "$implicit": item,
            "animating": false,
        }
    }

    private _addNewItem(item: T, position: "first" | "last") {
        const newIndex = position === "first" ? 0 : this._vcr.length

        const evr = this._vcr.createEmbeddedView(this._tpl, this._createContext(item), newIndex)
        const newRoot = _rootNode(evr)
        newRoot.style.visibility = "hidden"

        evr.detectChanges()

        let prevEvr: DynStackEVR<T>
        let anim: "left" | "right"

        if (position === "first") {
            prevEvr = this._vcr.get(1) as DynStackEVR<T>
            anim = "left"
        } else if (position === "last") {
            prevEvr = this._vcr.get(newIndex - 1) as DynStackEVR<T>
            anim = "right"

        }

        if (prevEvr) {
            const prevNode = _rootNode(prevEvr)
            const animationIn = (ANIMATIONS as any)[`${anim}-in`]
            const animationOut = (ANIMATIONS as any)[`${anim}-out`]

            FastDOM.measure(() => {
                const prevNodeWidth = prevNode.offsetWidth

                FastDOM.setStyle(prevNode, { ...animationOut.init, width: `${prevNodeWidth}px` })

                FastDOM.setStyle(newRoot, animationIn.init, () => {
                    FastDOM.mutate(() => {
                        newRoot.style.transition = transition
                        window.getComputedStyle(newRoot)

                        this._animate(prevNode, `${anim}-out` as any, prevEvr)
                        this._animate(newRoot, `${anim}-in` as any)
                    })
                })
            })
        } else {
            FastDOM.setStyle(newRoot, { visibility: "visible", transition })
        }
    }

    private _animate(el: HTMLElement, animation: keyof typeof ANIMATIONS, remove?: DynStackEVR<any>) {
        const anim = ANIMATIONS[animation] as any

        if (remove) {
            el.addEventListener("transitionend", () => {
                const idx = this._vcr.indexOf(remove)
                if (idx !== -1) {
                    this._vcr.remove(idx)
                    // kell, enélkül nem mindig tünteti el a nodeokat
                    this._cdr.detectChanges()
                }
            })
        }

        anim.start && FastDOM.setStyle(el, anim.start)
    }
}


function _rootNode(evr: DynStackEVR<any>): HTMLElement {
    let result: HTMLElement
    for (const entry of evr.rootNodes) {
        if ((entry as Node).nodeType === Node.ELEMENT_NODE) {
            if (!result) {
                result = entry
            } else {
                throw new Error("Multiple root element is not supported")
            }
        }
    }
    if (!result) {
        throw new Error("Missing root element")
    }
    return result
}
