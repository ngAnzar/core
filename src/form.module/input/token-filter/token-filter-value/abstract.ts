import { Observable } from "rxjs"

export interface Suggestion {
    value: any
    label: string
}

export abstract class TokenFilterValue {
    public readonly inputMask: any // TODO
    public readonly inputType: "text" | "number"

    // public abstract init(value: any | undefined): Observable<string>
    // public abstract suggest(input: Observable<string | undefined>): Observable<Suggestion>
}


export abstract class TokenFilterSimpleValue extends TokenFilterValue {

}
