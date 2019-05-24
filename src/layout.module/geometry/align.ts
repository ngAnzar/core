export type HAlign = "left" | "right" | "center"
export type VAlign = "top" | "bottom" | "center"
// export type Align = HAlign | VAlign
export type Align = { horizontal: HAlign, vertical: VAlign }
export type AlignInput = "top left" | "top right" | "top center" |
    "bottom left" | "bottom right" | "bottom center" |
    "left top" | "left bottom" | "left center" |
    "right top" | "right bottom" | "right center" |
    "center" | "center center"

export type MarginParsed = { top: number, right: number, bottom: number, left: number }
export type Margin = Partial<MarginParsed> | number | string

const CENTER_ALIGN: Align = { horizontal: "center", vertical: "center" }
export const OPPOSITE_ALIGN: { [key: string]: string } = {
    "left": "right",
    "right": "left",
    "top": "bottom",
    "bottom": "top",
    "center": "center"
}

export function parseAlign(align: Align | AlignInput): Align {
    if (typeof align !== "string") {
        if ("horizontal" in align && "vertical" in align) {
            return align
        }
        throw new Error(`Invalid align value: ${align}`)
    }

    if (align === "center") {
        return CENTER_ALIGN
    } else {
        let parts = align.split(/\s+/)
        if (parts.length !== 2) {
            throw new Error(`Invalid align value: ${align}`)
        }

        let res = {} as Align
        let i
        if ((i = parts.indexOf("left")) !== -1 || (i = parts.indexOf("right")) !== -1) {
            res.horizontal = parts.splice(i, 1)[0] as HAlign
        }
        if ((i = parts.indexOf("top")) !== -1 || (i = parts.indexOf("bottom")) !== -1) {
            res.vertical = parts.splice(i, 1)[0] as VAlign
        }

        switch (parts.length as number) {
            case 0:
                return res

            case 1:
                if (parts.indexOf("center") !== -1) {
                    if (res.horizontal) {
                        res.vertical = "center"
                    } else {
                        res.horizontal = "center"
                    }
                    return res
                }
                break

            case 2:
                if (parts[0] === "center" && parts[1] === "center") {
                    return CENTER_ALIGN
                }
                break

        }
    }
    throw new Error(`Invalid align value: ${align}`)
}




export function parseMargin(val: Margin): MarginParsed {
    if (typeof val === "number") {
        return { top: val, right: val, bottom: val, left: val }
    } else {
        let m = { top: 0, right: 0, bottom: 0, left: 0 }
        if (typeof val === "string") {
            let parts = val.replace(/px/g, "").split(/\s+/).map(Number)
            switch (parts.length) {
                case 1:
                    m.top = m.left = m.right = m.bottom = parts[0]
                    break

                case 2:
                    m.top = m.bottom = parts[0]
                    m.left = m.right = parts[1]
                    break

                case 3:
                    m.top = parts[0]
                    m.left = m.right = parts[1]
                    m.bottom = parts[2]
                    break

                case 4:
                    m.top = parts[0]
                    m.right = parts[1]
                    m.bottom = parts[2]
                    m.left = parts[3]
                    break

                default:
                    throw new Error(`Invalid value: ${val}`)
            }
        } else if (val) {
            m.top = val.top || 0
            m.right = val.right || 0
            m.bottom = val.bottom || 0
            m.left = val.left || 0
        }
        return m
    }
}
