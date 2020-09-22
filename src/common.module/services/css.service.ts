import { Injectable, OnDestroy, Inject } from "@angular/core"
import { BreakPointRegistry, BreakPoint } from "@angular/flex-layout"


export type CssProps = { [P in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[P] }


@Injectable({ providedIn: "root" })
export class CssService implements OnDestroy {
    public readonly breakpoints: BreakPoint[] = []

    private _styleEl: { [key: string]: HTMLStyleElement } = {}
    private _ruleInserted = new Set<string>()
    private _bpr: { [key: string]: BreakPoint } = {}

    public constructor(@Inject(BreakPointRegistry) private readonly bpr: BreakPointRegistry) {
        this.breakpoints = [{ alias: "all", mediaQuery: "all", priority: -1000 } as BreakPoint].concat(bpr.items)
        for (const bp of this.breakpoints) {
            this._bpr[bp.alias] = bp
        }
    }

    public insertRule(selector: string, props: CssProps | string, breakpoint: string = "all"): string {
        if (!this._ruleInserted.has(selector)) {
            this._ruleInserted.add(selector)
            const el = this.getStyleEl(breakpoint)
            const style = typeof props === "string" ? props : this.renderProps(props)
            el.sheet.insertRule(`${selector} {${style}}`)
        }
        return selector
    }

    protected renderProps(props: CssProps): string {
        let res = ""
        for (const k in props) {
            res += `${convertCase(k)}:${props[k]};`
        }
        return res
    }

    protected getStyleEl(breakpoint: string) {
        if (!this._styleEl[breakpoint]) {
            const bp = this._bpr[breakpoint]
            const styleEl = document.createElement("style")
            styleEl.media = bp.mediaQuery
            styleEl.type = "text/css"
            styleEl.dataset["nzflex"] = `${bp.priority}`

            const styles = document.querySelectorAll<HTMLStyleElement>("style[data-nzflex]")
            if (styles.length === 0) {
                document.getElementsByTagName("head")[0].appendChild(styleEl)
            } else {
                for (let i = 0, l = styles.length; i < l; i++) {
                    const existing = styles[i]
                    if (Number(existing.dataset["nzflex"]) > bp.priority) {
                        existing.parentElement.insertBefore(styleEl, existing)
                        break
                    }
                }
                if (!styleEl.parentElement) {
                    const last = styles[styles.length - 1]
                    if (last.nextElementSibling) {
                        last.parentElement.insertBefore(styleEl, last.nextElementSibling)
                    } else {
                        last.parentElement.appendChild(styleEl)
                    }
                }
            }

            this._styleEl[breakpoint] = styleEl
        }
        return this._styleEl[breakpoint]
    }

    public ngOnDestroy() {
        for (const k in this._styleEl) {
            const el = this._styleEl[k]
            if (el.parentNode) {
                el.parentNode.removeChild(el)
            }
        }
        this._styleEl = {}
    }
}

function convertCase(str: string) {
    return str.replace(/([A-Z])/g, "-$1").toLowerCase()
}
