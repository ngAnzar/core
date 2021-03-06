import { FastDOM, DottedInputs } from "../../util"


export function replaceClass(el: HTMLElement, prefix: string, newClass: string, instant: boolean) {
    if (instant) {
        if (el.className && el.className.indexOf(prefix) > -1) {
            let found: string[] = []
            el.classList.forEach(v => {
                if (v.indexOf(prefix) === 0) {
                    found.push(v)
                }
            })
            for (const v of found) {
                el.classList.remove(v)
            }
        }

        el.classList.add(newClass)
    } else {
        FastDOM.mutate(replaceClass.bind(null, el, prefix, newClass, true))
    }
}


export type Breakpoints = "all" | "xs" | "sm" | "md" | "lg" | "xl"
    | "lt-sm" | "lt-md" | "lt-lg" | "lt-xl"
    | "gt-xs" | "gt-sm" | "gt-md" | "gt-lg"


export type ValueChange = { value: any, first: boolean, parsed?: any }


export abstract class FlexDirectiveBase<Keys extends string> extends DottedInputs {
    public readonly values: { [B in Breakpoints]?: { [K in Keys]?: ValueChange } } = {} as any

    protected onInputChange(path: string[], value: any, first: boolean): void {
        let [attr, bp] = path as [Keys, Breakpoints]
        bp = bp || "all"

        if (!this.values[bp]) {
            this.values[bp] = {}
        }

        this.values[bp][attr] = { value, first }
    }
}
