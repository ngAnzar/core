import { Rect, Margin, Align, AlignInput } from "../../layout.module"


export interface Anchor {
    ref: HTMLElement | Rect | "viewport"
    align: Align | AlignInput,
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
    inset?: Margin
}


export interface ConcretePosition {
    x: boolean
    y: boolean
}
