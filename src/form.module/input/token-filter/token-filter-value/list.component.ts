import { TokenFilterValue } from "./abstract"


export abstract class TokenFilterListValue extends TokenFilterValue {
    public abstract readonly dataSource: any
}
