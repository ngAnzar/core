import { Rect, HAlign, VAlign } from "../../util"

import { LevitateRef } from "./levitate-ref"
import { LevitatePosition } from "./levitate-position"


// export interface AnchorPosition {
//     align: Align | AlignInput,
//     offsetX?: number
//     offsetY?: number
// }

export type Rects = {
    levitate: Rect,
    anchor: Rect,
    constraint: Rect
}


export type CalculatedPlacement = { placements: [Placement, Placement], rect: Rect }


function drawRect(r: Rect, color: string) {
    let div = document.createElement("div")
    div.style.position = "absolute"
    div.style.left = `${r.left}px`
    div.style.top = `${r.top}px`
    div.style.width = `${r.width}px`
    div.style.height = `${r.height}px`
    div.style.border = `1px solid ${color}`
    div.style.zIndex = `123456789`
    div.style.pointerEvents = "none"
    div.setAttribute("origin", `${r.origin.horizontal}:${r.origin.vertical}/X:${r.x} Y:${r.y}`)
    document.body.appendChild(div)
    console.log(color, r)
}


export class MagicCarpet {
    public constructor(public ref: LevitateRef) {
    }

    public levitate(rects: Rects): LevitatePosition {
        const possibilities = this.getPlacements(rects)

        let result = possibilities.find((item) => {
            return rects.levitate.width <= item.rect.width && rects.levitate.height <= item.rect.height
        })

        result = result || possibilities.sort((a, b) => {
            return b.rect.area - a.rect.area
        })[0]

        return getLevitatePosition(result.placements[0], result.placements[1], rects.levitate, result.rect, rects.anchor)
    }

    public getPlacements(rects: Rects) {
        const lAlign = rects.levitate.origin
        let levitate = rects.levitate, anchor, constraint
        let primaryHAlign: string, primaryVAlign: string
        let oppositeHAlign: string, oppositeVAlign: string

        // TODO: jó megoldás az oppsoite oldal számításra

        if (this.ref.anchor) {
            const cAlign = rects.anchor.origin
            anchor = rects.anchor
            constraint = rects.constraint
            primaryHAlign = `${lAlign.horizontal}-${cAlign.horizontal}`
            primaryVAlign = `${lAlign.vertical}-${cAlign.vertical}`

            oppositeHAlign = `${opposite[lAlign.horizontal]}-${opposite[cAlign.horizontal]}`
            oppositeVAlign = `${opposite[lAlign.vertical]}-${opposite[cAlign.vertical]}`
        } else if (this.ref.constraint) {
            anchor = constraint = rects.constraint
            primaryHAlign = `${lAlign.horizontal}-${lAlign.horizontal}`
            primaryVAlign = `${lAlign.vertical}-${lAlign.vertical}`

            oppositeHAlign = `${opposite[lAlign.horizontal]}-${opposite[lAlign.horizontal]}`
            oppositeVAlign = `${opposite[lAlign.vertical]}-${opposite[lAlign.vertical]}`
        }

        let hPlacements = [
            calcPlacementH[primaryHAlign](levitate, anchor, constraint),
            calcPlacementH[oppositeHAlign](levitate, anchor, constraint),
        ]

        let vPlacements = [
            calcPlacementV[primaryVAlign](levitate, anchor, constraint),
            calcPlacementV[oppositeVAlign](levitate, anchor, constraint)
        ]

        let result = []
        for (let hPlacement of hPlacements) {
            for (let vPlacement of vPlacements) {
                let r = hPlacement.rect.intersection(vPlacement.rect)
                if (r) {
                    result.push({
                        placements: [hPlacement, vPlacement],
                        rect: r
                    })
                }
            }
        }
        return result
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


type Calculator = (levitate: Readonly<Rect>, target: Readonly<Rect>, constraint: Readonly<Rect>) => Placement
type Calculators = { [key: string]: Calculator }


function placementCalculator(levitateAlign: HAlign | VAlign, targetAlign: HAlign | VAlign, orient: "H" | "V"): Calculator {
    return function (levitate: Readonly<Rect>, target: Readonly<Rect>, constraint: Readonly<Rect>): Placement {
        let placement = constraint.copy()

        if (targetAlign === "stretch") {
            if (orient === "H") {
                placement.left = target.left
                placement.width = target.width
            } else if (orient === "V") {
                placement.top = target.top
                placement.height = target.height
            }
        } else if (levitateAlign === "center" && targetAlign === "center") {
            placement[levitateAlign] = target[targetAlign]
        } else if (levitateAlign === "center" || targetAlign === "center") {
            throw new Error("Not implemented...")
        } else {
            placement[levitateAlign] = target[targetAlign]
        }

        return {
            rect: constraint.constraint(placement),
            levitate: levitateAlign,
            target: targetAlign,
            orient: orient
        }
    }
}


// levitateAlign-targetAlign
const calcPlacementH: Calculators = {}
const calcPlacementV: Calculators = {}
const aligns: Array<HAlign | VAlign> = ["top", "right", "bottom", "left", "center", "stretch"]
const opposite: { [key: string]: HAlign | VAlign } = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
    center: "center",
    stretch: "stretch",
}

for (let a1 of aligns) {
    for (let a2 of aligns) {
        calcPlacementH[`${a1}-${a2}`] = placementCalculator(a1, a2, "H")
        calcPlacementV[`${a1}-${a2}`] = placementCalculator(a1, a2, "V")
    }
}


function getLevitatePosition(pA: Placement, pV: Placement, levitate: Rect, constraint: Rect, connect: Rect): LevitatePosition {
    // drawRect(pA.rect, "yellow")
    // drawRect(pV.rect, "yellow")
    // drawRect(levitate, "red")

    let rect = levitate.copy()
    rect.setOrigin({ horizontal: pA.levitate as HAlign, vertical: pV.levitate as VAlign })

    let fixWidth: number = null
    let fixHeight: number = null
    let rectPropH: string = pA.levitate
    let rectPropV: string = pV.levitate
    let connectPropH: string = pA.target
    let connectPropV: string = pV.target

    if (pA.target === "center") {
        rectPropH = "centerHorizontal"
        connectPropH = "centerHorizontal"
    } else if (pA.target === "stretch") {
        rectPropH = "left"
        connectPropH = "left"
        fixWidth = connect.width
    }

    if (pV.target === "center") {
        rectPropV = "centerVertical"
        connectPropV = "centerVertical"
    } else if (pV.target === "stretch") {
        rectPropV = "top"
        connectPropV = "top"
        fixHeight = connect.height
    }

    rect[rectPropH] = connect[connectPropH]
    rect[rectPropV] = connect[connectPropV]

    // let x = pA.target === "center" ? connect.centerHorizontal : connect[pA.target]
    // let y = pV.target === "center" ? connect.centerVertical : connect[pV.target]

    // if (pA.levitate === "center") {
    //     rect.centerHorizontal = x
    // } else {
    //     rect[pA.levitate] = x
    // }

    // if (pV.levitate === "center") {
    //     rect.centerVertical = y
    // } else {
    //     rect[pV.levitate] = y
    // }

    rect = constraint.constraint(rect)


    // drawRect(rect, "green")
    // drawRect(constraint, "black")
    // drawRect(connect, "purple")

    return new LevitatePosition(
        rect,
        constraint,
        fixWidth ? fixWidth : Math.round(constraint.width),
        fixHeight ? fixHeight : Math.round(constraint.height),
        fixWidth,
        fixHeight
    )
}

