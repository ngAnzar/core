export const Zone = (window as any).Zone

export function __zone_symbol__<T extends string>(val: T): T {
    let symbol = typeof Zone !== "undefined" && (Zone as any).__symbol__
        ? (Zone as any).__symbol__(val)
        : `__zone_symbol__${val}`
    return typeof window[symbol] !== "undefined" ? symbol : val
}
