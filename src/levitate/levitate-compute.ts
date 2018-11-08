import { Rect, Point, Margin, HAlign, VAlign, Align, parseAlign } from "../rect-mutation.service"

import { LevitateRef } from "./levitate-ref"


export interface AnchorPosition {
    align: Align | string,
    offsetX?: number
    offsetY?: number
}

export type Rects = {
    levitate: Rect,
    anchor: Rect,
    constraint: Rect
}
// export type Margin = { inside: Offset, outside: Offset }

export interface LevitatingPosition {
    top?: number
    left?: number
    right?: number
    bottom?: number
    maxWidth?: number
    maxHeight?: number

    anchor?: {
        position: AnchorPosition
        levitate: AnchorPosition
    }
}


export interface Grow {
    from: Point
    direction: Align
}


export interface Anchor {
    ref: HTMLElement | Rect | "viewport"
    align: Align | string,
    margin?: Margin
}


export interface Levitating extends Anchor {
    ref: HTMLElement
    width?: number
    height?: number
    maxWidth?: number
    maxHeight?: number
    minWidth?: number
    minHeight?: number
}


export interface Constraint {
    ref: HTMLElement | "viewport"
    margin?: Margin
}


function drawRect(r: Rect, color: string) {
    let div = document.createElement("div")
    div.style.position = "absolute"
    div.style.left = `${r.left}px`
    div.style.top = `${r.top}px`
    div.style.width = `${r.width}px`
    div.style.height = `${r.height}px`
    div.style.border = `1px solid ${color}`
    div.style.zIndex = `123456789`
    // div.innerHTML = ``
    document.body.appendChild(div)
}


export class MagicCarpet {
    public constructor(public ref: LevitateRef) {
    }

    // TODO: ne itt parseoljon
    public levitate(rects: Rects): LevitatingPosition {
        let lAlign = parseAlign(this.ref.levitate.align || "center")

        let pA
        let pV

        if (this.ref.anchor) {
            let cAlign = parseAlign(this.ref.anchor.align || "center")
            pA = calcPlacementH[`${lAlign.horizontal}-${cAlign.horizontal}`](rects.levitate, rects.anchor, rects.constraint)
            pV = calcPlacementV[`${lAlign.vertical}-${cAlign.vertical}`](rects.levitate, rects.anchor, rects.constraint)
        } else if (this.ref.constraint) {
            pA = calcPlacementH[`${lAlign.horizontal}-${lAlign.horizontal}`](rects.levitate, rects.constraint, rects.constraint)
            pV = calcPlacementV[`${lAlign.vertical}-${lAlign.vertical}`](rects.levitate, rects.constraint, rects.constraint)
        }

        let possibilities: Array<{ placements: Placement[], rect: Rect }> = []
        for (let a of pA) {
            for (let b of pV) {
                let r = a.rect.intersection(b.rect)
                if (r) {
                    possibilities.push({
                        placements: [a, b],
                        rect: r
                    })
                    // drawRect(r)
                }
            }
        }

        let result = possibilities.find((item) => {
            return rects.levitate.isInside(item.rect)
        })

        result = result || possibilities.sort((a, b) => {
            return b.rect.area - a.rect.area
        })[0]

        // console.log(rects, result)

        // let result = this.levitateRect.copy()
        // result.top = best.rect.top
        // result.left = best.rect.left
        // result = best.rect.constraint(result)

        return getLevitatingPosition(result.placements[0], result.placements[1], rects.levitate, result.rect, rects.anchor)
    }

    public dispose(): void {
        delete this.ref
    }
}


type Placement = {
    rect: Rect,
    levitate: HAlign | VAlign
    target: HAlign | VAlign
    orient: "H" | "V"
}


type Calculator = (levitate: Readonly<Rect>, target: Readonly<Rect>, constraint: Readonly<Rect>) => Placement[]
type Calculators = { [key: string]: Calculator }


function placementCalculator(levitateAlign: HAlign | VAlign, targetAlign: HAlign | VAlign, orient: "H" | "V", opposit?: Calculator): Calculator {
    return function (levitate: Readonly<Rect>, target: Readonly<Rect>, constraint: Readonly<Rect>): Placement[] {
        let placement = constraint.copy()
        placement[levitateAlign] = target[targetAlign]

        let res: Placement[] = [{
            rect: constraint.constraint(placement),
            levitate: levitateAlign,
            target: targetAlign,
            orient: orient
        }]
        if (opposit) {
            res = res.concat(opposit(levitate, target, constraint))
        }

        return res.sort((a, b) => {
            if (a.rect.width < levitate.width) {
                return 1
            }
            return 0
        })
    }
}


// levitateAlign-targetAlign
const calcPlacementH: Calculators = {}
const calcPlacementV: Calculators = {}
const aligns: Array<HAlign | VAlign> = ["top", "right", "bottom", "left", "center"]
const opposite: { [key: string]: HAlign | VAlign } = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
    center: null
}

for (let a1 of aligns) {
    for (let a2 of aligns) {
        let o1 = opposite[a1]
        let o2 = opposite[a2]

        calcPlacementH[`${a1}-${a2}`] = placementCalculator(a1, a2, "H",
            o1 && o2 ? placementCalculator(o1, o2, "H") : null)
        calcPlacementV[`${a1}-${a2}`] = placementCalculator(a1, a2, "V",
            o1 && o2 ? placementCalculator(o1, o2, "V") : null)
    }
}


function getLevitatingPosition(pA: Placement, pV: Placement, levitate: Rect, constraint: Rect, connect?: Rect): LevitatingPosition {
    // drawRect(levitate, "red")

    let rect = levitate.copy()
    rect[pA.levitate] = constraint[pA.levitate]
    rect[pV.levitate] = constraint[pV.levitate]
    rect = constraint.constraint(rect)

    // drawRect(rect, "green")
    // drawRect(constraint, "black")

    let res: LevitatingPosition & { [key: string]: any } = {
        maxWidth: Math.round(constraint.width),
        maxHeight: Math.round(constraint.height),
        left: pA.levitate === "right" ? Math.round(constraint.right) - Math.round(levitate.width) : Math.round(rect.left),
        top: pV.levitate === "bottom" ? Math.round(constraint.bottom) - Math.round(levitate.height) : Math.round(rect.top),
        anchor: {
            position: {
                align: {
                    horizontal: pA.target as HAlign,
                    vertical: pV.target as VAlign
                }
            },
            levitate: {
                align: {
                    horizontal: pA.levitate as HAlign,
                    vertical: pV.levitate as VAlign
                }
            }
        }
    }


    return res
}

