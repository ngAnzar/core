import { FloatingOptions } from "./floating.options"


export class FloatingCalculation {

    constructor(public css: { [key: string]: string | number }) { }

    apply(element, difference?: FloatingCalculation) {
        let dcss = (difference ? difference.css : null)

        for (let k in this.css) {
            let v = this.css[k]
            if (dcss && dcss[k] === v) {
                continue
            }
            element.style[k] = v
        }
    }
}


export class FloatingRef {
    private lastCalc: FloatingCalculation

    constructor(protected _options: FloatingOptions) { }

    // olyan observable-val tér vissza, ami mindig frissül,
    // amikor módosítani kell a cél elem tulajdonságait
    /**
     * let floating = Floating.create(options...)
     * floating.subscribe(css => css(element))
     */
    subscribe() {

    }

    unsubscribe() {

    }

    /**
     * Csak a meghíváskor számolja ki, és alkalmazza a css-t
     */
    apply() {
        this.compute().apply(this._options.floating.ref)
    }

    compute(): FloatingCalculation {
        let css = {}

        return new FloatingCalculation(css)
    }
}
