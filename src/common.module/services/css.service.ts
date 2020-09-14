import { Injectable, OnDestroy } from "@angular/core"


export type CssProps = { [P in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[P] }


@Injectable({ providedIn: "root" })
export class CssService implements OnDestroy {
    private _styleEl: { [key: string]: HTMLStyleElement } = {}
    private _ruleInserted = new Set<string>()

    public insertRule(selector: string, props: CssProps | string, media: string = "all"): string {
        if (!this._ruleInserted.has(selector)) {
            this._ruleInserted.add(selector)
            const el = this.getStyleEl(media)
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

    protected getStyleEl(media: string) {
        if (!this._styleEl[media]) {
            const styleEl = document.createElement("style")
            styleEl.media = media
            styleEl.type = "text/css"
            document.getElementsByTagName("head")[0].appendChild(styleEl)
            this._styleEl[media] = styleEl
        }
        return this._styleEl[media]
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
