import { FastDOM } from "../../util"


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
